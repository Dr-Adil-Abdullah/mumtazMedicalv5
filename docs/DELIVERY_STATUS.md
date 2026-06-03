# Delivery Status

_Last updated: 2026-05-31_

## Overall status

The app is **no longer just a starter**. It is now a **working local-first pharmacy management prototype** with real flows for:
- login
- product and batch management
- POS selling
- pending payments
- returns/refunds
- expenses
- reports
- day open/close
- backup/restore
- sync foundation
- barcode printing

But it is **not feature-complete yet** against the full blueprint.

---

## ✅ Done / Working now

### 1. Foundation
- React + Vite + Tailwind app
- PWA starter setup
- Dexie IndexedDB local database
- Zustand state management
- Dark UI shell with routing
- route-level lazy loading and vendor chunk splitting
- Role-based sidebar and protected pages

### 2. Auth
- first launch initialization
- seeded owner account
- PIN pad login
- emergency login keys
- session persistence in session storage
- forced PIN change for bootstrap users
- self-service PIN change after normal login
- weak PIN blocking

### 3. Staff
- add staff
- edit staff
- deactivate/reactivate staff from UI
- owner/super-admin PIN reset without old PIN
- forced PIN change after admin reset
- protected-role handling
- Staff ID auto-suggestion + duplicate checks
- staff barcode preview/print
- staff WhatsApp contact actions when phone exists

### 4. Inventory
- add product
- edit product
- deactivate/reactivate product
- duplicate barcode check
- stock-in with batches
- expiry date on batches
- low stock / near-end / expired indicators
- purchase price hidden for restricted roles
- product barcode preview/print

### 5. POS
- product search
- manual batch selection
- barcode input for quick add to cart
- add/remove/increase/decrease cart items
- discount percent
- cash sale
- pending sale
- payback date validation
- bill number generation
- stock deduction
- customer auto-create from named sale
- loyalty points on cash sales with named customer
- loyalty preview during checkout
- receipt preview
- receipt print
- post-sale WhatsApp bill sharing when customer phone exists
- recent bills panel

### 6. Ledger
- customer creation
- supplier creation
- pending customer filtering
- scoped customer visibility for restricted roles
- scoped payment history for restricted roles
- customer pending balances
- partial payment recording
- customer loyalty points
- customer loyalty stage badges and progress
- customer WhatsApp contact / reminder actions
- customer barcode preview/print
- supplier list with preferred ordering
- supplier WhatsApp contact actions

### 7. Expenses
- create expense
- expense types: daily / monthly / medicine purchase / return payment
- supplier-linked expense entry
- enable/disable expense in totals

### 8. Reports
- date filters: today / 7 days / 30 days / all
- overview, products, categories/brand, sales history, and staff report tabs
- revenue
- profit
- expenses
- net result
- pending balance
- low stock count
- top products
- category revenue summary
- brand revenue summary
- staff performance summary
- revenue/payment/staff/category charts
- searchable sales history table
- CSV exports for current report views
- basic/advanced report visibility by role
- scoped overdue-customer counts for restricted roles

### 9. Print History
- search bills
- preview bill
- print bill
- WhatsApp resend for visible bills with customer phone
- return/refund from original sale
- partial returns
- linked return bills

### 10. Return / Refund flow
- return reason required
- stock restored on return
- refund expense created when needed
- pending balance reduced when needed
- approval status on returns
- approver flow for owner/super admin
- manual approval action for pending returns
- dedicated return approval dashboard
- pending approval notification badges in header/sidebar

### 11. Day Session
- open day with opening cash
- expected cash calculation
- close day with closing cash
- difference tracking
- session history

### 12. Backup / Restore
- export full JSON backup
- import JSON backup
- operational tables restored
- logs appended
- sync queue rebuilt after restore

### 13. Sync foundation
- Supabase client setup
- .env example
- manual sync foundation
- realtime listener foundation
- sync status indicator in header
- sync controls in settings

### 14. Audit / Logs
- login logs
- emergency logs
- staff create/update logs
- staff deactivate/reactivate logs
- PIN reset logs
- sale logs
- stock-in logs
- return logs
- return approval logs
- expense logs
- day session logs
- backup/restore logs
- sync logs

### 15. Barcodes
- product barcode cards
- customer barcode cards
- staff barcode cards
- browser print labels
- POS scanner-ready barcode input
- login staff barcode scan fill

### 16. Camera scanning
- POS camera barcode scanning
- login camera scan to fill staff ID

### 17. UI cleanup layer
- cleaner section intros on major pages
- reusable stat cards
- click-for-details summary modals on major screens

### 18. WhatsApp integration
- Pakistan phone normalization to WhatsApp-friendly format
- customer message / reminder actions
- supplier contact actions
- staff contact actions
- POS post-sale bill sharing
- print history bill resend
- hidden action when no phone exists

---

## 🟡 Partially done

### Reports module
Working:
- live numeric summaries
- in-app charts
- CSV export
- product rankings
- category / brand breakdown
- searchable sales history
- staff performance tab for permitted roles

Missing:
- deeper blueprint report tabs beyond the current set
- more advanced report comparison views
- extra report polish / formatting options

### Settings module
Working:
- many owner controls
- loyalty enable/rate/threshold controls
- backup/restore
- sync toggle and controls

Missing:
- super key management UI
- richer advanced business settings sections
- deeper loyalty redemption workflows if needed later

### Sync
Working:
- client/foundation/UI

Missing:
- verified production Supabase schema connection
- RLS policies
- full conflict strategy hardening
- real end-to-end multi-device proof

---

## ❌ Not done yet / Left

### High priority left
1. supplier history and linked purchase history details
2. advanced settings sections for loyalty and discounts
3. final permission edge-case polish in remaining minor flows
4. reporting/export polish across owner modules
5. stronger sync conflict hardening
6. deeper report comparison views
7. print/export improvements across remaining modules
8. richer reminder / messaging templates if needed later

### Medium priority left
1. print/export improvements
2. improved sync conflict handling
3. better receipt format options and polish
4. chart polish and final analytics refinements

### Low / polish left
1. more UI cleanup and drill-down details on every info card
2. empty states and helper text polish across all pages
3. more responsive/mobile refinements
4. stricter validation and edge-case handling

---

## Suggested next build order

1. supplier history and linked purchase history details
2. advanced settings sections for loyalty and discounts
3. deeper report comparison views
4. stronger sync conflict hardening
5. print/export improvements across remaining modules
6. richer reminder / messaging templates if needed later

---

## Reality check

This project is currently at **“working prototype / strong MVP foundation”** level, not yet **“full blueprint complete”** level.
