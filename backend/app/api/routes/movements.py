from fastapi import APIRouter, HTTPException
from typing import List
from datetime import datetime
from app.models.schemas import StockMovement, StockMovementCreate
from app.database import db

router = APIRouter(prefix="/movements", tags=["Stock Movements"])

@router.get("", response_model=List[StockMovement])
async def list_movements(limit: int = 50):
    return await db.get_movements(limit=limit)

@router.post("", response_model=StockMovement)
async def create_stock_movement(movement_in: StockMovementCreate):
    product = await db.get_product_by_id(movement_in.product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found.")

    curr_stock = int(product.get("quantity_on_hand", 0))
    new_stock = curr_stock + movement_in.quantity_delta

    if new_stock < 0:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient inventory! Current stock is {curr_stock}, cannot deduct {abs(movement_in.quantity_delta)} units."
        )

    movement_obj = StockMovement(
        product_id=movement_in.product_id,
        product_name=product.get("name", "Unknown"),
        quantity_delta=movement_in.quantity_delta,
        movement_type=movement_in.movement_type,
        reference_note=movement_in.reference_note or f"Manual {movement_in.movement_type}",
        timestamp=datetime.utcnow()
    )

    saved = await db.record_movement(movement_obj.dict())
    return saved
