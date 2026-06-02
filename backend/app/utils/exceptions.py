from fastapi import HTTPException, status

class EntityNotFoundException(HTTPException):
    def __init__(self, detail: str = "Resource not found"):
        super().__init__(status_code=status.HTTP_404_NOT_FOUND, detail=detail)


class DuplicateFieldException(HTTPException):
    def __init__(self, detail: str = "Resource with this field already exists"):
        super().__init__(status_code=status.HTTP_400_BAD_REQUEST, detail=detail)


class InsufficientStockException(HTTPException):
    def __init__(self, detail: str = "Insufficient inventory stock"):
        super().__init__(status_code=status.HTTP_400_BAD_REQUEST, detail=detail)


class BusinessLogicException(HTTPException):
    def __init__(self, detail: str = "Business rule violation"):
        super().__init__(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=detail)
