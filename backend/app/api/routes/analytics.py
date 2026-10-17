from fastapi import APIRouter
from typing import List, Dict, Any
from app.models.schemas import DashboardKPIs, RestockRecommendation
from app.database import db

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/kpis", response_model=DashboardKPIs)
async def get_dashboard_kpis():
    products = await db.get_products()
    movements = await db.get_movements(limit=100)

    total_units = sum(int(p.get("quantity_on_hand", 0)) for p in products)
    total_val = sum(int(p.get("quantity_on_hand", 0)) * float(p.get("unit_cost", 0.0)) for p in products)
    pot_rev = sum(int(p.get("quantity_on_hand", 0)) * float(p.get("selling_price", 0.0)) for p in products)

    low_stock_items = []
    out_of_stock = 0

    for p in products:
        qty = int(p.get("quantity_on_hand", 0))
        min_qty = int(p.get("minimum_stock", 5))

        if qty == 0:
            out_of_stock += 1
        
        if qty <= min_qty:
            needed = max(0, (min_qty * 2) - qty)
            urgency = "Critical" if qty <= (min_qty // 2) else "Warning"
            cost = float(p.get("unit_cost", 0.0))
            
            low_stock_items.append(RestockRecommendation(
                product_id=p.get("id"),
                product_name=p.get("name"),
                sku=p.get("sku"),
                category=p.get("category", "General"),
                current_stock=qty,
                minimum_stock=min_qty,
                recommended_reorder=needed,
                unit_cost=cost,
                estimated_cost=round(needed * cost, 2),
                urgency=urgency,
                uncertainty_level="Low" if qty > 0 else "Medium",
                reasoning=f"Stock ({qty}) fell below safety threshold ({min_qty}). Recommend replenishing {needed} units."
            ))

    recent_sales = sum(
        abs(m.get("quantity_delta", 0))
        for m in movements
        if m.get("movement_type") == "sale"
    )

    return DashboardKPIs(
        total_products=len(products),
        total_stock_units=total_units,
        total_inventory_value=round(total_val, 2),
        potential_revenue=round(pot_rev, 2),
        low_stock_count=len(low_stock_items),
        out_of_stock_count=out_of_stock,
        recent_sales_count=recent_sales,
        critical_restocks=low_stock_items
    )

@router.get("/restock-recommendations", response_model=List[RestockRecommendation])
async def get_restock_recommendations():
    kpis = await get_dashboard_kpis()
    return kpis.critical_restocks

@router.get("/category-distribution")
async def get_category_distribution():
    products = await db.get_products()
    dist: Dict[str, Dict[str, Any]] = {}
    
    for p in products:
        cat = p.get("category", "Uncategorized")
        qty = int(p.get("quantity_on_hand", 0))
        val = qty * float(p.get("unit_cost", 0.0))
        
        if cat not in dist:
            dist[cat] = {"category": cat, "item_count": 0, "total_units": 0, "total_value": 0.0}
        
        dist[cat]["item_count"] += 1
        dist[cat]["total_units"] += qty
        dist[cat]["total_value"] += val

    result = list(dist.values())
    for r in result:
        r["total_value"] = round(r["total_value"], 2)
    return result
