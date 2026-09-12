from fastapi import APIRouter

from routes.v1.public.public import router as public_router

router = APIRouter()

router.include_router(public_router, tags=["public"])
