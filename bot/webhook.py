"""Telegram webhook for AutoPrice. Stateless command-based MVP for serverless hosting."""
import hmac
import logging
import os

from aiogram import Bot, Dispatcher, Router
from aiogram.filters import Command, CommandObject
from aiogram.types import Message, Update
from fastapi import APIRouter, Header, HTTPException, Request

from backend.main import CarInput, valuation

logger = logging.getLogger(__name__)

router = APIRouter()
telegram_router = Router()
_dispatcher = Dispatcher()
_dispatcher.include_router(telegram_router)
_bot = None


def _get_bot() -> Bot:
    global _bot
    token = (os.getenv("TELEGRAM_BOT_TOKEN") or "").strip()
    if not token:
        raise HTTPException(status_code=503, detail="TELEGRAM_BOT_TOKEN sozlanmagan.")
    if _bot is None:
        _bot = Bot(token=token)
    return _bot


def _format_uzs(value: int) -> str:
    return f"{value:,}".replace(",", " ")


@telegram_router.message(Command("start"))
async def start(message: Message) -> None:
    await message.answer(
        "Assalomu alaykum! AutoPrice botiga xush kelibsiz.\n\n"
        "Men O‘zbekistondagi avtomobillar uchun taxminiy bozor narxini hisoblashga yordam beraman.\n"
        "Baholash uchun quyidagi buyruqni yuboring:\n\n"
        "/estimate Chevrolet | Cobalt | 2020 | 85000 | avtomat | benzin | Toshkent | yaxshi\n\n"
        "Maydonlar: marka | model | yil | probeg_km | uzatma | yoqilg‘i | hudud | holat.\n"
        "Hozircha suratlar avtomatik tahlil qilinmaydi."
    )


@telegram_router.message(Command("help"))
async def help_message(message: Message) -> None:
    await start(message)


@telegram_router.message(Command("estimate"))
async def estimate(message: Message, command: CommandObject) -> None:
    if not command.args:
        await message.answer(
            "Ma’lumotlarni bitta qatorda yuboring:\n"
            "/estimate Chevrolet | Cobalt | 2020 | 85000 | avtomat | benzin | Toshkent | yaxshi"
        )
        return

    fields = [part.strip() for part in command.args.split("|")]
    if len(fields) != 8:
        await message.answer(
            "8 ta maydon kerak. Har birini | belgisi bilan ajrating.\n"
            "Misol:\n"
            "/estimate Chevrolet | Cobalt | 2020 | 85000 | avtomat | benzin | Toshkent | yaxshi"
        )
        return

    make, model, year, mileage, transmission, fuel_type, region, condition = fields
    try:
        car = CarInput(
            make=make,
            model=model,
            year=int(year),
            mileage_km=int(mileage),
            transmission=transmission,
            fuel_type=fuel_type,
            region=region,
            condition=condition,
        )
    except (ValueError, TypeError):
        await message.answer("Ma’lumotlarda xatolik bor. Yil va probegni raqam bilan kiriting.")
        return

    await message.answer("Avtomobil ma’lumotlari tekshirilmoqda...")
    try:
        result = valuation(car)
    except HTTPException as exc:
        if exc.status_code == 503:
            await message.answer(
                "Narx hisoblash modeli hali tayyor emas. Hozircha ishonchli, ruxsatli bozor ma’lumotlari yig‘ilishi kerak. "
                "Model tayyor bo‘lmaguncha taxminiy narx ko‘rsatmaymiz."
            )
        else:
            await message.answer(f"Baholash amalga oshmadi: {exc.detail}")
        return
    except Exception:
        logger.exception("AutoPrice valuation failed")
        await message.answer("Hozir baholashda xatolik yuz berdi. Keyinroq qayta urinib ko‘ring.")
        return

    price_range = result["estimated_range"]
    await message.answer(
        f"AutoPrice natijasi\n"
        f"Avtomobil: {make} {model}, {year}\n"
        f"Taxminiy narx: {_format_uzs(result['estimated_price'])} so‘m\n"
        f"Taxminiy oraliq: {_format_uzs(price_range['lower'])} – "
        f"{_format_uzs(price_range['upper'])} so‘m\n\n"
        "Bu statistik taxmin, yakuniy bitim narxi emas. Avtomobilni ko‘zdan kechirish zarur."
    )


@router.post("/telegram/webhook")
async def telegram_webhook(
    request: Request,
    x_telegram_bot_api_secret_token: str | None = Header(default=None, alias="X-Telegram-Bot-Api-Secret-Token"),
):
    expected_secret = (os.getenv("TELEGRAM_WEBHOOK_SECRET") or "").strip()
    if not expected_secret:
        raise HTTPException(status_code=503, detail="TELEGRAM_WEBHOOK_SECRET sozlanmagan.")
    if not x_telegram_bot_api_secret_token or not hmac.compare_digest(
        x_telegram_bot_api_secret_token, expected_secret
    ):
        # Log diagnostic metadata only; never log either secret value.
        logger.warning(
            "Telegram webhook secret mismatch: header_present=%s header_length=%s expected_length=%s",
            bool(x_telegram_bot_api_secret_token),
            len(x_telegram_bot_api_secret_token or ""),
            len(expected_secret),
        )
        raise HTTPException(status_code=403, detail="Webhook secret noto‘g‘ri.")

    bot = _get_bot()
    try:
        payload = await request.json()
        update = Update.model_validate(payload)
        await _dispatcher.feed_update(bot, update)
    except Exception:
        logger.exception("Telegram webhook update failed")
        raise HTTPException(status_code=500, detail="Telegram update qayta ishlanmadi.")
    return {"ok": True}
