from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from app.config.settings import settings
from app.database import engine, Base
from app.routes import products_router, customers_router, orders_router, dashboard_router
from app.utils.exceptions import EntityNotFoundException, DuplicateFieldException, InsufficientStockException, BusinessLogicException

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend API for Inventory & Order Management System",
    version="1.0.0",
)

origins = [origin.strip() for origin in settings.BACKEND_CORS_ORIGINS.split(",") if origin.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api_prefix = settings.API_V1_STR
app.include_router(products_router, prefix=api_prefix)
app.include_router(customers_router, prefix=api_prefix)
app.include_router(orders_router, prefix=api_prefix)
app.include_router(dashboard_router, prefix=api_prefix)

@app.get("/", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "project": settings.PROJECT_NAME,
        "version": "1.0.0"
    }

@app.exception_handler(EntityNotFoundException)
async def entity_not_found_handler(request: Request, exc: EntityNotFoundException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"success": False, "error": "NOT_FOUND", "message": exc.detail}
    )

@app.exception_handler(DuplicateFieldException)
async def duplicate_field_handler(request: Request, exc: DuplicateFieldException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"success": False, "error": "CONFLICT", "message": exc.detail}
    )

@app.exception_handler(InsufficientStockException)
async def insufficient_stock_handler(request: Request, exc: InsufficientStockException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"success": False, "error": "INSUFFICIENT_STOCK", "message": exc.detail}
    )

@app.exception_handler(BusinessLogicException)
async def business_logic_handler(request: Request, exc: BusinessLogicException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"success": False, "error": "UNPROCESSABLE_ENTITY", "message": exc.detail}
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"success": False, "error": "INTERNAL_SERVER_ERROR", "message": str(exc)}
    )
