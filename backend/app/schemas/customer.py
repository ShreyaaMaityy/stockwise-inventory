import re
from pydantic import BaseModel, Field, field_validator
from datetime import datetime
from typing import Optional

EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")

class CustomerBase(BaseModel):
    full_name: str = Field(..., min_length=1, max_length=255, description="Customer's full name")
    email: str = Field(..., description="Customer's email address")
    phone_number: str = Field(..., min_length=1, max_length=50, description="Customer's phone number")

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        clean_email = v.strip().lower()
        if not EMAIL_REGEX.match(clean_email):
            raise ValueError("Invalid email format")
        return clean_email

    @field_validator("full_name")
    @classmethod
    def validate_full_name(cls, v: str) -> str:
        clean_name = v.strip()
        if not clean_name:
            raise ValueError("Full name cannot be empty")
        return clean_name


class CustomerCreate(CustomerBase):
    pass


class CustomerResponse(CustomerBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
