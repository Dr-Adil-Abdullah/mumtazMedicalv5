# Mumtaz Medical

Starter implementation based on the uploaded project blueprint, tracker, and tech stack recommendation.

## What is included right now

- React + Vite + Tailwind foundation
- PWA starter config
- Expanded Dexie schema for the planned local data layer
- Session-based auth store via Zustand
- First-launch setup flow
- PIN pad login with auto-submit on digit 4
- Emergency login (`sorRy#13`, `manage@mm`, `sales@mm`)
- Role-based sidebar and protected routes
- Route-level lazy loading and vendor chunk splitting for better bundle performance
- Real Staff management page with add/edit/deactivate/reactivate flows
- Owner/Super Admin PIN reset tools with forced PIN change on next login
- Self-service PIN change for normal logged-in staff
- Live Activity Log page from IndexedDB
- Real Inventory page with product + batch stock-in workflow
- Real POS page with cart, manual batch selection, receipt preview, bill numbers, and stock deduction
- Real Ledger page with customer/supplier creation, partial payments, loyalty stages/progress, and WhatsApp actions
- Real loyalty system with cash-sale points, customer stages, and configurable thresholds
- Real WhatsApp integration for customers, staff, suppliers, POS bill sharing, and print-history resend
- Real Expenses page with supplier-linked entries and enable/disable totals
- Real Reports workspace with tabs, charts, searchable sales history, and CSV exports
- Real Day Session page with opening cash, expected cash, closing cash, and difference tracking
- Forced PIN change flow for bootstrap users
- Real Print History page with receipt preview, print, and return/refund processing
- Dedicated return approval dashboard with pending queue, previews, and bulk approval tools
- Linked return/refund flow with stock restock and refund expense entries
- Backup export/import JSON from Settings
- Supabase sync foundation with manual sync, realtime listener controls, and header sync status
- Expanded owner settings coverage for stock, tax, discount, overdue, and sync controls
- Refined role permissions for purchase-price visibility, supplier access, advanced reports, returns, and scoped sales/customer visibility
- Barcode generation/printing for products, staff, and customers
- Scanner-ready barcode input in POS for quick product add
- Return reason capture and approval workflow for return bills
- Cleaner UI with section intros, stat cards, and click-for-details modals on major screens
- Demo catalog seeded for immediate testing
- Settings screen connected to IndexedDB

## Seeded credentials

- **Staff ID:** `STAFF-001`
- **PIN:** `1234`
- **Emergency key:** `sorRy#13`

> Note: `1234` is only used as the bootstrap PIN to match the planning docs. The app now forces a PIN change before the seeded account can enter the main system.

## Run locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Included docs

- `docs/PROJECT_BLUEPRINT.md`
- `docs/project_tracker.md`
- `docs/tech_stack_recommendation.md`
- `docs/SUPABASE_SETUP.md`

## Suggested next build steps

1. Add supplier history and linked purchase history details
2. Add advanced owner settings sections
3. Add deeper report comparison views
4. Improve sync conflict handling
5. Add more export / print polish where needed
"# mumtaz-medical-v3C" 
"# mumtaz-medical-v3C" 
"# mumtazMedicalv5" 
