from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from datetime import datetime
from app.models.schemas import Product, ProductCreate, ProductUpdate
from app.database import db

router = APIRouter(prefix="/products", tags=["Products"])

SAMPLE_PRODUCTS = [
    {
        "sku": "LNN-SHT-BLU",
        "name": "Classic Linen Button-Down (Ocean Blue)",
        "category": "Apparel",
        "unit_cost": 18.50,
        "selling_price": 48.00,
        "quantity_on_hand": 14,
        "minimum_stock": 10,
        "supplier_name": "Seaside Fabrics Co.",
        "supplier_email": "wholesale@seasidefabrics.example",
        "warehouse_location": "Rack A-12, Bin 3",
        "notes": "Best-seller during summer and autumn."
    },
    {
        "sku": "CRM-MUG-WHT",
        "name": "Handmade Speckled Ceramic Mug",
        "category": "Home Goods",
        "unit_cost": 7.20,
        "selling_price": 24.00,
        "quantity_on_hand": 4,
        "minimum_stock": 8,
        "supplier_name": "Artisan Clayworks",
        "supplier_email": "orders@artisanclay.example",
        "warehouse_location": "Shelf B-04",
        "notes": "Fragile packing required. High repeat order rate."
    },
    {
        "sku": "CNDL-SOY-LVD",
        "name": "French Lavender Aromatherapy Candle",
        "category": "Wellness",
        "unit_cost": 5.80,
        "selling_price": 19.50,
        "quantity_on_hand": 2,
        "minimum_stock": 12,
        "supplier_name": "Botanical Essence Labs",
        "supplier_email": "supply@botanicallabs.example",
        "warehouse_location": "Bin C-10",
        "notes": "Critical low stock! 100% natural soy wax."
    },
    {
        "sku": "CFE-ETH-ROAST",
        "name": "Single-Origin Ethiopian Yirgacheffe Beans (250g)",
        "category": "Pantry",
        "unit_cost": 6.50,
        "selling_price": 16.00,
        "quantity_on_hand": 28,
        "minimum_stock": 15,
        "supplier_name": "Highland Roasters",
        "supplier_email": "accounts@highlandroast.example",
        "warehouse_location": "Aisle 1, Dry Storage",
        "notes": "Fresh roast cycle every 14 days."
    },
    {
        "sku": "JNS-SLM-BLK",
        "name": "Everyday Slim Stretch Denim (Pitch Black)",
        "category": "Apparel",
        "unit_cost": 22.00,
        "selling_price": 65.00,
        "quantity_on_hand": 9,
        "minimum_stock": 10,
        "supplier_name": "Modern Denim Mill",
        "supplier_email": "rep@moderndenim.example",
        "warehouse_location": "Rack A-08",
        "notes": "Consistently sells 3-5 pairs weekly."
    },
    {
        "sku": "BAM-TBR-SET",
        "name": "Eco Bamboo Charcoal Toothbrush Set (4-Pack)",
        "category": "Wellness",
        "unit_cost": 2.10,
        "selling_price": 9.99,
        "quantity_on_hand": 45,
        "minimum_stock": 20,
        "supplier_name": "GreenLife Supplies",
        "supplier_email": "b2b@greenlife.example",
        "warehouse_location": "Bin D-01",
        "notes": "Popular add-on item in bundles."
    }
]

@router.get("", response_model=List[Product])
async def list_products(
    search: Optional[str] = Query(None, description="Search by name, SKU, or category"),
    category: Optional[str] = Query(None, description="Filter by category")
):
    products = await db.get_products()
    if not products:
        # Auto-seed if empty
        for item in SAMPLE_PRODUCTS:
            prod = Product(**item)
            await db.save_product(prod.dict())
        products = await db.get_products()

    if search:
        s = search.lower()
        products = [p for p in products if s in p.get("name", "").lower() or s in p.get("sku", "").lower() or s in p.get("category", "").lower()]
    
    if category and category != "All":
        products = [p for p in products if p.get("category") == category]

    return products

@router.post("", response_model=Product)
async def create_product(product_in: ProductCreate):
    existing = await db.get_product_by_sku(product_in.sku)
    if existing:
        raise HTTPException(status_code=400, detail=f"Product with SKU '{product_in.sku}' already exists.")
    
    prod = Product(**product_in.dict())
    await db.save_product(prod.dict())
    return prod

@router.get("/{product_id}", response_model=Product)
async def get_product(product_id: str):
    prod = await db.get_product_by_id(product_id)
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found.")
    return prod

@router.put("/{product_id}", response_model=Product)
async def update_product(product_id: str, updates: ProductUpdate):
    prod = await db.get_product_by_id(product_id)
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found.")
    
    update_data = updates.dict(exclude_unset=True)
    for k, v in update_data.items():
        prod[k] = v
    prod["updated_at"] = datetime.utcnow()
    
    await db.save_product(prod)
    return prod

@router.delete("/{product_id}")
async def delete_product(product_id: str):
    success = await db.delete_product(product_id)
    if not success:
        raise HTTPException(status_code=404, detail="Product not found.")
    return {"status": "success", "message": f"Product {product_id} deleted"}

@router.post("/seed")
async def seed_products():
    for item in SAMPLE_PRODUCTS:
        existing = await db.get_product_by_sku(item["sku"])
        if not existing:
            prod = Product(**item)
            await db.save_product(prod.dict())
    return {"status": "success", "message": f"Seeded {len(SAMPLE_PRODUCTS)} products."}
