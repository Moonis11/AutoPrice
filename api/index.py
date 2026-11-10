"""Vercel Python entry point for the FastAPI application."""
from backend.main import app
from bot.webhook import router as telegram_router

app.include_router(telegram_router)
