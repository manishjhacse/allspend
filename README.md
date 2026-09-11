# AllSpend — Personal Expense Tracker PWA

A local-first, privacy-focused personal expense tracker PWA built with Next.js.

## Features

- 📸 **Screenshot Import** — Share payment screenshots from any UPI app directly to AllSpend
- 🔍 **Local OCR** — Tesseract.js reads your screenshot locally, nothing is uploaded
- 💾 **IndexedDB** — All data stored on your device via Dexie.js
- 📊 **Reports** — Monthly/yearly spending charts with category breakdown
- 🔄 **Backup** — JSON export/import + CSV export
- 📱 **PWA** — Installable, works offline, Android Share Sheet support

## Tech Stack

- **Next.js 16** (JavaScript, App Router)
- **Tailwind CSS v4**
- **Dexie.js** + dexie-react-hooks (IndexedDB)
- **Tesseract.js v7** (local OCR)
- **Recharts** (analytics charts)
- **next-pwa** (service worker + Web Share Target)

## Getting Started

```bash
npm install
npm run dev       # development
npm run build     # production build
npm start         # serve production
```

Open [http://localhost:3000](http://localhost:3000)

## Android Share Target

1. Open the app in Chrome on Android
2. Tap ⋮ → **Add to Home Screen**
3. After installing: make a payment → take screenshot → **Share → AllSpend**

> **Privacy:** Your screenshots are processed locally using Tesseract.js. No data leaves your device.

## Data Storage

All expenses are stored in **IndexedDB** on your device. Use Settings → Export Backup to save your data.
