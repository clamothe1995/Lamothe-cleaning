# Lamothe Cleaning Deployment (IIS + Separate Mail Server)

This setup uses one PC with two separate folders:
- IIS website folder (static site files)
- Node mail API folder (contact form backend)

The frontend submits to `/api/contact`, and IIS forwards `/api/*` requests to the Node mail server.

## Recommended Folder Layout

Use any paths you want, but keep site and server separate.

```text
C:\inetpub\wwwroot\lamothe-site\
	html\
		index.html
		gen.html
	css\
		index.css
		gen.css
	js\
		index.js
		gen.js
	assets\
		manifest.json
		apple-touch-icon.png
		favicon-32.png
		icon-192.png
		icon-512.png
		logo_transparent.png
	CNAME
	web.config

C:\services\lamothe-mail-server\
	server.js
	package.json
	package-lock.json
	.env
	(node_modules after npm install)
```

## 1) What Goes In Each Folder

### A) IIS site folder (static frontend)

Copy these files to your IIS site folder:
- `html/index.html`, `html/gen.html`
- `css/index.css`, `css/gen.css`
- `js/index.js`, `js/gen.js`
- `assets/manifest.json` and image/icon files
- `CNAME`
- `web.config` (IIS rewrite/proxy rules)

Do not place `server.js` in the IIS static folder for this split setup.

### B) Mail server folder (Node backend)

Copy these files to your Node mail server folder:
- `server.js`
- `package.json`
- `package-lock.json`
- `.env` (mail + SMTP settings)

## 2) Install Mail Server Dependencies

Open terminal in the mail server folder and run:

```bash
npm install
```

## 3) Configure Mail Server Environment

Create/update `.env` in the mail server folder:

```env
PORT=3001

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_smtp_username
SMTP_PASS=your_smtp_password_or_app_password

MAIL_FROM=your_from_email@example.com
MAIL_TO=your_destination_email@example.com
```

Notes:
- Use a Google App Password if you use Gmail.
- `MAIL_FROM` is sender address.
- `MAIL_TO` is destination for contact submissions.

## 4) Start Mail Server

From the mail server folder:

```bash
npm start
```

If `PORT=3001`, API health check is:
- `http://localhost:3001/health`

## 5) IIS Configuration (Frontend + API Proxy)

In IIS, host your static website from the IIS site folder.

Enable these IIS modules/features:
- URL Rewrite
- Application Request Routing (ARR), with proxy enabled

Use this `web.config` in the IIS site folder to forward `/api/*` to Node on port 3001:

```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
	<system.webServer>
		<rewrite>
			<rules>
				<rule name="API Reverse Proxy" stopProcessing="true">
					<match url="^api/(.*)" />
					<action type="Rewrite" url="http://localhost:3001/api/{R:1}" />
				</rule>
				<rule name="Static Fallback" stopProcessing="true">
					<match url=".*" />
					<conditions>
						<add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
						<add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
					</conditions>
					<action type="Rewrite" url="/html/index.html" />
				</rule>
			</rules>
		</rewrite>
	</system.webServer>
</configuration>
```

## 6) Run Order

1. Start Node mail server (`npm start` in mail server folder).
2. Start IIS site (or recycle app pool).
3. Open your website URL and test the contact form.

## Troubleshooting

- If form submit fails, confirm Node server is running and `/health` works on its port.
- If browser says non-JSON response, IIS rewrite for `/api/*` is likely incorrect.
- If email fails with auth errors, verify SMTP username/password or App Password.
