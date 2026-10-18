from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
from app.models.schemas import NLIntentProposal, AIAuditLog, StockMovement
from app.database import db
from app.ai.gemma_service import gemma_service
from app.privacy.masking import PrivacyMasker

router = APIRouter(prefix="/ai", tags=["AI Engine"])

class NLQueryRequest(BaseModel):
    user_input: str

class QARequest(BaseModel):
    question: str

class ConfirmIntentRequest(BaseModel):
    product_id: str
    quantity_delta: int
    movement_type: str
    reference_note: str

@router.post("/parse-intent", response_model=NLIntentProposal)
async def parse_intent(payload: NLQueryRequest):
    if not payload.user_input.strip():
        raise HTTPException(status_code=400, detail="User input cannot be empty.")
    
    products = await db.get_products()
    proposal = await gemma_service.parse_natural_language_intent(
        payload.user_input,
        products
    )
    return proposal

@router.post("/confirm-intent", response_model=StockMovement)
async def confirm_intent(payload: ConfirmIntentRequest):
    product = await db.get_product_by_id(payload.product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found.")

    curr_stock = int(product.get("quantity_on_hand", 0))
    new_stock = curr_stock + payload.quantity_delta

    if new_stock < 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot execute update: Current stock is {curr_stock}, requested deduction is {abs(payload.quantity_delta)}."
        )

    movement = StockMovement(
        product_id=payload.product_id,
        product_name=product.get("name", "Unknown"),
        quantity_delta=payload.quantity_delta,
        movement_type=payload.movement_type,
        reference_note=payload.reference_note or "AI natural language logged",
        timestamp=datetime.utcnow()
    )
    
    saved = await db.record_movement(movement.dict())
    return saved

@router.post("/ask")
async def ask_inventory_question(payload: QARequest):
    if not payload.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")
    
    products = await db.get_products()
    movements = await db.get_movements(limit=50)
    
    answer = await gemma_service.answer_inventory_qa(
        payload.question,
        products,
        movements
    )
    return answer

@router.get("/preview-masking")
async def preview_masking_comparison():
    """
    Demonstrates how raw inventory records are privacy-filtered
    before any data is transmitted to Gemma.
    """
    raw_sample = {
        "sku": "LNN-SHT-BLU",
        "name": "Classic Linen Button-Down (Ocean Blue)",
        "category": "Apparel",
        "unit_cost": 18.50,
        "selling_price": 48.00,
        "quantity_on_hand": 14,
        "minimum_stock": 10,
        "supplier_name": "Seaside Fabrics Co.",
        "supplier_email": "confidential_orders@seasidefabrics.example",
        "warehouse_location": "Building 4, Secure Vault Bay 12",
        "notes": "Contract discount expires Nov 2026. Gate passcode: 4892."
    }

    minimized = PrivacyMasker.minimize_product_for_ai(raw_sample, "P-101", units_sold_30d=24)
    
    return {
        "raw_record_with_pii": raw_sample,
        "sanitized_ai_payload": minimized,
        "redacted_fields": [
            "supplier_name",
            "supplier_email",
            "warehouse_location",
            "notes (passcodes & internal terms)"
        ],
        "privacy_guarantee": "Only whitelisted operational metrics reach the Gemma model."
    }

@router.get("/audit-logs", response_model=List[AIAuditLog])
async def get_audit_logs(limit: int = 25):
    return await db.get_ai_audits(limit=limit)

@router.get("/diagnostics")
async def ai_diagnostics():
    import httpx
    from app.core.config import settings

    diag: Dict[str, Any] = {}

    # 1. Groq Check
    groq_key = settings.GROQ_API_KEY or (settings.GEMMA_API_KEY if settings.GEMMA_API_KEY.startswith("gsk_") else "")
    if groq_key:
        masked_groq = groq_key[:8] + "..." + groq_key[-4:] if len(groq_key) > 12 else "present"
        diag["groq"] = {"key": masked_groq}
        try:
            headers = {"Authorization": f"Bearer {groq_key}", "Content-Type": "application/json"}
            body = {"model": "llama-3.1-8b-instant", "messages": [{"role": "user", "content": "ping"}], "max_tokens": 5}
            async with httpx.AsyncClient(timeout=8.0) as client:
                r = await client.post("https://api.groq.com/openai/v1/chat/completions", headers=headers, json=body)
                diag["groq"]["status"] = r.status_code
                diag["groq"]["response"] = r.text[:100]
        except Exception as e:
            diag["groq"]["error"] = str(e)
    else:
        diag["groq"] = "not_set"

    # 2. OpenRouter Check
    if settings.OPENROUTER_API_KEY:
        clean_raw = settings.OPENROUTER_API_KEY.strip().strip('"\'')
        keys = [k.strip().strip('"\'') for k in clean_raw.split(",") if k.strip()]
        diag["openrouter"] = {"keys_count": len(keys)}
        if keys:
            first_key = keys[0]
            masked_or = first_key[:12] + "..." + first_key[-4:] if len(first_key) > 16 else "present"
            diag["openrouter"]["first_key"] = masked_or
            try:
                headers = {
                    "Authorization": f"Bearer {first_key}",
                    "HTTP-Referer": "https://stockmate.chiranjib.tech",
                    "X-Title": "StockMate AI",
                    "Content-Type": "application/json"
                }
                body = {"model": "google/gemma-4-26b-a4b-it:free", "messages": [{"role": "user", "content": "ping"}], "max_tokens": 5}
                async with httpx.AsyncClient(timeout=8.0) as client:
                    r = await client.post("https://openrouter.ai/api/v1/chat/completions", headers=headers, json=body)
                    diag["openrouter"]["status"] = r.status_code
                    diag["openrouter"]["response"] = r.text[:120]
            except Exception as e:
                diag["openrouter"]["error"] = str(e)
    else:
        diag["openrouter"] = "not_set"

    # 3. Gemini Check
    gemini_key = settings.GEMINI_API_KEY or (settings.GEMMA_API_KEY if settings.GEMMA_API_KEY.startswith("AIza") else "")
    diag["gemini"] = "present" if gemini_key else "not_set"

    return diag
