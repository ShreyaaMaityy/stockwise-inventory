from pydantic import BaseModel, Field, field_validator
from decimal import Decimal
from datetime import datetime
from typing import List, Optional

class OrderItemCreate(BaseModel):
    product_id: int = Field(..., gt=0, description="ID of the product being ordered")
    quantity: int = Field(..., gt=0, description="Quantity of the product being ordered")


class OrderCreate(BaseModel):
    customer_id: int = Field(..., gt=0, description="ID of the customer placing the order")
    items: List[OrderItemCreate] = Field(..., min_items=1, description="List of items in the order")

    @field_validator("items")
    @classmethod
    def validate_items(cls, items: List[OrderItemCreate]) -> List[OrderItemCreate]:
        product_ids = set()
        for item in items:
            if item.product_id in product_ids:
                raise ValueError(f"Duplicate product_id {item.product_id} in items list. Group quantities together.")
            product_ids.add(item.product_id)
        return items


class OrderItemResponse(BaseModel):
    id: int
    product_id: int
    product_name: str = Field(..., description="Snapshot of the product name for UI convenience")
    product_sku: str = Field(..., description="Snapshot of the product SKU for UI convenience")
    quantity: int
    price_at_order: Decimal

    class Config:
        from_attributes = True


class OrderResponse(BaseModel):
    id: int
    customer_id: int
    customer_name: str
    customer_email: str
    total_amount: Decimal
    created_at: datetime
    items: List[OrderItemResponse]

    class Config:
        from_attributes = True
