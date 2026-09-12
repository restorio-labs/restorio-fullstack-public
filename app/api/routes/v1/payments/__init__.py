from fastapi import APIRouter

from routes.v1.payments import p24_config, p24_status, p24_verify, payments, transactions

router = APIRouter()

router.include_router(payments.router, tags=["payments"])
router.include_router(transactions.router, tags=["transactions"])
router.include_router(p24_config.router, tags=["p24-config"])
router.include_router(p24_verify.router, tags=["p24"])
router.include_router(p24_status.router, tags=["p24-webhook"])
