from sqlalchemy.orm import Session
from sqlalchemy import select
from app.models.customer import Customer
from app.models.product import Product
from app.models.order import Order, OrderItem
from app.schemas.order import OrderCreate, OrderResponse, OrderItemResponse
from app.utils.exceptions import EntityNotFoundException, InsufficientStockException

class OrderService:
    @staticmethod
    def create_order(db: Session, order_in: OrderCreate) -> Order:
        customer = db.query(Customer).filter(Customer.id == order_in.customer_id).first()
        if not customer:
            raise EntityNotFoundException(f"Customer with ID {order_in.customer_id} does not exist.")

        total_amount = 0
        order_items = []

        try:
            for item in order_in.items:
                product = db.query(Product).filter(Product.id == item.product_id).with_for_update().first()
                
                if not product:
                    raise EntityNotFoundException(f"Product with ID {item.product_id} does not exist.")

                if product.quantity_in_stock < item.quantity:
                    raise InsufficientStockException(
                        f"Insufficient stock for product '{product.name}' (SKU: {product.sku}). "
                        f"Requested: {item.quantity}, Available: {product.quantity_in_stock}."
                    )

                product.quantity_in_stock -= item.quantity
                
                item_price = product.price
                item_total = item_price * item.quantity
                total_amount += item_total

                order_item = OrderItem(
                    product_id=product.id,
                    quantity=item.quantity,
                    price_at_order=item_price
                )
                order_items.append(order_item)

            order = Order(
                customer_id=customer.id,
                total_amount=total_amount,
                items=order_items
            )
            db.add(order)
            db.commit()
            db.refresh(order)
            return order

        except Exception as e:
            db.rollback()
            raise e

    @staticmethod
    def get_order_by_id(db: Session, order_id: int) -> Order:
        order = db.query(Order).filter(Order.id == order_id).first()
        if not order:
            raise EntityNotFoundException(f"Order with ID {order_id} not found.")
        return order

    @staticmethod
    def list_orders(db: Session) -> list[Order]:
        return db.query(Order).order_by(Order.created_at.desc()).all()

    @staticmethod
    def delete_order(db: Session, order_id: int) -> None:
        order = db.query(Order).filter(Order.id == order_id).first()
        if not order:
            raise EntityNotFoundException(f"Order with ID {order_id} not found.")
        
        try:
            for item in order.items:
                product = db.query(Product).filter(Product.id == item.product_id).with_for_update().first()
                if product:
                    product.quantity_in_stock += item.quantity
            
            db.delete(order)
            db.commit()
        except Exception as e:
            db.rollback()
            raise e

    @staticmethod
    def map_to_response(order: Order) -> OrderResponse:
        return OrderResponse(
            id=order.id,
            customer_id=order.customer_id,
            customer_name=order.customer.full_name if order.customer else "Unknown",
            customer_email=order.customer.email if order.customer else "Unknown",
            total_amount=order.total_amount,
            created_at=order.created_at,
            items=[
                OrderItemResponse(
                    id=item.id,
                    product_id=item.product_id,
                    product_name=item.product.name if item.product else "Deleted Product",
                    product_sku=item.product.sku if item.product else "N/A",
                    quantity=item.quantity,
                    price_at_order=item.price_at_order
                )
                for item in order.items
            ]
        )
