# Lamothe Mail Server

This service handles contact form submissions from the Lamothe Cleaning website and sends emails through SMTP.

## What It Does

- Exposes `POST /api/contact` to receive contact form data.
- Validates required fields (`customerName`, `customerEmail`, `customerPhone`).
- Uses a honeypot field (`companyWebsite`) to reduce spam.
- Sends formatted email notifications using Nodemailer.
- Exposes `GET /health` for a simple health check.

## Requirements

- Node.js 18+ (recommended)
- SMTP credentials (for example, Gmail SMTP with an App Password)

## Environment Variables

Create a `.env` file in this folder using `.env.example` as a template:

- `PORT` - Port the server listens on (default: `3000`)
- `SMTP_HOST` - SMTP host (default: `smtp.gmail.com`)
- `SMTP_PORT` - SMTP port (default: `587`)
- `SMTP_USER` - SMTP username/email
- `SMTP_PASS` - SMTP password or app password
- `MAIL_FROM` - From address shown on outgoing emails
- `MAIL_TO` - Destination address for form notifications

## Local Setup

From this folder:

```bash
npm install
npm start
```

Server starts on `http://localhost:3000` unless `PORT` is overridden.

## API Endpoint

### `POST /api/contact`

Expected JSON payload includes:

- `customerName` (required)
- `customerEmail` (required)
- `customerPhone` (required)
- `serviceAddress` (optional)
- `quoteSummary` (optional)
- `quoteTotal` (optional)
- `customerMessage` (optional)
- `companyWebsite` (optional honeypot; should remain empty)

Success response:

```json
{ "ok": true, "message": "Request sent successfully." }
```

Error response:

```json
{ "ok": false, "message": "..." }
```

## Notes

- If using Gmail SMTP, use an App Password for `SMTP_PASS`.
- If startup fails with `EADDRINUSE`, stop the process using the same port or change `PORT`.
