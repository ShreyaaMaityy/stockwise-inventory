from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.product import Product
from app.models.customer import Customer
from app.models.order import Order, OrderItem
from app.schemas.dashboard import DashboardStats, RecentOrderInfo, TopProductInfo, StockCategory

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/stats", response_model=DashboardStats)
def get_dashboard_stats(db: Session = Depends(get_db)):
    # 1. Total counts
    total_products = db.query(Product).count()
    total_customers = db.query(Customer).count()
    total_orders = db.query(Order).count()
    
    # 2. Total revenue (sum of all order totals)
    total_revenue = db.query(func.sum(Order.total_amount)).scalar() or 0
    
    # 3. Low stock products (stock <= 10)
    low_stock_products = db.query(Product).filter(Product.quantity_in_stock <= 10).order_by(Product.quantity_in_stock).all()
    
    # 4. Recent orders (latest 5)
    recent_orders_db = db.query(Order).order_by(Order.created_at.desc()).limit(5).all()
    recent_orders = []
    for o in recent_orders_db:
        # Sum of items quantity in this order
        items_count = db.query(func.sum(OrderItem.quantity)).filter(OrderItem.order_id == o.id).scalar() or 0
        recent_orders.append(
            RecentOrderInfo(
                id=o.id,
                customer_name=o.customer.full_name if o.customer else "Deleted Customer",
                customer_email=o.customer.email if o.customer else "N/A",
                total_amount=o.total_amount,
                items_count=items_count,
                created_at=o.created_at
            )
        )
        
    # 5. Top selling products (join product & order items, sum quantity, order desc, limit 5)
    top_products_db = db.query(
        Product.id,
        Product.name,
        Product.sku,
        Product.price,
        func.sum(OrderItem.quantity).label("total_sold")
    ).join(OrderItem, OrderItem.product_id == Product.id)\
     .group_by(Product.id)\
     .order_by(func.sum(OrderItem.quantity).desc())\
     .limit(5)\
     .all()
     
    top_products = [
        TopProductInfo(
            product_id=p.id,
            name=p.name,
            sku=p.sku,
            price=p.price,
            total_sold=int(p.total_sold)
        )
        for p in top_products_db
    ]
    
    # 6. Stock level distribution categories
    out_of_stock = db.query(Product).filter(Product.quantity_in_stock == 0).count()
    low_stock = db.query(Product).filter(Product.quantity_in_stock > 0, Product.quantity_in_stock <= 10).count()
    in_stock = db.query(Product).filter(Product.quantity_in_stock > 10).count()
    
    stock_distribution = [
        StockCategory(name="Out of Stock", value=out_of_stock, color="#f43f5e"), # rose-500
        StockCategory(name="Low Stock", value=low_stock, color="#f59e0b"),     # amber-500
        StockCategory(name="Sufficient", value=in_stock, color="#10b981")      # emerald-500
    ]
    
    return DashboardStats(
        total_products=total_products,
        total_customers=total_customers,
        total_orders=total_orders,
        total_revenue=total_revenue,
        low_stock_products=low_stock_products,
        recent_orders=recent_orders,
        top_products=top_products,
        stock_distribution=stock_distribution
    )
