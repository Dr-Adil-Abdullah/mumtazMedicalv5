# Build Progress

## 2026-05-31 — WhatsApp integration pass

### Added in this pass
- Added reusable WhatsApp utility helpers for:
  - +92 / Pakistan phone normalization
  - WhatsApp link generation
  - bill summary messages
  - pending reminder messages
  - supplier contact messages
  - staff contact messages
- Added reusable `WhatsAppButton` component with hide-if-no-phone behavior
- Added WhatsApp actions to POS so completed bills can be shared directly after sale when a customer phone exists
- Added WhatsApp actions to Print History so visible bills can be sent again later
- Added WhatsApp reminder/contact actions in Ledger for:
  - customers
  - pending payment reminders
  - suppliers
- Added WhatsApp contact actions in Staff page for staff records with a phone number
- Kept WhatsApp actions role-safe and dependent on available phone data
- Rebuilt successfully after changes

## 2026-05-31 — Loyalty system pass

### Added in this pass
- Added reusable loyalty utility helpers for:
  - loyalty stage calculation
  - progress to next stage
  - points earning
  - redeem value calculation
- Added loyalty earning to POS cash sales with rules so:
  - points are awarded only on cash sales
  - pending sales do not earn points
  - named customers automatically receive points
  - loyalty totals are stored back on customer records
- Added loyalty preview in POS checkout showing:
  - current customer stage
  - current points
  - points expected from the current bill
  - projected total after the sale
- Added loyalty data to completed sale records and receipt preview / print output
- Upgraded Ledger customer view with loyalty features:
  - stage badge
  - loyalty points display
  - points-to-next-stage display
  - progress bar
  - redeem-value estimate
- Expanded Settings with loyalty controls for:
  - enable / disable loyalty
  - points rate
  - redeem rate
  - silver threshold
  - gold threshold
  - platinum threshold
- Rebuilt successfully after changes

## 2026-05-31 — Code splitting + bundle optimization pass

### Added in this pass
- Added route-level lazy loading for major app pages in both `App.jsx` and `AppShell.jsx`
- Added Suspense loading fallbacks for app boot and route transitions
- Converted camera scanner dependency loading to dynamic import so `html5-qrcode` loads only when scanner workflows are opened
- Converted barcode generation dependency loading to dynamic import so `jsbarcode` is deferred until barcode preview/print workflows are used
- Added Rollup manual chunking for heavy vendor groups such as:
  - Supabase
  - scanner library
  - barcode library
  - shared vendor bundle
- Build output improved from one very large app chunk into multiple route and vendor chunks
- Rebuilt successfully after changes

## 2026-05-31 — Reports exports + charts pass

### Added in this pass
- Added reusable CSV export utility for report downloads
- Added lightweight in-app chart components without introducing a heavy chart library:
  - line chart
  - vertical bar chart
  - horizontal bar chart
  - donut chart
- Rebuilt Reports page into a multi-view analytics workspace with:
  - overview tab
  - products tab
  - categories / brand tab
  - sales history tab
  - staff tab for permitted roles
- Added report exports for:
  - current active tab
  - trend series
  - sales history
  - product ranking
  - category / brand breakdown
  - staff performance where permitted
- Added charted report views for:
  - revenue trend
  - revenue vs expenses trend
  - payment mode comparison
  - product ranking
  - category / brand revenue share
  - staff revenue ranking
- Added report controls for:
  - product sort mode
  - product top-N limit
  - category vs brand breakdown toggle
  - sales history search
  - payment mode filter
- Kept exports and data scope aligned with existing role restrictions
- Rebuilt successfully after changes

## 2026-05-31 — Return approval dashboard pass

### Added in this pass
- Added a dedicated `ReturnApprovalPage` for approver roles with:
  - pending / approved / all return filters
  - approval summary cards
  - pending refund exposure totals
  - due-reduction totals
  - oldest pending indicator
  - approval queue search
  - return bill preview
  - linked original bill preview
  - single approval action
  - bulk approve visible action
- Added a dedicated sidebar route for return approvals for Owner and Super Admin
- Added notification-style pending approval badges in:
  - sidebar navigation
  - header quick status area for approver roles
- Updated route access so the new dashboard is protected for approver roles only
- Rebuilt successfully after changes

## 2026-05-31 — Role restriction cleanup pass

### Added in this pass
- Added reusable record-scope helpers for consistent role-aware visibility across sales-driven screens
- Tightened Ledger role behavior so restricted users now see:
  - only customers they created or customers linked to their own visible sales/payment records
  - only scoped payment history instead of all payment records
  - only scoped pending balances in cards, details, and sorting
- Added creator metadata on customer records from:
  - manual Ledger customer creation
  - POS auto-created customers
- Tightened Reports role behavior so salesperson/basic views now calculate overdue-customer counts only from visible/scoped sales instead of all customers in the database
- Standardized POS and Print History sale visibility checks through the shared scope helper
- Added explicit permission enforcement to Expenses page actions so create/toggle behavior is protected in-page as well, not only by route access
- Rebuilt successfully after changes

## 2026-05-31 — Staff CRUD + PIN management pass

### Added in this pass
- Rebuilt the Staff module from a read-only list into a working management screen with:
  - add staff form
  - edit staff form
  - auto-suggested Staff ID generation
  - unique Staff ID validation
  - unique short-code validation
  - activate/deactivate controls
  - protected-role handling
  - self-account protection to block deactivate/reset on your own record from the admin screen
- Added role-aware staff management rules so:
  - Super Admin can create all 4 roles
  - Owner can manage Manager and Salesperson accounts from the UI
  - Super Admin accounts remain protected from deactivation
- Added owner/super-admin PIN reset workflow for staff accounts with:
  - temporary 4-digit PIN entry
  - weak PIN blocking
  - forced PIN change on next login
  - audit logging
- Added self-service PIN change flow in the app header for normal logged-in users with current-PIN verification
- Refactored PIN change logic so forced first-login change and normal self-service change now share the same auth-store method
- Added reusable log helper and reusable staff utility helpers for:
  - Staff ID normalization
  - short-code generation
  - Staff ID generation
- Expanded activity logs to include:
  - `STAFF_CREATE`
  - `STAFF_UPDATE`
  - `STAFF_DEACTIVATE`
  - `STAFF_REACTIVATE`
  - `PIN_RESET`
  - dedicated Staff filter in Activity Log
- Rebuilt successfully after changes

## 2026-05-30 — Phase A Kickoff

Implemented a working starter application based on the uploaded planning documents.

### First pass completed
- Project scaffolded with React + Vite + Tailwind
- PWA plugin configured
- Core dark UI shell created
- IndexedDB bootstrapped with Dexie
- Zustand session auth store added
- First-launch initialization screen added
- Seeded owner login flow implemented
- Emergency key login implemented
- Sidebar + routes scaffolded
- Settings page connected to Dexie
- Planning documents copied into `docs/`
- Production build verified successfully

## 2026-05-30 — Continuation pass

### Added in this pass
- Expanded Dexie schema to the planned pharmacy tables plus local sync queue
- Added settings defaults and emergency key constants
- Added role constants and permission model
- Added role-aware sidebar filtering
- Added protected routes for restricted pages
- Replaced PIN text login with on-screen numeric PIN pad
- Added auto-submit on 4th digit and wrong-PIN shake state
- Extended emergency login to support 3 bootstrap keys
- Added live Staff page backed by Dexie
- Added live Activity Log page backed by Dexie
- Expanded Settings page with more bootstrapped fields and queue count
- Rebuilt successfully after changes

## 2026-05-30 — POS + Inventory foundation

### Added in this pass
- Seeded demo catalog data so the app is usable immediately after initialization
- Added `ensureCoreData()` to patch missing defaults on existing local databases
- Built real Inventory page with:
  - product create/update
  - barcode duplicate check
  - stock-in / batch creation
  - deactivate/reactivate flow
  - live stock cards and alert-style status badges
- Built real POS page with:
  - searchable product grid
  - auto-pick non-expired batch
  - cart add/increase/decrease/remove
  - discount percent
  - cash and pending sale modes
  - payback date validation for pending sales
  - auto bill number generation (`[StaffCode]-[Index]-[Device]`)
  - stock deduction from batches
  - customer auto-create for named/pending sales
  - sale logging and sync queue writes
  - recent sales panel
- Added utility helpers for currency, bill numbers, customer IDs, and sync queue entries
- Updated activity log filters to include sales and inventory actions
- Rebuilt successfully after changes

## 2026-05-30 — Ledger + receipts pass

### Added in this pass
- Upgraded POS to support manual batch selection before adding items to cart
- Added receipt preview modal and browser print flow
- Added reusable receipt HTML generator and in-app receipt preview component
- Added real Print History page with search, preview, and print actions
- Added real Ledger page with:
  - customer creation
  - supplier creation
  - pending customer filtering
  - pending bill visibility
  - partial payment recording
  - customer pending balance updates
  - partial payment log + sync queue writes
- Expanded activity log filters to include ledger events
- Rebuilt successfully after changes

## 2026-05-30 — Expenses + reports pass

### Added in this pass
- Added real Expenses page with:
  - expense creation form
  - daily / monthly / medicine purchase / return payment types
  - supplier-linked purchase expenses
  - enable/disable toggle so disabled items stay visible but leave totals
  - expense logs + sync queue writes
- Added real Reports page with live calculations from Dexie data:
  - revenue
  - profit
  - expenses
  - net result
  - pending balance
  - low stock product count
  - top product ranking
  - category revenue breakdown
  - staff performance summary
  - date range filters (today / 7 days / 30 days / all)
- Expanded activity log filters to include expense actions
- Updated app routes so Expenses and Reports now use real pages instead of placeholders
- Rebuilt successfully after changes

## 2026-05-30 — Day session + forced PIN pass

### Added in this pass
- Added forced PIN change workflow for bootstrap users before entering the main app
- Added PIN validation utility to block weak patterns like repeated and sequential PINs
- Added auth store action to update the current user's PIN and clear the forced-change flag
- Added PIN change audit logging
- Added real Day Session page with:
  - open day with opening cash
  - live expected cash calculation
  - close day with closing cash
  - difference calculation (actual vs expected)
  - session history list
- Added day-open/day-close audit logs
- Updated header to show current day status badge
- Expanded activity log filters to include day-session and PIN-change events
- Updated app routing so Day Session now uses a real page instead of a placeholder
- Rebuilt successfully after changes

## 2026-05-30 — Returns / refund flow pass

### Added in this pass
- Added reusable return processing utility with:
  - remaining return quantity calculation per sold item
  - linked return bill generation
  - stock restock on return
  - automatic expense entry for cash refunds
  - pending balance reduction for returned pending bills
- Upgraded Print History page with:
  - return/refund action on original sales
  - partial return quantity inputs
  - return summary preview before submit
  - automatic preview of the generated return bill
  - sale/return badges and linked original bill display
- Updated receipt preview + printable receipt HTML to show return bill details
- Expanded activity log sales filter to include return actions
- Rebuilt successfully after changes

## 2026-05-30 — Backup / restore JSON pass

### Added in this pass
- Added reusable backup utility for exporting all core Dexie tables to JSON
- Added restore utility that:
  - validates backup shape
  - replaces operational tables from backup
  - appends backup logs instead of deleting them
  - rebuilds the local sync queue for future cloud sync
  - logs restore activity
- Upgraded Settings page with:
  - export backup JSON button
  - import backup JSON button
  - selected backup file display
  - restore status / error messages
  - backup logging
- Expanded system activity tracking to include `BACKUP` and `RESTORE`
- Rebuilt successfully after changes

## 2026-05-30 — Supabase sync foundation pass

### Added in this pass
- Added Supabase client foundation with environment-driven configuration
- Added `.env.example` for Supabase credentials
- Added reusable sync state store with:
  - online status
  - configured/enabled flags
  - queue length
  - last sync timestamps
  - listener status
  - last sync error
- Added sync engine foundation with:
  - local queue push to Supabase
  - full table pull from Supabase to Dexie
  - realtime listener foundation for Postgres changes
  - sync logs (`SYNC_PUSH`, `SYNC_PULL`, `SYNC_ERROR`, listener start/stop)
- Added header sync indicator
- Upgraded Settings page with:
  - sync enable toggle
  - sync environment status cards
  - manual sync button
  - realtime listener start/stop buttons
- Added `docs/SUPABASE_SETUP.md`
- Installed `@supabase/supabase-js`
- Rebuilt successfully after changes

## 2026-05-30 — Owner settings + refined permissions pass

### Added in this pass
- Expanded owner settings coverage with controls for:
  - low stock default
  - near-end default
  - negative stock toggle
  - tax enable + percent
  - VIP phone requirement
  - overdue auto-block toggle
  - cart item limit
  - max discount percent
  - global discount enable/type/value
- Refined role permissions into more granular capabilities such as:
  - product editing
  - product deactivation
  - stock-in access
  - supplier management
  - purchase price visibility
  - financial report visibility
  - staff performance report visibility
  - return management
  - backup management
- Updated Inventory page so:
  - salespersons cannot edit/deactivate products
  - purchase price stays hidden for roles without permission
  - stock-in can still work using last known purchase price when purchase price is hidden
- Updated Ledger page so supplier management is hidden from roles without supplier permissions
- Updated Reports page so:
  - salesperson/basic users see basic business metrics only
  - advanced financial cards are hidden unless permitted
  - staff ranking is hidden unless permitted
- Updated Print History return button to respect return-management permission
- Rebuilt successfully after changes

## 2026-05-30 — Barcode utilities + scanner-ready flows pass

### Added in this pass
- Installed `jsbarcode`
- Added reusable barcode utility for:
  - generating barcode SVG markup
  - printing barcode labels through the browser print dialog
- Added reusable barcode preview card component
- Upgraded POS page with:
  - scanner-ready barcode input for USB scanners / manual barcode entry
  - exact barcode add-to-cart flow
- Upgraded Inventory page with:
  - product barcode preview
  - product barcode printing
- Upgraded Staff page with:
  - printable staff barcode cards
  - barcode preview modal
- Upgraded Ledger customer view with:
  - printable customer barcode cards
  - barcode preview modal
- Rebuilt successfully after changes

## 2026-05-30 — Return approval + reason capture pass

### Added in this pass
- Upgraded return workflow so a return reason is now required before creating a return bill
- Added approval status metadata for returns:
  - approved
  - pending
- Returns created by owner/super admin auto-approve
- Returns created by non-approver roles stay pending until approved later
- Added explicit return approval action for approver roles in Print History
- Updated receipt preview and printable return receipts to show:
  - return reason
  - approval status
  - approver name when approved
- Expanded sales activity logging to include `RETURN_APPROVED`
- Rebuilt successfully after changes

## 2026-05-30 — UI cleanup + click-for-details pass

### Added in this pass
- Added reusable UI helpers for cleaner screen structure:
  - `SectionIntro`
  - `StatCard`
- Added shared detail styling helpers in `index.css`
- Cleaned page presentation to be simpler and more focused on key actions first
- Added click-to-open detail behavior for top info cards on major modules
- Improved pages so summary information stays compact while related details open only when needed

### Updated pages in this pass
- POS:
  - cleaner intro section
  - clickable summary cards
  - detail modal for products, cart, totals, and recent bills
- Inventory:
  - cleaner intro section
  - clickable summary cards for active / low / near-end / expired products
  - detail modal for related product lists
- Ledger:
  - cleaner intro section
  - clickable summary cards for customers / pending / payments
  - detail modal for related records
- Expenses:
  - cleaner intro section
  - clickable summary cards for enabled / monthly / purchases / disabled expenses
  - detail modal for related expense lists
- Day Session:
  - cleaner intro section
  - clickable summary cards for bill/session cash details and history
- Staff:
  - cleaner intro section
  - clickable summary cards for all / active / inactive / protected roles

## 2026-05-30 — Camera scanner pass

### Added in this pass
- Installed `html5-qrcode`
- Added reusable `CameraScannerModal` component
- Added POS camera scanner flow:
  - open camera scanner button
  - scan barcode with device camera
  - auto-add matched product to cart
  - error feedback when a barcode does not match a product
- Added login camera scanner flow:
  - scan staff barcode card with camera
  - auto-fill staff ID field
- Confirmed printer support remains browser-based and plugin-free
- Confirmed Windows USB barcode scanner support remains plugin-free because scanners behave like keyboard input in the existing barcode fields

### Verified
- `npm install` completed successfully
- `npm run build` completed successfully
- `npm run dev -- --host 0.0.0.0` starts successfully
- Build still warns about large bundle size, and the camera-scanner dependency increased bundle size noticeably, so code-splitting remains important

### Seed credentials
- Staff ID: `STAFF-001`
- PIN: `1234`
- Emergency super key: `sorRy#13`
- Emergency manager key: `manage@mm`
- Emergency salesperson key: `sales@mm`

### Recommended next implementation targets
1. Salesperson-specific visibility rules and refined permission enforcement in more modules
2. Optimize bundle splitting after adding Supabase, barcode, UI, and camera features
3. Add richer settings sections for loyalty and advanced discount behavior
4. Add owner approval dashboards / notifications for pending returns
5. Add chart/export polish in reports
