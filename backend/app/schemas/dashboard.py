from pydantic import BaseModel
from typing import List
from decimal import Decimal
from datetime import datetime
from app.schemas.product import ProductResponse

class RecentOrderInfo(BaseModel):
    id: int
    customer_name: str
    customer_email: str
    total_amount: Decimal
    items_count: int
    created_at: datetime

class TopProductInfo(BaseModel):
    product_id: int
    name: str
    sku: str
    price: Decimal
    total_sold: int

class StockCategory(BaseModel):
    name: str
    value: int
    color: str

class DashboardStats(BaseModel):
    total_products: int
    total_customers: int
    total_orders: int
    total_revenue: Decimal
    low_stock_products: List[ProductResponse]
    recent_orders: List[RecentOrderInfo]
    top_products: List[TopProductInfo]
    stock_distribution: List[StockCategory]
