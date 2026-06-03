# 🏗️ MUMTAZ MEDICAL — COMPLETE PROJECT BLUEPRINT
## ══════════════════════════════════════════════════════════════════

> **Version:** 2.0 | **Date:** 2026-05-30  
> **Status:** 📝 Pre-Development Planning  
> **Total Documents:** 1 Master Blueprint (this file)  
> **Purpose:** Everything needed BEFORE we write code

---

## 📖 TABLE OF CONTENTS

1. [Tech Stack Review & Justification](#1--tech-stack-review--justification)
2. [Alternative Stacks Considered](#2--alternative-stacks-considered)
3. [Complete File Structure](#3--complete-file-structure)
4. [Component Hierarchy](#4--component-hierarchy)
5. [Data Flow Architecture](#5--data-flow-architecture)
6. [Sync Strategy Detail](#6--sync-strategy-detail)
7. [Database Schema (Final)](#7--database-schema-final)
8. [Development Roadmap (16 Weeks)](#8--development-roadmap-16-weeks)
9. [Risk Analysis](#9--risk-analysis)
10. [Testing Strategy](#10--testing-strategy)
11. [Deployment Checklist](#11--deployment-checklist)
12. [Performance Budget](#12--performance-budget)
13. [Security Considerations](#13--security-considerations)

---

## 1. 📊 TECH STACK REVIEW & JUSTIFICATION

### CHOSEN STACK

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│   React 18 + Vite 5 + Tailwind CSS 3                 │
│   Zustand 4 + Dexie.js 4 + Supabase 2                │
│   Recharts 2 + html5-qrcode + JsBarcode              │
│   Vercel (deploy) + GitHub (code)                     │
│                                                      │
│   💰 Monthly Cost: $0                                │
│   📱 Works on: Android, iOS, Windows, Mac, Linux     │
│   🌐 Offline: YES (IndexedDB first)                  │
│   🔄 Multi-device: YES (Supabase Realtime)           │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### WHY EACH CHOICE:

#### ✅ React 18 (not Vue, not Angular, not Svelte)

| Factor | React | Vue | Angular | Svelte |
|--------|-------|-----|---------|--------|
| AI training data | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| Component libraries | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ |
| Job market (future hire) | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| PWA support | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| Learning curve | Medium | Easy | Hard | Easy |
| Bundle size (min) | ~42KB | ~33KB | ~130KB | ~8KB |
| **Our Score** | **95** | 80 | 60 | 65 |

**Winner: React** — AI knows it best (critical since AI is building), biggest ecosystem, most community support.

#### ✅ Vite 5 (not Create React App, not Next.js)

| Factor | Vite | CRA | Next.js |
|--------|------|-----|---------|
| Build speed | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ |
| Dev experience | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| PWA plugin | ✅ vite-plugin-pwa | ❌ Dead | ✅ next-pwa |
| Static export (PWA) | ✅ Native | ✅ | ✅ |
| Complexity | Simple | Simple | Complex |
| SSR needed? | ❌ No | ❌ No | ❌ Overkill |
| **Our Score** | **98** | 60 | 70 |

**Winner: Vite** — Our app is a PWA (runs in browser, no server rendering needed). Next.js adds complexity we don't need. CRA is dead (no longer maintained).

#### ✅ Tailwind CSS (not Bootstrap, not MUI, not Chakra)

| Factor | Tailwind | Bootstrap | MUI | Chakra |
|--------|----------|-----------|-----|--------|
| Dark mode | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Custom design | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| Bundle size | Tiny (purged) | Large | Large | Medium |
| Pharmacy green theme | Easy | Hard | Medium | Easy |
| Glassmorphism | Easy | Hard | Medium | Easy |
| Responsive utilities | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| AI productivity | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| **Our Score** | **97** | 65 | 75 | 78 |

**Winner: Tailwind** — Dark mode is a core requirement. Custom pharmacy green theme. Glassmorphism login. Tailwind handles all of this natively.

#### ✅ Zustand (not Redux, not Context API, not MobX)

| Factor | Zustand | Redux Toolkit | Context API | MobX |
|--------|---------|---------------|-------------|------|
| Boilerplate | Minimal | Heavy | Medium | Medium |
| Bundle size | 1.1KB | 11KB | 0KB (native) | 16KB |
| TypeScript | Good | Great | Native | Good |
| DevTools | Good | Great | None | Good |
| Learning curve | Easy | Medium | Easy | Medium |
| For small-medium apps | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Our Score** | **93** | 80 | 70 | 65 |

**Winner: Zustand** — Simple, lightweight, perfect for our scale. Redux is overkill for a single pharmacy app.

#### ✅ Dexie.js (not LocalForage, not IndexedDB raw, not localStorage)

| Factor | Dexie.js | LocalForage | Raw IndexedDB | localStorage |
|--------|----------|-------------|---------------|-------------|
| API simplicity | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐ | ⭐⭐⭐⭐⭐ |
| Query support | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐ | ⭐⭐ |
| Relations | ⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐ | ⭐ |
| Reactive (live queries) | ⭐⭐⭐⭐⭐ | ❌ | ❌ | ❌ |
| Storage limit | ~500MB+ | ~500MB+ | ~500MB+ | 5-10MB |
| **Our Score** | **98** | 70 | 40 | 30 |

**Winner: Dexie.js** — Reactive live queries mean UI auto-updates when data changes. Essential for real-time POS.

#### ✅ Supabase (not Firebase, not MongoDB, not PocketBase)

| Factor | Supabase | Firebase | MongoDB Atlas | PocketBase |
|--------|----------|----------|---------------|------------|
| Database type | **PostgreSQL** | Firestore (NoSQL) | MongoDB | SQLite |
| SQL queries (reports) | ⭐⭐⭐⭐⭐ | ❌ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Joins (sale+customer+staff) | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Realtime sync | ✅ WebSocket | ✅ Built-in | ❌ | ❌ |
| Free tier DB size | 500MB | 1GB | 512MB | Self-hosted |
| Free tier reads/day | Unlimited | 50K | 500/day | Unlimited |
| **35 report features** | **Easy SQL** | Very Hard | Medium | Easy SQL |
| Open source | ✅ | ❌ | ❌ | ✅ |
| Image storage | 1GB free | 5GB free | ❌ | Self-hosted |
| **Our Score** | **96** | 75 | 60 | 70 |

**Winner: Supabase** — The 35 reporting features require complex queries (joins, aggregations, date filtering). PostgreSQL handles this natively. Firestore would be a nightmare for reports.

---

## 2. 🔄 ALTERNATIVE STACKS CONSIDERED

### Alternative A: "Maximum Simplicity"
```
Vue 3 + Quasar + Firebase
```
**Why rejected:** Quasar adds opinionated UI that conflicts with custom dark theme. Firebase's NoSQL makes 35 report features extremely difficult.

### Alternative B: "Maximum Performance"
```
Svelte + SvelteKit + PocketBase (self-hosted)
```
**Why rejected:** Svelte has less AI training data (risky for AI-built project). PocketBase requires a server to host (not free easily).

### Alternative C: "Enterprise Grade"
```
Next.js 14 + Prisma + PlanetScale + AWS
```
**Why rejected:** Way too complex for a single pharmacy. Would cost $20-50/month. Overkill for 20-50 sales/day.

### Alternative D: "No Framework"
```
Vanilla JS + IndexedDB + Supabase
```
**Why rejected:** Would take 2-3x longer to build. No component reuse. Hard to maintain.

### FINAL VERDICT:
```
🏆 React + Vite + Tailwind + Zustand + Dexie + Supabase
   = Best balance of: AI productivity, Free cost, Offline-first, Reports capability
```

---

## 3. 📁 COMPLETE FILE STRUCTURE

```
mumtaz-medical/
│
├── 📄 .gitignore
├── 📄 .env                          # Supabase URL + Anon Key
├── 📄 .env.example                  # Template (no secrets)
├── 📄 package.json
├── 📄 vite.config.js                # Vite + PWA config
├── 📄 tailwind.config.js            # Dark mode + custom colors
├── 📄 postcss.config.js
├── 📄 index.html                    # Entry HTML
├── 📄 README.md                     # Project documentation
│
├── 📂 public/
│   ├── 📂 icons/
│   │   ├── icon-72x72.png
│   │   ├── icon-96x96.png
│   │   ├── icon-128x128.png
│   │   ├── icon-144x144.png
│   │   ├── icon-152x152.png
│   │   ├── icon-192x192.png
│   │   ├── icon-384x384.png
│   │   └── icon-512x512.png
│   ├── favicon.ico
│   └── manifest.json                # PWA manifest
│
├── 📂 src/
│   │
│   ├── 📄 main.jsx                  # ReactDOM.createRoot + App
│   ├── 📄 App.jsx                   # Router + Layout + Global providers
│   ├── 📄 index.css                 # Tailwind + custom CSS + scrollbar + animations
│   │
│   ├── 📂 db/                       # 💾 DATABASE LAYER
│   │   ├── 📄 index.js              # Dexie database definition (all 12 tables)
│   │   ├── 📄 supabase.js           # Supabase client (url, key)
│   │   ├── 📄 sync.js               # Full sync engine
│   │   │                            #   - pushLocalToCloud()
│   │   │                            #   - pullCloudToLocal()
│   │   │                            #   - listenRealtime()
│   │   │                            #   - resolveConflicts()
│   │   ├── 📄 seed.js               # First-launch auto-seed (STAFF-001 / PIN 1234)
│   │   └── 📄 backup.js             # JSON export/import
│   │
│   ├── 📂 store/                    # 🧠 STATE MANAGEMENT (Zustand)
│   │   ├── 📄 authStore.js          # currentUser, role, login(), logout(), emergencyLogin()
│   │   ├── 📄 posStore.js           # cart[], discount, customer, payment, completeSale()
│   │   ├── 📄 inventoryStore.js     # products[], batches[], stockIn(), alerts
│   │   ├── 📄 customerStore.js      # customers[], suppliers[], payments, ledger
│   │   ├── 📄 expenseStore.js       # expenses[], totals
│   │   ├── 📄 reportStore.js        # dashboardData, bestProducts, salesHistory, pAndL
│   │   ├── 📄 staffStore.js         # staff[], addStaff(), deactivateStaff()
│   │   ├── 📄 settingsStore.js      # settings (single object), updateSetting()
│   │   ├── 📄 logStore.js           # addLog(), getLogs() — IMMUTABLE
│   │   └── 📄 syncStore.js          # isOnline, lastSyncAt, queueLength, syncStatus
│   │
│   ├── 📂 hooks/                    # 🪝 CUSTOM REACT HOOKS
│   │   ├── 📄 useAuth.js            # isAuthenticated, currentUser, role, permissions
│   │   ├── 📄 useOnlineStatus.js    # isOnline, wasOffline, syncQueue
│   │   ├── 📄 usePermissions.js     # canDo(action) — role-based permission checker
│   │   ├── 📄 useSync.js            # autoSync, manualSync, conflictResolution
│   │   ├── 📄 useBillNumber.js      # generateBillNumber(staffCode, deviceType)
│   │   └── 📄 useDaySession.js      # openDay(), closeDay(), isDayOpen
│   │
│   ├── 📂 utils/                    # 🔧 UTILITY FUNCTIONS
│   │   ├── 📄 billNumber.js         # generateBillNumber(staffCode, index, device)
│   │   ├── 📄 barcode.js            # generateBarcode(code128), printBarcode()
│   │   ├── 📄 profitCalc.js         # calcItemProfit(), calcBillProfit()
│   │   ├── 📄 discountCalc.js       # calcFlatDiscount(), calcMarginDiscount()
│   │   ├── 📄 loyaltyCalc.js        # getStage(), getNextStageInfo()
│   │   ├── 📄 whatsapp.js           # generateWhatsAppLink(phone, message)
│   │   ├── 📄 receipt.js            # generateReceiptHTML(sale, settings)
│   │   ├── 📄 csvExport.js          # exportToCSV(data, filename)
│   │   ├── 📄 rules.js              # enforceRules(action) — 63 rules as code
│   │   ├── 📄 pinValidator.js       # validatePin(pin) — no 1111, 2222, 1234, 4321
│   │   ├── 📄 idGenerator.js        # generateStaffId(), generateCustomerId()
│   │   ├── 📄 currency.js           # formatCurrency(amount) → "Rs. 100/-"
│   │   └── 📄 dateUtils.js          # formatDate(), isOverdue(), daysUntil()
│   │
│   ├── 📂 constants/               # 📋 CONSTANTS & CONFIG
│   │   ├── 📄 roles.js              # ROLES object + PERMISSIONS map
│   │   ├── 📄 categories.js         # 21 MEDICINE_CATEGORIES
│   │   ├── 📄 rules.js              # 63 rules as constants
│   │   ├── 📄 defaults.js           # Default settings values
│   │   └── 📄 messages.js           # Urdu messages for WhatsApp
│   │
│   ├── 📂 components/              # 🧱 REUSABLE COMPONENTS
│   │   │
│   │   ├── 📂 layout/
│   │   │   ├── 📄 Sidebar.jsx       # Role-based menu items
│   │   │   ├── 📄 Header.jsx        # Shop name, user info, online badge
│   │   │   ├── 📄 MobileDrawer.jsx  # Hamburger menu drawer
│   │   │   ├── 📄 PageWrapper.jsx   # Consistent page layout
│   │   │   └── 📄 OfflineBadge.jsx  # Online/Offline indicator
│   │   │
│   │   ├── 📂 ui/
│   │   │   ├── 📄 Button.jsx        # Primary, secondary, danger variants
│   │   │   ├── 📄 Card.jsx          # Bordered card with dark mode
│   │   │   ├── 📄 Modal.jsx         # Scrollable modal with overlay
│   │   │   ├── 📄 Table.jsx         # Responsive table (hides cols on mobile)
│   │   │   ├── 📄 Badge.jsx         # Role badges, VIP, Doctor, etc.
│   │   │   ├── 📄 Input.jsx         # Text, number, date inputs
│   │   │   ├── 📄 PinPad.jsx        # 4-digit PIN with dots animation
│   │   │   ├── 📄 SearchBar.jsx     # Debounced search input
│   │   │   ├── 📄 Tabs.jsx          # Tab navigation component
│   │   │   ├── 📄 Accordion.jsx     # Collapsible accordion
│   │   │   ├── 📄 StatsCard.jsx     # Dashboard stat card
│   │   │   ├── 📄 EmptyState.jsx    # No data placeholder
│   │   │   ├── 📄 Loading.jsx       # Spinner/skeleton loader
│   │   │   └── 📄 ConfirmDialog.jsx # Are you sure? dialog
│   │   │
│   │   ├── 📂 pos/
│   │   │   ├── 📄 ProductGrid.jsx   # Product cards with search/filter
│   │   │   ├── 📄 CartPanel.jsx     # Cart items, totals, controls
│   │   │   ├── 📄 PaymentModal.jsx  # Cash/Pending/Credit flow
│   │   │   ├── 📄 DiscountPanel.jsx # Flat/Margin/Global discount UI
│   │   │   ├── 📄 CustomerSelector.jsx # Attach customer to sale
│   │   │   ├── 📄 BarcodeScanner.jsx # Camera + USB scanner
│   │   │   ├── 📄 BatchSelector.jsx # Select batch for each product
│   │   │   ├── 📄 ReceiptPreview.jsx # Receipt before print
│   │   │   └── 📄 SaleSuccess.jsx   # Success banner + actions
│   │   │
│   │   ├── 📂 inventory/
│   │   │   ├── 📄 ProductForm.jsx   # Add/Edit product (12 fields)
│   │   │   ├── 📄 StockInModal.jsx  # Stock-in form (qty, price, batch, expiry)
│   │   │   ├── 📄 AlertPanel.jsx    # Smart alert panel (collapsible)
│   │   │   ├── 📄 PurchaseWishlist.jsx # Purchase wish list
│   │   │   ├── 📄 ExpiryBadge.jsx   # 🟡🔴⛔ expiry badges
│   │   │   └── 📄 StockBadge.jsx    # ⚠️🔴 stock level badges
│   │   │
│   │   ├── 📂 ledger/
│   │   │   ├── 📄 CustomerCard.jsx  # Customer detail card
│   │   │   ├── 📄 SupplierCard.jsx  # Supplier detail card
│   │   │   ├── 📄 PaymentHistory.jsx # Payment timeline
│   │   │   ├── 📄 PartialPayModal.jsx # Make partial payment
│   │   │   └── 📄 OverdueBanner.jsx # Red overdue warning
│   │   │
│   │   ├── 📂 reports/
│   │   │   ├── 📄 DashboardTab.jsx  # Today's overview
│   │   │   ├── 📄 BestProductsTab.jsx # Products ranked
│   │   │   ├── 📄 BrandCategoryTab.jsx # Breakdown charts
│   │   │   ├── 📄 SalesHistoryTab.jsx # All bills table
│   │   │   ├── 📄 ProfitLossTab.jsx # P&L report
│   │   │   ├── 📄 StaffPerfTab.jsx   # Staff ranking
│   │   │   └── 📄 ChartWrapper.jsx  # Recharts wrapper
│   │   │
│   │   └── 📂 shared/
│   │       ├── 📄 ReceiptPrinter.jsx # Print via browser dialog
│   │       ├── 📄 WhatsAppButton.jsx # Open WhatsApp link
│   │       ├── 🔗 SyncIndicator.jsx # Sync status indicator
│   │       └── 📄 VersionBadge.jsx  # App version display
│   │
│   ├── 📂 pages/                   # 📄 PAGE COMPONENTS (1 per route)
│   │   ├── 📄 Login.jsx            # Login page (PIN pad + emergency)
│   │   ├── 📄 POS.jsx              # Main POS (split panel)
│   │   ├── 📄 Inventory.jsx        # Products + batches + alerts
│   │   ├── 📄 Ledger.jsx           # Customers + Suppliers tabs
│   │   ├── 📄 Expenses.jsx         # Expense management
│   │   ├── 📄 Reports.jsx          # 6-tab reports
│   │   ├── 📄 Staff.jsx            # Staff CRUD
│   │   ├── 📄 ActivityLog.jsx      # Immutable logs (4 tabs)
│   │   ├── 📄 PrintHistory.jsx     # Past bills
│   │   ├── 📄 Settings.jsx         # All settings + backup
│   │   ├── 📄 DaySession.jsx       # Day open/close
│   │   └── 📄 FirstLaunch.jsx      # Welcome + setup wizard
│   │
│   └── 📂 styles/
│       └── 📄 receipt.css           # Receipt-specific print styles
│
└── 📂 docs/                         # 📚 DOCUMENTATION
    ├── 📄 ARCHITECTURE.md           # This file
    ├── 📄 API.md                    # Supabase table docs
    └── 📄 RULES.md                  # 63 rules reference
```

---

## 4. 🧱 COMPONENT HIERARCHY

```
App.jsx
├── <FirstLaunch />          (if no settings exist)
│   └── WelcomeBanner
│   └── SetupWizard
│
├── <Login />                (if not authenticated)
│   ├── PinPad
│   │   ├── PinDots
│   │   └── NumericButtons
│   ├── EmergencyLogin
│   │   ├── Step1_NameInput
│   │   └── Step2_MasterPassword
│   └── BarcodeScanner (staff ID)
│
└── <AuthenticatedApp />     (after login)
    ├── Header
    │   ├── ShopName
    │   ├── DaySessionBadge
    │   ├── OnlineBadge
    │   └── UserMenu (role badge, logout)
    │
    ├── Sidebar (role-filtered)
    │   ├── NavItem → POS
    │   ├── NavItem → Inventory
    │   ├── NavItem → Ledger
    │   ├── NavItem → Expenses
    │   ├── NavItem → Reports
    │   ├── NavItem → Staff (Owner+)
    │   ├── NavItem → Activity Log (Owner+)
    │   ├── NavItem → Print History
    │   ├── NavItem → Settings (Owner+)
    │   └── NavItem → Day Session
    │
    └── <Routes />
        ├── /pos → POSPage
        │   ├── ProductGrid
        │   │   ├── SearchBar
        │   │   ├── CategoryFilter
        │   │   ├── ProductCard (×N)
        │   │   └── BarcodeScanner
        │   ├── CartPanel
        │   │   ├── CartItem (×N)
        │   │   ├── BatchSelector
        │   │   ├── DiscountPanel
        │   │   ├── CustomerSelector
        │   │   ├── PendingBalanceWarning
        │   │   └── PaymentModal
        │   │       ├── CashPayment
        │   │       ├── PendingPayment
        │   │       └── CreditNotePayment
        │   └── SaleSuccess
        │       ├── ReceiptPreview
        │       ├── WhatsAppButton
        │       └── PrintButton
        │
        ├── /inventory → InventoryPage
        │   ├── AlertPanel (collapsible)
        │   │   ├── PurchaseListAccordion
        │   │   ├── LowStockAccordion
        │   │   ├── NearEndAccordion
        │   │   └── ExpiryAccordion
        │   ├── ProductTable
        │   ├── ProductForm (modal)
        │   ├── StockInModal
        │   └── PurchaseWishlist
        │
        ├── /ledger → LedgerPage
        │   ├── CustomerTab
        │   │   ├── CustomerCard (×N)
        │   │   ├── CustomerDetail (modal)
        │   │   ├── PartialPayModal
        │   │   └── OverdueBanner
        │   └── SupplierTab
        │       ├── SupplierCard (×N)
        │       └── SupplierDetail (modal)
        │
        ├── /expenses → ExpensesPage
        ├── /reports → ReportsPage (6 tabs)
        ├── /staff → StaffPage
        ├── /logs → ActivityLogPage
        ├── /print-history → PrintHistoryPage
        ├── /settings → SettingsPage
        └── /day → DaySessionPage
```

---

## 5. 🔄 DATA FLOW ARCHITECTURE

### User Action Flow:
```
┌──────────────────────────────────────────────────────────────┐
│                    USER CLICKS BUTTON                         │
│                    (e.g., "Complete Sale")                    │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────┐
│               ZUSTAND STORE (posStore.completeSale())        │
│                                                              │
│  1. Validate (63 rules via rules.js)                         │
│  2. Calculate (profit, discount, loyalty)                    │
│  3. Generate bill number                                     │
│  4. Write to Dexie.js (local IndexedDB)                     │
│  5. Add to sync queue                                       │
│  6. Add to activity log                                     │
│  7. Update UI state                                         │
└──────────────────────┬───────────────────────────────────────┘
                       │
          ┌────────────┴────────────┐
          │                         │
          ▼                         ▼
┌─────────────────┐    ┌─────────────────────────────────────┐
│   UI UPDATES    │    │   SYNC ENGINE (background)          │
│   (instant)     │    │                                     │
│                 │    │   If ONLINE:                         │
│ • Cart cleared  │    │   → Push to Supabase                │
│ • Stock updated │    │   → Realtime notifies other devices │
│ • Success toast │    │                                     │
│                 │    │   If OFFLINE:                        │
│                 │    │   → Queue locally                   │
│                 │    │   → Auto-sync when back online      │
└─────────────────┘    └─────────────────────────────────────┘
```

### Data Read Flow:
```
┌──────────────────────────────────────────────────────────────┐
│                    COMPONENT NEEDS DATA                       │
│                    (e.g., product list)                       │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────┐
│              DEXIE LIVE QUERY (reactive)                     │
│                                                              │
│   db.products.toArray() → returns Promise                    │
│   useLiveQuery(() => db.products.toArray()) → reactive!      │
│                                                              │
│   • Always reads from LOCAL IndexedDB                        │
│   • Auto-updates when data changes (from sync too!)          │
│   • Works OFFLINE                                            │
└──────────────────────────────────────────────────────────────┘
```

### Sync Flow (Detail):
```
DEVICE A (sells Panadol)                SUPABASE              DEVICE B
     │                                    │                      │
     ├─ 1. Write to IndexedDB ─────┐       │                      │
     │   (instant, offline OK)     │       │                      │
     │                             │       │                      │
     ├─ 2. Add to sync_queue ──────┤       │                      │
     │   {table: 'sales',          │       │                      │
     │    action: 'INSERT',        │       │                      │
     │    data: {...}}              │       │                      │
     │                             │       │                      │
     ├─ 3. If ONLINE ──────────────┼──────►│                      │
     │   POST /sales               │       │                      │
     │                             │       ├─ 4. Broadcast ──────┤
     │                             │       │   REALTIME          │
     │                             │       │   (WebSocket)       │
     │                             │       │                      ├─ 5. Receive
     │                             │       │                      │   event
     │                             │       │                      │
     │                             │       │                      ├─ 6. Write to
     │                             │       │                      │   IndexedDB
     │                             │       │                      │
     │                             │       │                      ├─ 7. Live query
     │                             │       │                      │   triggers
     │                             │       │                      │   UI update
     │                             │       │                      │
     └─────────────────────────────┘       │                      │
                                           │                      │
```

---

## 6. 🔄 SYNC STRATEGY DETAIL

### Sync Queue Schema (in IndexedDB):
```javascript
// Stored in a separate Dexie table
{
  id: auto,
  tableName: 'sales',        // Which table
  action: 'INSERT',           // INSERT, UPDATE, DELETE
  recordId: 'uuid-xxx',       // Record ID
  data: {...},                // Full record data
  timestamp: Date.now(),      // When queued
  retries: 0,                 // Retry count
  status: 'pending'           // pending, syncing, failed
}
```

### Sync Rules:

| Situation | What Happens |
|-----------|-------------|
| App goes ONLINE | Push all pending queue items to Supabase |
| App stays ONLINE | Auto-push each new write within 2 seconds |
| App goes OFFLINE | Queue locally, show "Offline" badge |
| App comes back ONLINE | Auto-flush queue, pull latest changes |
| Conflict detected | Last-write-wins (timestamp comparison) |
| 2 devices sell same product | Both sales count, stock may go negative (if setting allows) |
| Supabase is down | Queue locally, retry every 30 seconds |

### Tables Sync Priority:

| Priority | Tables | Sync Direction |
|----------|--------|---------------|
| HIGH (realtime) | sales, product_batches, logs | Bidirectional |
| MEDIUM | customers, suppliers, expenses | Bidirectional |
| LOW (on change) | settings, staff | Cloud → Local |
| N/A | day_sessions | Local only (per device) |
| N/A | partial_payments | Bidirectional |
| N/A | purchase_list | Bidirectional |
| N/A | products | Bidirectional |

---

## 7. 🗄️ DATABASE SCHEMA (FINAL — 12 Tables)

### ER DIAGRAM:
```
┌──────────────┐     ┌──────────────────┐     ┌──────────────┐
│    STAFF      │     │    PRODUCTS      │     │  SETTINGS    │
│──────────────│     │──────────────────│     │──────────────│
│ id (PK)      │     │ id (PK)          │     │ id (PK=1)    │
│ staff_id     │     │ name             │     │ shop_name    │
│ name         │     │ barcode          │     │ ...all setngs│
│ role         │     │ brand            │     └──────────────┘
│ pin          │     │ category         │
│ short_code ◄─┼─────│ unit             │
│ is_active    │     │ image            │     ┌──────────────┐
└──────┬───────┘     │ is_active        │     │ DAY_SESSIONS │
       │             └────────┬─────────┘     │──────────────│
       │                      │               │ id (PK)      │
       │                      ▼               │ opened_by FK │
       │             ┌──────────────────┐     │ opening_cash │
       │             │ PRODUCT_BATCHES  │     │ status       │
       │             │──────────────────│     └──────────────┘
       │             │ id (PK)          │
       │             │ product_id (FK) ─┼──► products
       │             │ batch_number     │
       │             │ purchase_price   │
       │             │ sale_price       │
       │             │ quantity         │
       │             │ expiry_date      │
       │             │ low_stock_alert  │
       │             │ near_end_alert   │
       │             └──────────────────┘
       │
       │  ┌──────────────┐     ┌──────────────────┐
       ├──│    SALES      │◄────│ PARTIAL_PAYMENTS │
       │  │──────────────│     │──────────────────│
       │  │ id (PK)      │     │ id (PK)          │
       │  │ bill_number  │     │ sale_id (FK)     │
       │  │ customer_id ─┼──►  │ customer_id (FK) │
       │  │ cashier_id ──┤     │ amount           │
       │  │ items (JSON) │     │ remaining        │
       │  │ subtotal     │     └──────────────────┘
       │  │ discount_*   │
       │  │ total        │     ┌──────────────────┐
       │  │ profit       │     │    EXPENSES       │
       │  │ payment_mode │     │──────────────────│
       │  │ is_return    │     │ id (PK)          │
       │  │ original_id ◄┼──►  │ type             │
       │  └──────────────┘     │ amount           │
       │                       │ supplier_id (FK) │
       │  ┌──────────────┐     │ sale_id (FK)     │
       │  │ CUSTOMERS    │     └──────────────────┘
       │  │──────────────│
       ├──│ id (PK)      │     ┌──────────────────┐
       │  │ customer_id  │     │    SUPPLIERS      │
       │  │ name         │     │──────────────────│
       │  │ type         │     │ id (PK)          │
       │  │ pending_amt  │     │ name             │
       │  │ loyalty_pts  │     │ type             │
       │  └──────┬───────┘     │ phone, email    │
       │         │              │ address, notes  │
       │         │              └──────────────────┘
       │         │
       │  ┌──────┴───────┐     ┌──────────────────┐
       │  │ PURCHASE_LIST│     │    LOGS           │
       │  │──────────────│     │──────────────────│
       │  │ id (PK)      │     │ id (PK)          │
       │  │ name         │     │ user_id          │
       │  │ qty, unit    │     │ action           │
       │  │ is_done      │     │ details (JSON)   │
       │  │ supplier_id  │     │ timestamp        │
       │  └──────────────┘     │ ⛔ NEVER DELETE  │
       │                       └──────────────────┘
       │
       └─── cashier_id in SALES points to STAFF.id
           customer_id in SALES points to CUSTOMERS.id
           original_sale_id in SALES points to SALES.id (returns)
```

---

## 8. 🗺️ DEVELOPMENT ROADMAP (16 Weeks)

### PHASE A: FOUNDATION (Week 1-2)

```
Week 1: Project Setup
├── Day 1-2: Create repo, Vite + React + Tailwind + PWA setup
├── Day 3: Dexie.js schema (all 12 tables)
├── Day 4: Supabase project + tables SQL
├── Day 5: Git workflow + .env + README
└── Day 6-7: Basic layout (Sidebar + Header + Routing)

Week 2: Auth System
├── Day 1-2: Login page + PinPad component
├── Day 3: Emergency login flow
├── Day 4: Session management + role detection
├── Day 5: First-launch auto-seed
└── Day 6-7: Role-based sidebar + permissions hook
```

### PHASE B: CORE POS (Week 3-5)

```
Week 3: Product Grid + Cart
├── Day 1-2: Product grid with search + filter
├── Day 3-4: Cart panel (add, remove, quantity)
├── Day 5: Barcode scanner (camera + USB)
└── Day 6-7: Auto-merge duplicate products

Week 4: Discounts + Payment
├── Day 1-2: Discount system (flat + margin + global)
├── Day 3: Customer selector + VIP/Doctor badges
├── Day 4-5: Payment modal (cash/pending/credit)
└── Day 6-7: Bill number generation + stock deduction

Week 5: Receipt + Success
├── Day 1-2: Receipt HTML generation (thermal + A4)
├── Day 3: Browser print integration
├── Day 4: Success banner + WhatsApp send
├── Day 5: Reprint functionality
└── Day 6-7: Testing + bug fixes
```

### PHASE C: INVENTORY (Week 6-8)

```
Week 6: Products + Batches
├── Day 1-2: Product CRUD (add/edit/deactivate)
├── Day 3-4: Multi-batch system
├── Day 5: Batch selector in POS
└── Day 6-7: Barcode generation + print

Week 7: Alerts + Stock
├── Day 1-2: Expiry alerts (3 levels)
├── Day 3: Low stock + near-end alerts
├── Day 4: Smart alert panel
├── Day 5: Stock-in flow
└── Day 6-7: Purchase wish list

Week 8: Polish Inventory
├── Day 1-2: Image upload (base64)
├── Day 3: Duplicate barcode check
├── Day 4: Purchase price hidden from salesperson
├── Day 5: Category filter (21 categories)
└── Day 6-7: Testing + edge cases
```

### PHASE D: LEDGER (Week 9-10)

```
Week 9: Customers
├── Day 1-2: Customer CRUD + types (Regular/VIP/Doctor)
├── Day 3: Customer detail + purchase history
├── Day 4: Partial payments + running balance
├── Day 5: Overdue handling + owner block decision
└── Day 6-7: WhatsApp Urdu reminders

Week 10: Suppliers + Expenses
├── Day 1-2: Supplier CRUD (Preferred/Normal)
├── Day 3: Supplier history + linked expenses
├── Day 4: Expense management (3 types)
├── Day 5: Expense enable/disable + totals
└── Day 6-7: Testing + integration
```

### PHASE E: REPORTS (Week 11-12)

```
Week 11: Dashboard + Best Products
├── Day 1-2: Dashboard tab (today's overview)
├── Day 3: 7-day area chart
├── Day 4: Best products (1-100) with sort/filter
├── Day 5: Bar chart top 10 + medals
└── Day 6-7: CSV export

Week 12: Sales History + P&L + Staff
├── Day 1-2: Sales history table + search + filter
├── Day 3: Brand/Category breakdown (donut + bar)
├── Day 4: P&L report (revenue vs expenses)
├── Day 5: Staff performance ranking
└── Day 6-7: All reports testing
```

### PHASE F: STAFF + LOGS (Week 13-14)

```
Week 13: Staff Management
├── Day 1-2: Staff CRUD + auto ID
├── Day 3: PIN management (self/owner/super)
├── Day 4: Deactivate + role assignment
├── Day 5: Barcode staff card print
└── Day 6-7: Super admin key system testing

Week 14: Activity Log + Print History
├── Day 1-2: Activity log (immutable, 4 tabs)
├── Day 3: Log filters + CSV export
├── Day 4: Print history + stats
├── Day 5: Emergency login logging
└── Day 6-7: Full log immutability testing
```

### PHASE G: LOYALTY + SETTINGS (Week 15)

```
Week 15: Loyalty + Settings
├── Day 1-2: Loyalty system (4 stages + auto points)
├── Day 3: Loyalty stage + progress in customer card
├── Day 4: Settings page (all 27+ settings)
├── Day 5: Backup JSON export/import
└── Day 6-7: Day open/close + cash drawer
```

### PHASE H: SYNC + POLISH (Week 16)

```
Week 16: Final Integration
├── Day 1-2: Supabase sync engine implementation
├── Day 3: Multi-device testing
├── Day 4: Offline queue + auto-reconnect testing
├── Day 5: PWA install testing (Android + Desktop)
├── Day 6: Full dark mode polish + responsive fixes
└── Day 7: Final testing + deployment to Vercel
```

---

## 9. ⚠️ RISK ANALYSIS

| Risk | Severity | Likelihood | Mitigation |
|------|----------|-----------|------------|
| IndexedDB data loss (clear browser) | HIGH | Medium | Backup JSON export, Supabase cloud copy |
| Supabase free tier limit reached | HIGH | Low | Monitor usage, optimize queries |
| Dexie.js + Supabase sync conflicts | MEDIUM | Medium | Last-write-wins + timestamp comparison |
| Barcode scanner not working on iOS | MEDIUM | Medium | Test with html5-qrcode iOS fallback |
| PWA not installable on iOS Safari | LOW | High | Add all required meta tags + manifest |
| PIN brute force attack | MEDIUM | Low | Add 3-attempt lockout + delay |
| Large product images (2MB each) | LOW | Medium | Compress before storing as base64 |
| Offline queue grows too large | LOW | Low | Cap queue at 1000 items, warn user |
| Supabase goes down | HIGH | Very Low | App works offline, syncs when back |
| Vercel deployment fails | LOW | Very Low | Netlify as backup deploy target |

---

## 10. 🧪 TESTING STRATEGY

### Manual Testing Checklist (per phase):

```
AUTH:
☐ Login with correct PIN → enters app
☐ Login with wrong PIN → shake animation, no entry
☐ Login with deactivated staff → blocked
☐ Emergency login with "sorRy#13" → Super Admin access
☐ Emergency login with wrong key → logged + blocked
☐ Browser refresh → stays logged in
☐ Browser close → logged out
☐ First launch → auto-seeds STAFF-001 / PIN 1234
☐ PIN 1111 / 1234 / 4321 → rejected
☐ Barcode scan staff ID → auto-login

POS:
☐ Add product to cart → stock deducted
☐ Add same product again → quantity merges
☐ Expired product → greyed out, can't add
☐ Out of stock → greyed out, can't add
☐ Flat discount 10% → total correct
☐ Margin discount → shows amount, not %
☐ Global discount + manual override → manual wins
☐ Cash sale → loyalty points added
☐ Pending sale → no loyalty, payback date required
☐ Bill number format → [StaffCode]-[Index]-[Device]
☐ Print receipt → opens browser print dialog
☐ WhatsApp send → opens WhatsApp with correct message

INVENTORY:
☐ Add product with duplicate barcode → rejected
☐ Deactivate product → can't sell, appears in history
☐ Reactivate product → can sell again
☐ Stock-in → quantity increases
☐ Expiry 7 months → yellow badge
☐ Expiry 3 months → red badge
☐ Expired → blocked badge
☐ Low stock → warning alert
☐ Salesperson can't see purchase price
☐ Batch selector → can pick specific batch

LEDGER:
☐ Customer pending → shows in ledger
☐ Partial payment → balance updates correctly
☐ Overdue → red banner, owner decides to block
☐ Mark paid → balance goes to 0
☐ WhatsApp reminder → Urdu message opens

SYNC:
☐ Device A sells → Device B sees in <3 seconds
☐ Go offline → queue builds up
☐ Come online → queue flushes to Supabase
☐ 2 devices sell same product → both count
☐ Clear browser data → restore from backup
```

---

## 11. 🚀 DEPLOYMENT CHECKLIST

### Pre-Deploy:
```
☐ All 293+ features implemented
☐ All 63 rules enforced
☐ PWA manifest correct
☐ Service worker caches all pages
☐ Supabase tables created
☐ Environment variables set
☐ Test on Chrome (desktop)
☐ Test on Chrome (Android)
☐ Test on Safari (iOS)
☐ Test on Firefox
☐ Offline mode tested
☐ Multi-device sync tested
☐ Backup/restore tested
```

### Deploy to Vercel:
```
1. Push code to GitHub
2. Connect GitHub repo to Vercel
3. Set environment variables in Vercel
4. Deploy!
5. Test live URL on mobile
6. Install as PWA on test device
7. Test offline mode on live
```

### Post-Deploy:
```
☐ Set up Supabase backups (daily auto)
☐ Monitor free tier usage
☐ Test PWA install on Android
☐ Test PWA install on Desktop Chrome
☐ Share URL with pharmacy owner
☐ Train owner on Day Open/Close
```

---

## 12. 📊 PERFORMANCE BUDGET

| Metric | Target | Why |
|--------|--------|-----|
| First load (3G) | < 3 seconds | Pharmacy counter can't wait |
| Time to Interactive | < 2 seconds | Fast login → sell |
| Bundle size (gzipped) | < 200KB | Fast download on slow internet |
| Dexie read | < 50ms | Instant product search |
| Dexie write | < 100ms | Fast sale completion |
| Sync push | < 2 seconds | Near-instant multi-device |
| PWA cache hit | < 100ms | Offline page load |
| Memory usage | < 100MB | Works on old phones |
| IndexedDB size (typical) | < 50MB | Well within browser limits |
| Receipt print | < 1 second | No waiting at counter |

### Code Splitting Strategy:
```
├── main.js          (50KB) — React + Router + Auth (always loaded)
├── pos.js           (40KB) — POS page (lazy loaded)
├── inventory.js     (25KB) — Inventory page (lazy loaded)
├── ledger.js        (20KB) — Ledger page (lazy loaded)
├── reports.js       (30KB) — Reports + Recharts (lazy loaded)
├── settings.js      (15KB) — Settings page (lazy loaded)
└── vendor.js        (50KB) — Zustand + Dexie + Supabase
                    ─────────
TOTAL first load:    ~100KB gzipped (main + vendor only)
```

---

## 13. 🔒 SECURITY CONSIDERATIONS

| Concern | Solution |
|---------|----------|
| PIN stored in DB | Hash with SHA-256 + salt |
| Super key in settings | Encrypted in Supabase, not in IndexedDB |
| Supabase API key exposed | Use RLS (Row Level Security) policies |
| XSS attack | React escapes by default, sanitize receipt HTML |
| CSRF | Not applicable (no cookies, token-based) |
| Data breach | Supabase RLS + encrypted connection |
| Backup file theft | JSON backup is plain — owner responsibility |
| Multiple failed logins | Log all attempts, optional lockout after 5 |
| Deactivated user re-login | Check is_active on every login |

### Supabase RLS (Row Level Security):
```sql
-- Only authenticated devices can read/write
-- No anonymous access
-- Each shop has its own data (future multi-tenant)
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
-- ... all tables
```

---

## 📊 SUMMARY STATISTICS

| What | Count/Value |
|------|-------------|
| Total features | 299 (293 original + 6 new) |
| Total settings | 27 (20 original + 7 new) |
| Total rules | 63 |
| Database tables | 12 |
| React components | ~80 |
| Zustand stores | 10 |
| Custom hooks | 6 |
| Utility files | 13 |
| Pages/routes | 11 |
| Development weeks | 16 |
| Monthly cost | **$0** |
| NPM packages | 18 |

---

*This document is the single source of truth for the Mumtaz Medical project.*
*Last Updated: 2026-05-30 | Blueprint Version: 2.0*
