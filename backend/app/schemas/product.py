from pydantic import BaseModel, Field, field_validator
from decimal import Decimal
from datetime import datetime
from typing import Optional

class ProductBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="The name of the product")
    sku: str = Field(..., min_length=1, max_length=100, description="The unique stock keeping unit code")
    price: Decimal = Field(..., gt=Decimal("0.00"), description="The selling price of the product")
    quantity_in_stock: int = Field(..., ge=0, description="Quantity currently in stock")

    @field_validator("sku")
    @classmethod
    def validate_sku(cls, v: str) -> str:
        sku_clean = v.strip().upper()
        if not sku_clean:
            raise ValueError("SKU cannot be empty or only spaces")
        return sku_clean

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        name_clean = v.strip()
        if not name_clean:
            raise ValueError("Name cannot be empty or only spaces")
        return name_clean


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    sku: Optional[str] = Field(None, min_length=1, max_length=100)
    price: Optional[Decimal] = Field(None, gt=Decimal("0.00"))
    quantity_in_stock: Optional[int] = Field(None, ge=0)

    @field_validator("sku")
    @classmethod
    def validate_sku(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            sku_clean = v.strip().upper()
            if not sku_clean:
                raise ValueError("SKU cannot be empty or only spaces")
            return sku_clean
        return v

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            name_clean = v.strip()
            if not name_clean:
                raise ValueError("Name cannot be empty or only spaces")
            return name_clean
        return v


class ProductResponse(ProductBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
