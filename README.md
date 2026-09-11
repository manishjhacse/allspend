# AllSpend — AI-Powered Local-First Expense Tracker PWA

AllSpend is a privacy-first, local-first personal finance PWA designed to instantly track your expenses by scanning payment screenshots using **Google Gemini 2.5 Flash Vision AI**. 

It works seamlessly offline, supports Android Web Share Target (share payment receipts directly from PhonePe, GPay, Paytm, or Gallery), and keeps 100% of your financial data on your local device.

---

## ✨ Features

- 📸 **Direct Web Share Target**: Share payment receipts directly from any payment app or gallery to AllSpend without opening the browser first.
- 🤖 **Gemini 2.5 Flash AI Vision**: Instantly parses payment screenshots to extract merchant name, expense category, date, transaction ID, and amount.
- 🔑 **Custom Gemini Key & Quota Management**: Built-in fallback quota system with support for custom user API keys.
- ✨ **Interactive 2-Step Onboarding**: A smooth, animated introduction asking for your name, monthly salary, and target spending budget.
- 📊 **Analytics & Budget Tracking**: Real-time spending charts, category breakdown donuts, and month-over-month comparisons.
- 🔒 **100% Private & Local Storage**: Powered by IndexedDB via Dexie.js — your data never leaves your device storage.
- 📱 **Installable PWA**: Works offline with native app feel, smart install prompts, 24-hour suppression handling, and desktop sidebar navigation.
- 💾 **Data Ownership & Backup**: Complete JSON export/import and CSV export for external analysis in Excel or Google Sheets.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router, JavaScript)
- **AI Engine**: Google Gemini 2.5 Flash (`@google/genai`)
- **Database**: [Dexie.js](https://dexie.org/) (IndexedDB wrapper)
- **PWA & Service Worker**: Custom Service Worker + Web Share Target API
- **Styling**: Modern Vanilla CSS, CSS Modules & Glassmorphism Design System

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm or yarn

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/manishjhacse/allspend.git
   cd allspend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up Environment Variables**:
   Create a `.env.local` file in the root directory:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Run Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

5. **Build for Production**:
   ```bash
   npm run build
   npm start
   ```

---

## 📱 Android Web Share Target Setup

1. Open AllSpend in Chrome on Android or Desktop.
2. Tap **Install App** from the top banner, settings screen, or browser menu.
3. Make a payment in GPay, PhonePe, or Paytm and take a screenshot.
4. Open your phone's Gallery / Photos app ➔ Tap **Share** ➔ Select **AllSpend**.
5. AllSpend automatically parses the payment details and prompts you to confirm & save!

---

## 📁 Project Architecture

```text
allspend/
├── public/                # Icons, PWA manifest, and static assets
│   ├── manifest.json      # Web App Manifest & Share Target spec
│   └── sw.js              # Service Worker handling offline & share targets
├── src/
│   ├── app/               # Next.js App Router pages
│   │   ├── page.js        # Home Dashboard (expenses, budgets, analytics)
│   │   ├── import/        # Screenshot import & OCR processing flow
│   │   ├── reports/       # Detailed expense history & category charts
│   │   ├── settings/      # Account, targets, Gemini keys, & data backup
│   │   └── share-target/  # Route handling Android Web Share Target POSTs
│   ├── components/        # UI components
│   │   ├── expenses/      # Expense cards, forms & list filters
│   │   ├── layout/        # AppShell, SideNav, BottomNav, ErrorBoundary
│   │   ├── onboarding/    # 2-step interactive onboarding modal
│   │   ├── screenshot/    # OCR processor & confirmation dialogs
│   │   ├── settings/      # User Gemini Key Manager
│   │   └── ui/            # Toast, Modal, ClientPortal, PWAInstall components
│   ├── hooks/             # React hooks (useExpenses, usePWAInstall, useToast, etc.)
│   └── lib/               # Utilities (db.js, formatters.js, backup.js, ai/)
└── README.md
```

---

## 🔒 Privacy & Security

AllSpend stores all expense records, category rules, and merchant mappings strictly in **IndexedDB** inside your local browser storage. No user account creation or external database syncing is required.
