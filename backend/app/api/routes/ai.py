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
