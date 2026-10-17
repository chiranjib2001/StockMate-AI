import json
import time
import httpx
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime
from app.core.config import settings
from app.privacy.masking import PrivacyMasker, redact_pii
from app.database import db

class GemmaService:
    def __init__(self):
        self.ollama_url = f"{settings.OLLAMA_BASE_URL}/api/generate"
        self.model_name = settings.GEMMA_MODEL

    async def _call_gemma(self, prompt: str, is_json: bool = True) -> Tuple[str, float, Optional[str]]:
        t0 = time.time()
        payload = {
            "model": self.model_name,
            "prompt": prompt,
            "stream": False,
        }
        if is_json:
            payload["format"] = "json"

        try:
            async with httpx.AsyncClient(timeout=45.0) as client:
                res = await client.post(self.ollama_url, json=payload)
                res.raise_for_status()
                data = res.json()
                latency = time.time() - t0
                return data.get("response", "").strip(), latency, None
        except Exception as e:
            latency = time.time() - t0
            print(f"[GemmaService] Ollama call error: {e}")
            return "", latency, str(e)

    async def parse_natural_language_intent(
        self,
        raw_user_input: str,
        current_products: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Interprets natural language statements such as:
        'I received 15 blue linen shirts and sold 3 today.'
        """
        # Step 1: PII Sanitization on raw user input
        clean_input, pii_detected = redact_pii(raw_user_input)

        # Step 2: Build safe product reference context
        safe_products, ref_to_id, privacy_audit = PrivacyMasker.build_safe_context(
            current_products,
            use_pseudonyms=False
        )

        catalog_summary = [
            {"product_name": p["product_name"], "current_stock": p["quantity_on_hand"], "ref": p["product_ref"]}
            for p in safe_products
        ]

        system_prompt = f"""You are StockMate AI's natural language inventory parser.
Extract the user's intended inventory change.

Current Available Products in Store:
{json.dumps(catalog_summary, indent=2)}

User Statement: "{clean_input}"

Identify:
1. "action": one of ["sale", "restock", "adjustment", "loss", "new_product"]
2. "product_name": target product mentioned or best match from catalog
3. "quantity": positive integer count mentioned
4. "reasoning": brief explanation of why this was inferred

Output MUST be valid JSON in this exact structure:
{{
  "action": "sale" | "restock" | "adjustment" | "loss" | "new_product",
  "product_name": "string",
  "quantity": integer,
  "confidence": float (0.0 to 1.0),
  "reasoning": "string"
}}"""

        raw_resp, latency, err = await self._call_gemma(system_prompt, is_json=True)

        # Fallback if Ollama error
        parsed = {}
        if not err and raw_resp:
            try:
                parsed = json.loads(raw_resp)
            except Exception:
                parsed = {"action": "unknown", "product_name": "", "quantity": 0, "confidence": 0.0, "reasoning": raw_resp}
        else:
            parsed = {
                "action": "adjustment",
                "product_name": clean_input,
                "quantity": 1,
                "confidence": 0.5,
                "reasoning": f"Local rule fallback (Ollama message: {err})"
            }

        # Step 3: Match with real product in DB
        target_name = parsed.get("product_name", "").lower()
        matched_prod = None
        for p in current_products:
            p_name = p.get("name", "").lower()
            if target_name in p_name or p_name in target_name:
                matched_prod = p
                break
        
        # If no exact match, fallback to first product or none
        action = parsed.get("action", "adjustment").lower()
        qty = int(parsed.get("quantity", 0))
        delta = qty if action in ["restock", "new_product"] else -qty if action in ["sale", "loss"] else qty

        current_qty = matched_prod.get("quantity_on_hand", 0) if matched_prod else 0
        new_qty = max(0, current_qty + delta) if matched_prod else qty

        result = {
            "action": action,
            "product_name": parsed.get("product_name", raw_user_input),
            "matched_product_id": matched_prod.get("id") if matched_prod else None,
            "matched_product_name": matched_prod.get("name") if matched_prod else "Unmatched / New Item",
            "current_stock": current_qty,
            "quantity": qty,
            "proposed_delta": delta,
            "new_stock": new_qty,
            "confidence": float(parsed.get("confidence", 0.85)),
            "explanation": parsed.get("reasoning", "Parsed from natural language input"),
            "needs_confirmation": True
        }

        # Step 4: Record privacy-safe AI Audit Log
        await db.log_ai_audit({
            "action_type": "nl_intent_parse",
            "user_input": clean_input,
            "fields_sent": ["catalog_summary.name", "catalog_summary.stock", "catalog_summary.ref"],
            "masked_payload": {
                "catalog_items_sent": len(catalog_summary),
                "pii_redactions": pii_detected,
                "privacy_audit": privacy_audit
            },
            "model_name": self.model_name,
            "latency_seconds": round(latency, 2),
            "created_at": datetime.utcnow()
        })

        return result

    async def answer_inventory_qa(
        self,
        question: str,
        products: List[Dict[str, Any]],
        recent_movements: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Answers business questions (e.g. 'What should I restock this week?')
        grounded in deterministic business metrics and privacy-masked data.
        """
        clean_q, pii_detected = redact_pii(question)

        # 1. Deterministic calculations (Done in Python, NOT hallucinated by AI)
        total_items = len(products)
        total_units = sum(int(p.get("quantity_on_hand", 0)) for p in products)
        total_value = sum(int(p.get("quantity_on_hand", 0)) * float(p.get("unit_cost", 0.0)) for p in products)
        
        low_stock = [
            {
                "product_name": p.get("name"),
                "category": p.get("category"),
                "current_stock": p.get("quantity_on_hand"),
                "minimum_stock": p.get("minimum_stock"),
                "reorder_needed": max(0, int(p.get("minimum_stock", 5)) * 2 - int(p.get("quantity_on_hand", 0)))
            }
            for p in products
            if int(p.get("quantity_on_hand", 0)) <= int(p.get("minimum_stock", 5))
        ]

        recent_sales_units = sum(
            abs(m.get("quantity_delta", 0))
            for m in recent_movements
            if m.get("movement_type") == "sale"
        )

        # 2. Build minimized payload
        grounded_context = {
            "summary_metrics": {
                "total_catalog_products": total_items,
                "total_units_in_stock": total_units,
                "total_inventory_valuation_usd": round(total_value, 2),
                "recent_sales_units_count": recent_sales_units,
                "low_stock_items_count": len(low_stock)
            },
            "low_stock_alert_items": low_stock[:6]
        }

        prompt = f"""You are StockMate AI, an expert inventory and supply chain advisor for small businesses.
Analyze the following verified business figures and answer the user question directly, concisely, and insightfully.

VERIFIED BUSINESS INVENTORY FIGURES:
{json.dumps(grounded_context, indent=2)}

USER QUESTION: "{clean_q}"

Guidelines:
- Ground your answer in the provided verified figures.
- Provide actionable advice for the business owner.
- Highlight any urgent restocking priorities.
- Output clean text formatted with markdown bullets or highlights."""

        raw_resp, latency, err = await self._call_gemma(prompt, is_json=False)

        if err or not raw_resp:
            # Deterministic fallback answer
            if low_stock:
                top_low = ", ".join(f"{item['product_name']} ({item['current_stock']} left)" for item in low_stock[:3])
                answer = f"**Inventory Status:** You currently have **{len(low_stock)} items low on stock**: {top_low}. Total inventory value is **${total_value:,.2f}** across {total_units} units."
            else:
                answer = f"**Inventory Status:** All items are above minimum stock thresholds. Total valuation is **${total_value:,.2f}**."
        else:
            answer = raw_resp

        # Log Privacy Audit
        await db.log_ai_audit({
            "action_type": "inventory_qa",
            "user_input": clean_q,
            "fields_sent": ["summary_metrics", "low_stock_alert_items (name, qty, min_stock)"],
            "masked_payload": {
                "excluded_supplier_info": True,
                "excluded_warehouse_locations": True,
                "pii_redactions": pii_detected
            },
            "model_name": self.model_name,
            "latency_seconds": round(latency, 2),
            "created_at": datetime.utcnow()
        })

        return {
            "question": clean_q,
            "answer": answer,
            "metrics": grounded_context["summary_metrics"],
            "low_stock_items": low_stock,
            "model_used": self.model_name,
            "latency_seconds": round(latency, 2)
        }

Tuple_Resp = tuple[str, float, Optional[str]]
gemma_service = GemmaService()
