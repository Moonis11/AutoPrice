"""Dedicated Vercel function for Telegram webhook requests."""
import os

from fastapi import FastAPI, Header, Request

from bot.webhook import telegram_webhook as process_telegram_webhook

app = FastAPI()


async def _handle(
    request: Request,
    x_telegram_bot_api_secret_token: str | None = Header(default=None),
):
    return await process_telegram_webhook(
        request,
        x_telegram_bot_api_secret_token,
    )


async def _health():
    return {
        "status": "ok",
        "telegram_bot_token_configured": bool((os.getenv("TELEGRAM_BOT_TOKEN") or "").strip()),
        "webhook_secret_configured": bool((os.getenv("TELEGRAM_WEBHOOK_SECRET") or "").strip()),
    }


app.add_api_route("/", _handle, methods=["POST"])
app.add_api_route("/telegram/webhook", _handle, methods=["POST"])
app.add_api_route("/api/telegram/webhook", _handle, methods=["POST"])

app.add_api_route("/", _health, methods=["GET"])
app.add_api_route("/telegram/webhook", _health, methods=["GET"])
app.add_api_route("/api/telegram/webhook", _health, methods=["GET"])
