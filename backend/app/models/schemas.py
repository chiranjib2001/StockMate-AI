from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
import uuid

def generate_id() -> str:
    return str(uuid.uuid4())

class ProductBase(BaseModel):
    sku: str = Field(..., description="Unique product SKU")
    name: str = Field(..., description="Product title")
    category: str = Field("General", description="Category")
    unit_cost: float = Field(0.0, ge=0, description="Cost of goods per unit")
    selling_price: float = Field(0.0, ge=0, description="Selling price per unit")
    quantity_on_hand: int = Field(0, ge=0, description="Current physical stock")
    minimum_stock: int = Field(5, ge=0, description="Reorder threshold level")
    supplier_name: Optional[str] = Field(None, description="Supplier name (Confidential)")
    supplier_email: Optional[str] = Field(None, description="Supplier contact email (PII - Masked from AI)")
    warehouse_location: Optional[str] = Field(None, description="Exact bin / rack location (Masked from AI)")
    notes: Optional[str] = Field(None, description="Free-text operational notes")

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    sku: Optional[str] = None
    name: Optional[str] = None
    category: Optional[str] = None
    unit_cost: Optional[float] = None
    selling_price: Optional[float] = None
    quantity_on_hand: Optional[int] = None
    minimum_stock: Optional[int] = None
    supplier_name: Optional[str] = None
    supplier_email: Optional[str] = None
    warehouse_location: Optional[str] = None
    notes: Optional[str] = None

class Product(ProductBase):
    id: str = Field(default_factory=generate_id)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class StockMovementCreate(BaseModel):
    product_id: str
    quantity_delta: int = Field(..., description="Positive for received/restock, negative for sale/loss")
    movement_type: str = Field(..., description="'sale', 'restock', 'adjustment', 'return', 'loss'")
    reference_note: Optional[str] = None

class StockMovement(StockMovementCreate):
    id: str = Field(default_factory=generate_id)
    product_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class RestockRecommendation(BaseModel):
    product_id: str
    product_name: str
    sku: str
    category: str
    current_stock: int
    minimum_stock: int
    recommended_reorder: int
    unit_cost: float
    estimated_cost: float
    urgency: str = Field("Normal", description="'Critical', 'Warning', 'Normal'")
    uncertainty_level: str = Field("Low", description="'Low', 'Medium', 'High'")
    reasoning: str

class AIAuditLog(BaseModel):
    id: str = Field(default_factory=generate_id)
    action_type: str = Field(..., description="'nl_intent_parse', 'inventory_qa', 'restock_analysis'")
    user_input: str
    fields_sent: List[str]
    masked_payload: Any
    model_name: str
    latency_seconds: float
    created_at: datetime = Field(default_factory=datetime.utcnow)

class NLIntentProposal(BaseModel):
    action: str = Field(..., description="'sale', 'restock', 'adjustment', 'new_product', 'unknown'")
    product_name: str
    matched_product_id: Optional[str] = None
    matched_product_name: Optional[str] = None
    current_stock: Optional[int] = None
    quantity: int
    proposed_delta: int
    new_stock: Optional[int] = None
    confidence: float
    explanation: str
    needs_confirmation: bool = True

class DashboardKPIs(BaseModel):
    total_products: int
    total_stock_units: int
    total_inventory_value: float
    potential_revenue: float
    low_stock_count: int
    out_of_stock_count: int
    recent_sales_count: int
    critical_restocks: List[RestockRecommendation]
