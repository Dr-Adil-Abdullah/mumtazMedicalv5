# 🏥 MUMTAX MEDICAL — TECH STACK RECOMMENDATION
## ═══════════════════════════════════════════════════

> **Date:** 2026-05-30  
> **Decision Basis:** 30 questions answered, 293+ features, zero budget, offline-first, AI-built  
> **Status:** ✅ FINAL RECOMMENDATION

---

## 📋 KEY CONSTRAINTS (from Q&A)

| Constraint | Answer | Impact |
|-----------|--------|--------|
| Budget | **$0 (free only)** | Firebase/Supabase free tier |
| Developer | **AI builds, user manages** | Simple, well-documented stack |
| Timeline | **3-6 months** | Quality over speed |
| Build | **Fresh from zero** | Clean architecture |
| Offline | **Critical** | Local-first database |
| Devices | **4-6 simultaneous** | Real-time sync needed |
| Scale | **20-50 sales/day** | Small pharmacy, light load |

---

## 🏆 RECOMMENDED TECH STACK

```
┌─────────────────────────────────────────────┐
│           📱 FRONTEND (PWA)                 │
│                                             │
│   React 18 + Vite + Tailwind CSS            │
│   Zustand (state) + Dexie.js (local DB)     │
│   Recharts (charts) + html5-qrcode          │
│                                             │
├─────────────────────────────────────────────┤
│           ☁️ SYNC LAYER                     │
│                                             │
│   Supabase (Free Tier)                      │
│   PostgreSQL + Realtime + Auth + Storage    │
│                                             │
├─────────────────────────────────────────────┤
│           🌐 DEPLOYMENT (FREE)              │
│                                             │
│   Vercel or Netlify                         │
│   Custom domain optional                    │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 🔧 DETAILED BREAKDOWN

### 1️⃣ FRONTEND — React 18 + Vite

| Technology | Purpose | Why This? |
|-----------|---------|-----------|
| **React 18** | UI Framework | Most AI training data, biggest ecosystem |
| **Vite 5** | Build tool | Lightning fast, modern, PWA plugin |
| **Tailwind CSS** | Styling | Dark mode built-in, rapid development |
| **Zustand** | State management | Simpler than Redux, perfect for this scale |
| **React Router v6** | Navigation | Standard React routing |
| **Dexie.js** | Local database (IndexedDB) | Best IndexedDB wrapper, reactive queries |
| **Recharts** | Charts (35 report features) | React-native charts, donut/bar/area |
| **html5-qrcode** | Camera barcode scanner | Works on all mobile browsers |
| **JsBarcode** | Barcode generation (Code 128) | For product/staff/customer barcode cards |
| **date-fns** | Date formatting | Lightweight date library |
| **react-hot-toast** | Notifications | Success/error banners |
| **vite-plugin-pwa** | PWA (installable app) | Service worker + offline caching |

### 2️⃣ SYNC & CLOUD — Supabase (FREE)

| Supabase Feature | Use In Mumtaz Medical | Free Tier Limit |
|-----------------|----------------------|-----------------|
| **PostgreSQL** | Cloud database (all 11 tables) | 500 MB |
| **Realtime** | Multi-device instant sync | 200 concurrent connections |
| **Auth** | (Not used — custom PIN login) | 50,000 MAU |
| **Storage** | Product images, logos | 1 GB |
| **Edge Functions** | (Optional later) | 500K invocations/month |

**Why Supabase over Firebase?**

| Factor | Supabase ✅ | Firebase ❌ |
|--------|-----------|-----------|
| Database | **PostgreSQL (SQL!)** | Firestore (NoSQL) |
| Complex Reports (35 features) | **SQL queries = easy** | NoSQL = very hard |
| Joins (Sales + Customer + Staff) | **Native SQL joins** | Manual, slow |
| Data Integrity | **Foreign keys, constraints** | Limited |
| Offline Support | Custom (Dexie.js) | Built-in |
| Vendor Lock-in | **Open source** | Google proprietary |
| Free Tier | 500MB DB + 1GB storage | 1GB stored + 50K reads/day |
| Multi-device sync | **Realtime (WebSocket)** | Firestore sync |

**Winner: Supabase** — because 35 report features with complex queries is nearly impossible in Firestore's NoSQL. PostgreSQL handles it easily.

### 3️⃣ DEPLOYMENT — Vercel (FREE)

| Platform | Free Tier | Why |
|----------|----------|-----|
| **Vercel** | 100GB bandwidth/month, auto-deploy | Best for React/Vite, easiest setup |
| Netlify | 100GB bandwidth/month | Good alternative |
| GitHub Pages | Unlimited (static) | No server-side, but works for PWA |

**Recommendation: Vercel** — connects to GitHub, auto-deploys on push, free SSL, fast CDN.

---

## 🗄️ DATABASE ARCHITECTURE

### Local-First Strategy (CRITICAL)

```
USER ACTION (Sale, Stock-In, etc.)
        │
        ▼
┌─────────────────┐
│   IndexedDB     │ ← IMMEDIATE (0ms)
│   (Dexie.js)    │   App always reads/writes here first
│                 │
│   • Products    │
│   • Customers   │
│   • Sales       │
│   • All tables  │
└────────┬────────┘
         │ Background (if online)
         ▼
┌─────────────────┐
│   Supabase      │ ← SYNC LAYER
│   PostgreSQL    │
│                 │
│   • Same tables │
│   • Real-time   │
│   • Reports run │
│     from here   │
└─────────────────┘
         │ WebSocket
         ▼
┌─────────────────┐
│   OTHER DEVICES │ ← INSTANT SYNC
│   (4-6 devices) │
└─────────────────┘
```

**How it works:**
1. **All reads → IndexedDB** (instant, works offline)
2. **All writes → IndexedDB first**, then queue for sync
3. **Background sync → Supabase** (when online)
4. **Supabase Realtime →** pushes changes to other devices
5. **Other devices →** receive and update their IndexedDB

### Updated Database Schema (11 Tables)

```sql
-- TABLE 1: STAFF
CREATE TABLE staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id TEXT UNIQUE NOT NULL,        -- STAFF-001
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('super_admin','owner','manager','salesperson')),
  pin TEXT NOT NULL,                      -- encrypted
  phone TEXT,
  short_code TEXT UNIQUE,                 -- 2-3 letters for bill number (AH, MK)
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- TABLE 2: PRODUCTS
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  barcode TEXT UNIQUE,
  brand TEXT,
  category TEXT,                          -- 21 categories
  unit TEXT,                              -- 20ml, 100mg, 10 tablets
  image TEXT,                             -- base64, max 2MB
  is_active BOOLEAN DEFAULT true,         -- deactivatable, never deleted
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- TABLE 3: PRODUCT_BATCHES (NEW!)
CREATE TABLE product_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id),
  batch_number TEXT NOT NULL,
  purchase_price DECIMAL(10,2) NOT NULL,
  sale_price DECIMAL(10,2) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  expiry_date DATE,
  low_stock_alert INTEGER DEFAULT 10,
  near_end_alert INTEGER DEFAULT 5,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- TABLE 4: CUSTOMERS
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id TEXT UNIQUE NOT NULL,       -- CID-1234
  name TEXT NOT NULL,
  type TEXT DEFAULT 'regular' CHECK (type IN ('regular','vip','doctor')),
  phone TEXT,
  pending_amount DECIMAL(10,2) DEFAULT 0,
  loyalty_points INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- TABLE 5: SUPPLIERS
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT DEFAULT 'normal' CHECK (type IN ('preferred','normal')),
  phone TEXT,
  email TEXT,
  address TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- TABLE 6: SALES
CREATE TABLE sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_number TEXT UNIQUE NOT NULL,       -- AH-0001-M
  customer_id UUID REFERENCES customers(id),
  items JSONB NOT NULL,                   -- [{productId, batchId, name, qty, price, discount...}]
  subtotal DECIMAL(10,2) NOT NULL,
  discount_type TEXT CHECK (discount_type IN ('flat','margin','none')),
  discount_value DECIMAL(5,2) DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  profit DECIMAL(10,2) NOT NULL,
  payment_mode TEXT NOT NULL CHECK (payment_mode IN ('cash','pending','credit')),
  amount_paid DECIMAL(10,2) DEFAULT 0,
  return_amount DECIMAL(10,2) DEFAULT 0,
  balance_owed DECIMAL(10,2) DEFAULT 0,
  payback_date DATE,
  cashier_id UUID REFERENCES staff(id),
  is_return BOOLEAN DEFAULT false,         -- NEW: marks return bills
  original_sale_id UUID REFERENCES sales(id), -- NEW: links return to original
  created_at TIMESTAMPTZ DEFAULT now()
);

-- TABLE 7: EXPENSES
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('medicine_purchase','monthly','daily','return_payment')),
  description TEXT,
  amount DECIMAL(10,2) NOT NULL,
  date DATE NOT NULL,
  supplier_id UUID REFERENCES suppliers(id),
  is_enabled BOOLEAN DEFAULT true,
  sale_id UUID REFERENCES sales(id),       -- NEW: link to return sale
  created_at TIMESTAMPTZ DEFAULT now()
);

-- TABLE 8: PURCHASE_LIST
CREATE TABLE purchase_list (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  qty TEXT,
  unit TEXT,
  note TEXT,
  is_done BOOLEAN DEFAULT false,
  supplier_id UUID REFERENCES suppliers(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- TABLE 9: LOGS (IMMUTABLE — NEVER DELETE)
CREATE TABLE logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  user_name TEXT,
  action TEXT NOT NULL,                    -- LOGIN/LOGOUT/SALE/STOCK_IN/EDIT/DELETE/SETTING_CHANGE/BACKUP/EMERGENCY_LOGIN
  details JSONB,
  timestamp TIMESTAMPTZ DEFAULT now(),
  device_info TEXT
);
-- RULE: No DELETE permission on this table ever

-- TABLE 10: SETTINGS (single row)
CREATE TABLE settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1), -- enforce single row
  shop_name TEXT DEFAULT 'Mumtaz Medical',
  address TEXT,
  phone TEXT,
  logo TEXT,
  currency TEXT DEFAULT 'Rs.',
  low_stock_default INTEGER DEFAULT 10,
  near_end_default INTEGER DEFAULT 5,
  pending_min_amount DECIMAL(10,2) DEFAULT 100,
  require_phone_for_vip BOOLEAN DEFAULT true,
  loyalty_enabled BOOLEAN DEFAULT true,
  loyalty_points_rate INTEGER DEFAULT 1,
  loyalty_silver_at INTEGER DEFAULT 100,
  loyalty_gold_at INTEGER DEFAULT 500,
  loyalty_platinum_at INTEGER DEFAULT 2000,
  global_discount_enabled BOOLEAN DEFAULT false,
  global_discount_type TEXT DEFAULT 'flat',
  global_discount_percent DECIMAL(5,2) DEFAULT 0,
  max_discount_percent DECIMAL(5,2) DEFAULT 100,
  discount_mode TEXT DEFAULT 'percent',     -- percent/flat/no_profit
  cart_item_limit INTEGER DEFAULT 0,        -- 0 = unlimited
  allow_negative_stock BOOLEAN DEFAULT false,
  receipt_format TEXT DEFAULT 'thermal',    -- thermal/a4
  tax_enabled BOOLEAN DEFAULT false,        -- NEW
  tax_percent DECIMAL(5,2) DEFAULT 0,       -- NEW
  auto_block_overdue BOOLEAN DEFAULT false, -- NEW
  super_key_1 TEXT NOT NULL,                -- "sorRy#13"
  super_key_2 TEXT,                         -- Manager key
  super_key_3 TEXT,                         -- Salesperson key
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- TABLE 11: PARTIAL_PAYMENTS (NEW!)
CREATE TABLE partial_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID REFERENCES sales(id),
  customer_id UUID REFERENCES customers(id),
  amount DECIMAL(10,2) NOT NULL,
  remaining_balance DECIMAL(10,2) NOT NULL,
  payment_date TIMESTAMPTZ DEFAULT now(),
  received_by UUID REFERENCES staff(id)
);

-- TABLE 12: DAY_SESSIONS (NEW! for Day Open/Close)
CREATE TABLE day_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opened_by UUID REFERENCES staff(id),
  opened_at TIMESTAMPTZ DEFAULT now(),
  opening_cash DECIMAL(10,2) DEFAULT 0,
  closed_by UUID REFERENCES staff(id),
  closed_at TIMESTAMPTZ,
  closing_cash DECIMAL(10,2),
  expected_cash DECIMAL(10,2),
  difference DECIMAL(10,2),
  status TEXT DEFAULT 'open' CHECK (status IN ('open','closed'))
);
```

---

## 📁 PROJECT FILE STRUCTURE

```
mumtaz-medical/
├── public/
│   ├── icons/                    # PWA icons (192x192, 512x512)
│   ├── manifest.json             # PWA manifest
│   └── sw.js                     # Service worker
│
├── src/
│   ├── main.jsx                  # App entry point
│   ├── App.jsx                   # Root component + router
│   ├── index.css                 # Tailwind imports + custom CSS
│   │
│   ├── db/                       # DATABASE LAYER
│   │   ├── index.js              # Dexie.js database schema
│   │   ├── sync.js               # Supabase ↔ Dexie sync engine
│   │   └── supabase.js           # Supabase client config
│   │
│   ├── store/                    # STATE MANAGEMENT (Zustand)
│   │   ├── authStore.js          # Login, session, role
│   │   ├── posStore.js           # Cart, discounts, payment
│   │   ├── inventoryStore.js     # Products, batches, alerts
│   │   ├── customerStore.js      # Customers, ledger, payments
│   │   ├── expenseStore.js       # Expenses
│   │   ├── reportStore.js        # Report calculations
│   │   └── settingsStore.js      # All settings
│   │
│   ├── hooks/                    # CUSTOM HOOKS
│   │   ├── useAuth.js
│   │   ├── useOnlineStatus.js
│   │   ├── useSync.js
│   │   └── usePermissions.js
│   │
│   ├── utils/                    # UTILITY FUNCTIONS
│   │   ├── billNumber.js         # [StaffCode]-[Index]-[Device]
│   │   ├── barcode.js            # Barcode generation
│   │   ├── profitCalc.js         # Profit calculations
│   │   ├── discountCalc.js       # Discount logic
│   │   ├── loyaltyCalc.js        # Loyalty stage calculator
│   │   ├── whatsapp.js           # WhatsApp link generator
│   │   ├── receipt.js            # Receipt template generator
│   │   ├── exportCSV.js          # CSV export
│   │   ├── rules.js              # 63 permanent rules enforcer
│   │   └── validation.js         # PIN validation, etc.
│   │
│   ├── components/               # REUSABLE COMPONENTS
│   │   ├── layout/
│   │   │   ├── Sidebar.jsx
│   │   │   ├── Header.jsx
│   │   │   ├── MobileDrawer.jsx
│   │   │   └── OfflineBadge.jsx
│   │   ├── ui/
│   │   │   ├── Button.jsx
│   │   │   ├── Card.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── Table.jsx
│   │   │   ├── Badge.jsx
│   │   │   ├── Input.jsx
│   │   │   └── PinPad.jsx
│   │   ├── pos/
│   │   │   ├── ProductGrid.jsx
│   │   │   ├── CartPanel.jsx
│   │   │   ├── PaymentModal.jsx
│   │   │   ├── DiscountPanel.jsx
│   │   │   ├── CustomerSelector.jsx
│   │   │   └── BarcodeScanner.jsx
│   │   ├── inventory/
│   │   │   ├── ProductForm.jsx
│   │   │   ├── StockInModal.jsx
│   │   │   ├── BatchSelector.jsx
│   │   │   ├── AlertPanel.jsx
│   │   │   └── PurchaseWishlist.jsx
│   │   ├── reports/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── BestProducts.jsx
│   │   │   ├── BrandCategory.jsx
│   │   │   ├── SalesHistory.jsx
│   │   │   ├── ProfitLoss.jsx
│   │   │   └── StaffPerformance.jsx
│   │   └── shared/
│   │       ├── ReceiptPrinter.jsx
│   │       ├── WhatsAppButton.jsx
│   │       └── SyncIndicator.jsx
│   │
│   ├── pages/                    # PAGE COMPONENTS
│   │   ├── Login.jsx             # Premium login screen
│   │   ├── EmergencyLogin.jsx    # Emergency login flow
│   │   ├── POS.jsx               # Main POS page
│   │   ├── Inventory.jsx         # Inventory management
│   │   ├── Ledger.jsx            # Customers + Suppliers
│   │   ├── Expenses.jsx          # Expense management
│   │   ├── Reports.jsx           # All reports (6 tabs)
│   │   ├── Staff.jsx             # Staff management
│   │   ├── ActivityLog.jsx       # Immutable logs
│   │   ├── PrintHistory.jsx      # Bill history
│   │   ├── Settings.jsx          # All settings
│   │   └── DaySession.jsx        # Day open/close
│   │
│   └── constants/                # CONSTANTS
│       ├── roles.js              # Role definitions + permissions
│       ├── categories.js         # 21 medicine categories
│       └── rules.js              # 63 permanent rules as code
│
├── tailwind.config.js
├── vite.config.js
├── package.json
├── .env                          # Supabase URL + key
└── README.md
```

---

## 📦 KEY NPM PACKAGES

```json
{
  "dependencies": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "react-router-dom": "^6.23.0",
    "zustand": "^4.5.0",
    "dexie": "^4.0.0",
    "dexie-react-hooks": "^1.1.0",
    "@supabase/supabase-js": "^2.43.0",
    "recharts": "^2.12.0",
    "html5-qrcode": "^2.3.0",
    "jsbarcode": "^3.11.0",
    "date-fns": "^3.6.0",
    "react-hot-toast": "^2.4.0",
    "react-to-print": "^2.15.0"
  },
  "devDependencies": {
    "vite": "^5.2.0",
    "vite-plugin-pwa": "^0.20.0",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "@vitejs/plugin-react": "^4.2.0"
  }
}
```

---

## 💰 COST ANALYSIS (ALL FREE!)

| Service | Plan | Cost | Notes |
|---------|------|------|-------|
| Supabase | Free | **$0/mo** | 500MB DB, 1GB storage |
| Vercel | Hobby | **$0/mo** | 100GB bandwidth |
| Domain | Optional | **$0** | Use .vercel.app subdomain |
| GitHub | Free | **$0/mo** | Code hosting |
| **TOTAL** | | **$0/month** | 🎉 |

---

## 🚀 DEVELOPMENT PHASES

### Phase A: Foundation (Week 1-2)
- [ ] Project setup (Vite + React + Tailwind + PWA)
- [ ] Dexie.js database schema
- [ ] Supabase project setup
- [ ] Auth system (PIN login + emergency keys)
- [ ] Basic layout (sidebar + routing)

### Phase B: Core POS (Week 3-5)
- [ ] Product grid + cart
- [ ] Barcode scanning
- [ ] Payment flow (cash/pending/credit)
- [ ] Receipt printing
- [ ] Discount system (flat + margin + global)

### Phase C: Inventory & Ledger (Week 6-8)
- [ ] Product CRUD + batches
- [ ] Stock-in flow
- [ ] Alert system (expiry + low stock)
- [ ] Customer management
- [ ] Supplier management
- [ ] Partial payments
- [ ] Overdue handling

### Phase D: Reports & Staff (Week 9-11)
- [ ] Dashboard (6 report tabs)
- [ ] P&L reports
- [ ] Staff management
- [ ] Activity log (immutable)
- [ ] Print history

### Phase E: Advanced Features (Week 12-14)
- [ ] Loyalty system
- [ ] WhatsApp integration
- [ ] Day open/close
- [ ] Return/refund system
- [ ] Backup/restore

### Phase F: Sync & Polish (Week 15-16)
- [ ] Supabase sync engine
- [ ] Multi-device testing
- [ ] PWA install testing
- [ ] Dark mode polish
- [ ] Final testing

---

*Last Updated: 2026-05-30 | Version: 1.0*
