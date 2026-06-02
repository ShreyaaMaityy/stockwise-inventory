from fastapi import APIRouter, Depends, status, Response
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.order import OrderCreate, OrderResponse
from app.services.order_service import OrderService

router = APIRouter(prefix="/orders", tags=["Orders"])

@router.post("", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
def create_order(order_in: OrderCreate, db: Session = Depends(get_db)):
    order = OrderService.create_order(db, order_in)
    return OrderService.map_to_response(order)


@router.get("", response_model=list[OrderResponse])
def get_orders(db: Session = Depends(get_db)):
    orders = OrderService.list_orders(db)
    return [OrderService.map_to_response(order) for order in orders]


@router.get("/{order_id}", response_model=OrderResponse)
def get_order(order_id: int, db: Session = Depends(get_db)):
    order = OrderService.get_order_by_id(db, order_id)
    return OrderService.map_to_response(order)


@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_order(order_id: int, db: Session = Depends(get_db)):
    OrderService.delete_order(db, order_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
