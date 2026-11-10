"""Dedicated Vercel function for Telegram webhook requests.

Vercel maps this file to /api/telegram/webhook. ASGI functions can receive
the request at the function root, so register "/" as the primary route and
keep path aliases for runtimes that preserve the original URL.
"""
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


app.add_api_route("/", _handle, methods=["POST"])
app.add_api_route("/telegram/webhook", _handle, methods=["POST"])
app.add_api_route("/api/telegram/webhook", _handle, methods=["POST"])
