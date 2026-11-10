# AutoPrice Telegram bot

The bot uses Telegram webhooks so it can run as a Vercel Python Function. It does not use polling.

## Commands

- `/start` — instructions
- `/estimate` — submit a car in one message

Example:

```text
/estimate Chevrolet | Cobalt | 2020 | 85000 | avtomat | benzin | Toshkent | yaxshi
```

The eight fields are make, model, year, mileage in km, transmission, fuel type, region, and condition.

## Vercel environment variables

Set these in the Vercel project settings (do not commit real tokens):

- `TELEGRAM_BOT_TOKEN` — token from Telegram's BotFather
- `TELEGRAM_WEBHOOK_SECRET` — random secret, 32+ characters recommended

After deployment, register the webhook once by opening this URL in a browser, replacing the placeholders:

```text
https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook?url=https://<YOUR_VERCEL_DOMAIN>/api/telegram/webhook&secret_token=<TELEGRAM_WEBHOOK_SECRET>
```

The URL must be HTTPS. Keep the bot token private.

## Important MVP limitations

- The bot is stateless and accepts all vehicle details in one command. This avoids unreliable in-memory conversation state in serverless functions.
- The valuation endpoint returns HTTP 503 until a model trained on permitted, real market data is added. The bot explains this and never invents a price.
- Photos are not analyzed yet.
- The webhook stores no user profile or vehicle history. Telegram itself processes the messages.
- The Vercel function and the Next.js frontend can be deployed from this repository, but the deployment still requires Vercel project setup and environment variables.
