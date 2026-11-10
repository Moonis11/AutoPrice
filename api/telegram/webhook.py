"""Dedicated Vercel function for the Telegram webhook path.

The two route registrations support both ASGI path forms: with and without
Vercel's /api function prefix.
"""
from backend.main import app
from bot.webhook import router as telegram_router

app.include_router(telegram_router)
app.include_router(telegram_router, prefix="/api")
