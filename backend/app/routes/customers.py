from fastapi import APIRouter, Depends, status, Response
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.customer import Customer
from app.schemas.customer import CustomerCreate, CustomerResponse
from app.utils.exceptions import EntityNotFoundException, DuplicateFieldException

router = APIRouter(prefix="/customers", tags=["Customers"])

@router.post("", response_model=CustomerResponse, status_code=status.HTTP_201_CREATED)
def create_customer(customer_in: CustomerCreate, db: Session = Depends(get_db)):
    # Case-insensitive duplicate check
    existing = db.query(Customer).filter(func.lower(Customer.email) == func.lower(customer_in.email)).first()
    if existing:
        raise DuplicateFieldException(f"Customer with email '{customer_in.email}' already exists.")
    
    db_customer = Customer(
        full_name=customer_in.full_name,
        email=customer_in.email,
        phone_number=customer_in.phone_number
    )
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    return db_customer


@router.get("", response_model=list[CustomerResponse])
def get_customers(db: Session = Depends(get_db)):
    return db.query(Customer).order_by(Customer.full_name).all()


@router.get("/{customer_id}", response_model=CustomerResponse)
def get_customer(customer_id: int, db: Session = Depends(get_db)):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise EntityNotFoundException(f"Customer with ID {customer_id} not found.")
    return customer


@router.delete("/{customer_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_customer(customer_id: int, db: Session = Depends(get_db)):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise EntityNotFoundException(f"Customer with ID {customer_id} not found.")
    
    from app.models.product import Product
    try:
        for order in customer.orders:
            for item in order.items:
                product = db.query(Product).filter(Product.id == item.product_id).with_for_update().first()
                if product:
                    product.quantity_in_stock += item.quantity
        
        db.delete(customer)
        db.commit()
    except Exception as e:
        db.rollback()
        raise e
        
    return Response(status_code=status.HTTP_204_NO_CONTENT)
