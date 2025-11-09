# ZAT Print Tray

ZAT Print Tray is a lightweight Electron background application that exposes a local HTTP API for discovering printers and dispatching silent print jobs. It is designed to sit in the system tray, start automatically with the operating system, and bridge web-based point-of-sale systems to native printer capabilities.

👉 **Download:** [Get the latest installer](https://drive.google.com/drive/folders/1Eems3pgGCFhB1wqeHUeNb76n20vECfeG?usp=drive_link)

## Features

- Starts as a single-instance Electron tray utility with optional auto-launch at login.
- Local REST API for health checks, printer discovery, and triggering print jobs.
- Silent printing from raw HTML snippets or remote URLs with configurable print options.
- Cross-platform packaging via `electron-builder` for macOS, Windows, and Linux.
- CORS controls for fine-grained origin safelists or fully open local access.

## Requirements

- Node.js 18 or newer (Electron 39 requires minimum Node 18 runtime for development).
- npm 9+ (ships with current Node installers).
- macOS, Windows, or Linux workstation with installed system printers.

## Getting Started

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Create a `.env` file** (optional but recommended) alongside `package.json` to control runtime settings:

   ```bash
   cp .env.example .env    # if you maintain a template
   ```

   Add the variables described in the [Configuration](#configuration) section.

3. **Run in development**

   ```bash
   npm run dev
   ```

   This launches Electron and starts the local API server once the tray window is initialised.

4. **Build distributables**

   ```bash
   npm run dist
   ```

   Packages are emitted to the `dist/` directory for the host platform (DMG/ZIP for macOS, NSIS installer for Windows x64, AppImage for Linux).

## Configuration

All configuration is provided through environment variables (directly or via a `.env` file loaded with `dotenv`):

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `PRINT_TRAY_PORT` | ✅ | — | Port number used by the local API server (localhost only). |
| `PRINT_TRAY_ALLOWED_ORIGINS` | ❌ | _empty_ | Comma-separated list of allowed origins for CORS. |
| `PRINT_TRAY_ALLOW_ALL_ORIGINS` | ❌ | `false` | Set to `true` to allow every origin (`Access-Control-Allow-Origin: *`). Ignored when explicit origins are supplied. |

If neither CORS variable is provided, the API only accepts same-origin requests (i.e. direct curl/postman calls without an `Origin` header).

## API Reference

All endpoints listen on `http://127.0.0.1:<PRINT_TRAY_PORT>`.

### `GET /health`

Returns application status and host information.

```json
{
  "status": "ok",
  "platform": "darwin",
  "release": "25.0.0",
  "version": "1.0.0"
}
```

### `GET /printers`

Lists available printers. Electron’s printer enumeration is used first; if unavailable, the app falls back to `systeminformation`.

### `POST /print`

Enqueues a silent print job. Provide either `html` or `url` in the request body.

```json
{
  "printerName": "HP LaserJet",
  "html": "<html>…</html>",
  "copies": 1,
  "landscape": false,
  "printBackground": true
}
```

| Field | Type | Notes |
| --- | --- | --- |
| `html` | string | Raw HTML content to print. Mutually exclusive with `url`. |
| `url` | string | Remote URL to load and print. |
| `printerName` | string | Optional device name returned by `/printers`. Defaults to system default printer. |
| `copies` | integer | Number of copies (defaults to 1). |
| `landscape` | boolean | Print orientation (defaults to `false`). |
| `printBackground` | boolean | Include CSS backgrounds (defaults to `true`). |

If the payload is invalid, the API replies with HTTP 400. Print errors respond with HTTP 500.

## Logging

The application uses `electron-log` and writes structured output to the platform-specific log directory (e.g. `~/Library/Logs/zat-print-tray` on macOS). Review these logs when diagnosing startup or printing issues.

## Production Notes

- The app holds a single-instance lock to avoid concurrent API servers.
- `app.setLoginItemSettings({ openAtLogin: true })` is invoked on startup to register auto-launch. Adjust if your deployment requires a different behaviour.
- Update the icons in `build/icons/` before producing customer builds.
