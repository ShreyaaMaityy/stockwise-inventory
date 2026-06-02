from fastapi import APIRouter, Depends, status, Response
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.product import Product
from app.schemas.product import ProductCreate, ProductUpdate, ProductResponse
from app.utils.exceptions import EntityNotFoundException, DuplicateFieldException

router = APIRouter(prefix="/products", tags=["Products"])

@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(product_in: ProductCreate, db: Session = Depends(get_db)):
    # Case-insensitive duplicate check
    existing = db.query(Product).filter(func.lower(Product.sku) == func.lower(product_in.sku)).first()
    if existing:
        raise DuplicateFieldException(f"Product with SKU '{product_in.sku}' already exists.")
    
    db_product = Product(
        name=product_in.name,
        sku=product_in.sku,
        price=product_in.price,
        quantity_in_stock=product_in.quantity_in_stock
    )
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product


@router.get("", response_model=list[ProductResponse])
def get_products(db: Session = Depends(get_db)):
    return db.query(Product).order_by(Product.name).all()


@router.get("/{product_id}", response_model=ProductResponse)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise EntityNotFoundException(f"Product with ID {product_id} not found.")
    return product


@router.put("/{product_id}", response_model=ProductResponse)
def update_product(product_id: int, product_in: ProductUpdate, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise EntityNotFoundException(f"Product with ID {product_id} not found.")
    
    if product_in.sku is not None and product_in.sku.strip().upper() != product.sku:
        # Case-insensitive duplicate check on update
        existing = db.query(Product).filter(func.lower(Product.sku) == func.lower(product_in.sku)).first()
        if existing:
            raise DuplicateFieldException(f"Product with SKU '{product_in.sku}' already exists.")

    update_data = product_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(product, field, value)
        
    db.commit()
    db.refresh(product)
    return product


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise EntityNotFoundException(f"Product with ID {product_id} not found.")
    
    from sqlalchemy.exc import IntegrityError
    try:
        db.delete(product)
        db.commit()
    except IntegrityError:
        db.rollback()
        raise DuplicateFieldException(
            "Cannot delete product because it is referenced in one or more orders. Delete the associated orders first."
        )
    return Response(status_code=status.HTTP_204_NO_CONTENT)
