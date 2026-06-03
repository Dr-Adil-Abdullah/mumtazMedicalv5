# 🏥 MUMTAZ MEDICAL — PROJECT TRACKER
## ================================

> **Created:** 2026-05-30  
> **Status:** ✅ PLANNING COMPLETE — Ready for Development  
> **Current Phase:** Blueprint Review → Then Start Phase A

---

## 📌 VERSION LOG

| Version | Date       | Change Summary |
|---------|------------|---------------|
| v0.1    | 2026-05-30 | Project initialized |
| v0.2    | 2026-05-30 | Full PRD received & indexed — 293+ features, 63 rules, 9 tables |
| v0.3    | 2026-05-30 | Section 1 Q&A started — awaiting answers |
| v0.4    | 2026-05-30 | Section 1 COMPLETED — 5 key decisions documented |
| v0.5    | 2026-05-30 | Section 2 Q&A started — Auth & Login |
| v0.6    | 2026-05-30 | Section 2 COMPLETED — Auth & Login clarified |
| v0.7    | 2026-05-30 | Section 3 Q&A started — Super Admin + POS/Sales |
| v0.8    | 2026-05-30 | Section 3 COMPLETED — POS/Sales discount & cart rules |
| v0.9    | 2026-05-30 | Section 4 Q&A started — Inventory & Receipt |
| v1.0    | 2026-05-30 | ALL 30 questions answered — Discovery COMPLETE |
| v1.1    | 2026-05-30 | Tech Stack Recommended (React+Vite+Supabase) |
| v1.2    | 2026-05-30 | Complete Project Blueprint written (docs/PROJECT_BLUEPRINT.md) |
| v1.3    | 2026-05-31 | Staff CRUD + PIN management pass completed and status docs refreshed |
| v1.4    | 2026-05-31 | Role restriction cleanup pass completed for Ledger, Reports, POS, Print History, and Expenses |
| v1.5    | 2026-05-31 | Return approval dashboard + notification pass completed |
| v1.6    | 2026-05-31 | Reports exports + charts pass completed |
| v1.7    | 2026-05-31 | Code splitting + bundle optimization pass completed |
| v1.8    | 2026-05-31 | Loyalty system pass completed |
| v1.9    | 2026-05-31 | WhatsApp integration pass completed across customers, staff, suppliers, POS, and print history |

---

## 📂 SECTION PROGRESS

| # | Section                        | Status        | Last Updated  |
|---|-------------------------------|---------------|---------------|
| 1 | Core Business & Workflow       | ✅ Complete    | 2026-05-30   |
| 2 | Auth & Login (F001-F020)       | ✅ Complete    | 2026-05-30   |
| 3 | Super Admin System (F021-F029) | ✅ Complete    | 2026-05-30   |
| 4 | POS / Sales (F030-F068)        | ✅ Complete    | 2026-05-30   |
| 5 | Receipt (F069-F087)            | ✅ Complete    | 2026-05-30   |
| 6 | Inventory (F088-F116)          | ✅ Complete    | 2026-05-30   |
| 7 | Ledger / Customers & Suppliers (F117-F136) | ✅ Complete | 2026-05-30 |
| 8 | Expenses (F137-F145)           | ✅ Complete    | 2026-05-30   |
| 9 | Reports (F146-F180)            | ✅ PRD Sufficient | 2026-05-30 |
|10 | Staff (F181-F193)              | ✅ PRD Sufficient | 2026-05-30  |
|11 | Activity Log (F194-F206)       | ✅ PRD Sufficient | 2026-05-30  |
|12 | Print History (F207-F213)      | ✅ PRD Sufficient | 2026-05-30  |
|13 | Settings (F214-F233)           | ✅ PRD + 7 new settings | 2026-05-30 |
|14 | Loyalty System (F234-F243)     | ✅ PRD Sufficient | 2026-05-30  |
|15 | WhatsApp Integration (F244-F253) | ✅ PRD Sufficient | 2026-05-30 |
|16 | Sync & Offline (F254-F263)     | ✅ PRD Sufficient | 2026-05-30  |
|17 | PWA & Mobile (F264-F278)       | ✅ PRD Sufficient | 2026-05-30  |
|18 | UI / Design (F279-F293)        | ✅ PRD Sufficient | 2026-05-30  |
|19 | Tech Stack & Architecture      | ✅ COMPLETE   | 2026-05-30   |

---

## 🔖 FEATURE INDEX — 293+ Features (17 Modules)

### Module 1: 🔐 AUTH & LOGIN (F001–F020) — 20 Features
| ID   | Feature                    | Priority | Status    | Rule Ref |
|------|---------------------------|----------|-----------|----------|
| F001 | Premium Login Screen       | High     | ⏳ Planned | -        |
| F002 | Staff ID Input (Barcode)   | High     | ⏳ Planned | -        |
| F003 | 4-digit PIN Pad            | High     | ⏳ Planned | -        |
| F004 | PIN Dots Animation         | Medium   | ⏳ Planned | -        |
| F005 | Auto-submit on 4th digit   | High     | ⏳ Planned | -        |
| F006 | Wrong PIN Shake Animation  | Medium   | ⏳ Planned | -        |
| F007 | Emergency Login Button     | High     | ⏳ Planned | R47      |
| F008 | Emergency Step 1 (Name)    | High     | ⏳ Planned | R47      |
| F009 | Emergency Step 2 (Master PW)| High    | ⏳ Planned | R47      |
| F010 | 3 Master Passwords → Roles | High     | ⏳ Planned | R47      |
| F011 | Emergency Login Logged     | Critical | ⏳ Planned | R8       |
| F012 | Failed Emergency Logged    | Critical | ⏳ Planned | R8       |
| F013 | Session Memory (Refresh)   | High     | ⏳ Planned | -        |
| F014 | Session Clear (Browser Close)| Medium  | ⏳ Planned | -        |
| F015 | Deactivated Account Block  | Critical | ⏳ Planned | R9       |
| F016 | First Launch Auto-Seed     | High     | ⏳ Planned | -        |
| F017 | First Launch Welcome Banner| Medium   | ⏳ Planned | -        |
| F018 | Barcode Scanner Support    | High     | ⏳ Planned | -        |
| F019 | Role Detected on Login     | High     | ⏳ Planned | -        |
| F020 | Full Sidebar by Role       | High     | ⏳ Planned | R37-R48  |

### Module 2: ⚡ SUPER ADMIN (F021–F029) — 9 Features
| ID   | Feature                        | Priority | Status    | Rule Ref |
|------|-------------------------------|----------|-----------|----------|
| F021 | Super Admin Role (above Owner) | Critical | ⏳ Planned | R5,R10   |
| F022 | Purple ⚡ Badge                | Low      | ⏳ Planned | -        |
| F023 | Cannot be deactivated by anyone| Critical | ⏳ Planned | R10      |
| F024 | Can deactivate anyone incl Owner| Critical| ⏳ Planned | R37      |
| F025 | Can add Owner role             | Critical | ⏳ Planned | R37      |
| F026 | Reset any PIN without old PIN  | High     | ⏳ Planned | R38      |
| F027 | Access: Settings, Staff, Logs  | High     | ⏳ Planned | R39      |
| F028 | Full Sidebar in Emergency      | High     | ⏳ Planned | -        |
| F029 | "Protected" label immunity     | Medium   | ⏳ Planned | -        |

### Module 3: 🛒 POS / SALES (F030–F068) — 39 Features
| ID   | Feature                       | Priority | Status    | Rule Ref |
|------|-------------------------------|----------|-----------|----------|
| F030 | Split Panel (Products + Cart) | High     | ⏳ Planned | -        |
| F031 | Mobile Tabs (Products ↔ Cart) | High     | ⏳ Planned | R57      |
| F032 | Product Search (name/barcode/brand)| High | ⏳ Planned | -        |
| F033 | USB Barcode Scanner            | High     | ⏳ Planned | -        |
| F034 | Mobile Camera Scanner          | High     | ⏳ Planned | -        |
| F035 | Out of Stock Block (greyed out)| Critical | ⏳ Planned | R7       |
| F036 | Expired Product Block          | Critical | ⏳ Planned | R6       |
| F037 | Cart Controls (− / + / Remove) | High    | ⏳ Planned | -        |
| F038 | Unit Display in Cart           | Medium   | ⏳ Planned | -        |
| F039 | Optional Customer (walk-in)    | High     | ⏳ Planned | -        |
| F040 | Customer Barcode Scan          | Medium   | ⏳ Planned | -        |
| F041 | Customer Search (name/ID)      | High     | ⏳ Planned | -        |
| F042 | VIP ★ & DOCTOR Badges          | High     | ⏳ Planned | R53,R54  |
| F043 | Pending Balance Warning        | High     | ⏳ Planned | R28      |
| F044 | Flat % Discount                | High     | ⏳ Planned | R22      |
| F045 | Margin % Discount              | High     | ⏳ Planned | R3,R23   |
| F046 | Discount without Customer      | High     | ⏳ Planned | R26      |
| F047 | Global Auto-Discount           | Medium   | ⏳ Planned | R24,R25  |
| F048 | Manual Override Discount       | Medium   | ⏳ Planned | R24,R25  |
| F049 | Auto-discount Banner           | Low      | ⏳ Planned | -        |
| F050 | Dual Prices per Item (~~old~~ + new)| High | ⏳ Planned | R52   |
| F051 | Line Total with Dual Prices    | High     | ⏳ Planned | R52      |
| F052 | Amount Received Input          | High     | ⏳ Planned | -        |
| F053 | 🟢 Return Amount (green)       | High     | ⏳ Planned | R51      |
| F054 | 🔴 Balance Owed (red)          | High     | ⏳ Planned | R51      |
| F055 | ✅ Exact Amount Match           | High     | ⏳ Planned | -        |
| F056 | Cash Payment                   | High     | ⏳ Planned | -        |
| F057 | Pending Payment (Credit)       | High     | ⏳ Planned | R4,R27,R28,R29 |
| F058 | Credit Note Payment            | Medium   | ⏳ Planned | -        |
| F059 | Minimum Pending Amount         | High     | ⏳ Planned | R28      |
| F060 | Payback Date Mandatory         | Critical | ⏳ Planned | R4,R29   |
| F061 | Bill Number Format (MM-0001-A3F)| High    | ⏳ Planned | R12,R18  |
| F062 | Stock Deduction on Sale        | Critical | ⏳ Planned | -        |
| F063 | Customer Pending Auto-Update   | High     | ⏳ Planned | -        |
| F064 | Loyalty Points (Cash Only)     | High     | ⏳ Planned | R16,R17,R31 |
| F065 | Sale Logged                    | Critical | ⏳ Planned | R13      |
| F066 | Success Banner                 | Low      | ⏳ Planned | -        |
| F067 | WhatsApp Send Bill             | Medium   | ⏳ Planned | R55      |
| F068 | Reprint Button                 | Medium   | ⏳ Planned | -        |

### Module 4: 🧾 RECEIPT (F069–F087) — 19 Features
| ID   | Feature                          | Priority | Status    | Rule Ref |
|------|----------------------------------|----------|-----------|----------|
| F069 | Shop Name, Address, Phone        | High     | ⏳ Planned | -        |
| F070 | Date, Time, Bill #, Cashier      | High     | ⏳ Planned | -        |
| F071 | Customer Name                    | High     | ⏳ Planned | -        |
| F072 | "★ VIP CUSTOMER" Badge           | Medium   | ⏳ Planned | R53      |
| F073 | "[DOCTOR]" Badge                 | Medium   | ⏳ Planned | R54      |
| F074 | Item Lines (Name, Qty, Price)    | High     | ⏳ Planned | -        |
| F075 | ~~Original Price~~ Strikethrough | High     | ⏳ Planned | R52      |
| F076 | Discounted Price in Green        | High     | ⏳ Planned | R51      |
| F077 | Flat Discount: Show %            | High     | ⏳ Planned | R22      |
| F078 | Margin Discount: Amount Only, No %| High    | ⏳ Planned | R3,R23   |
| F079 | Subtotal, Discount, Total        | High     | ⏳ Planned | -        |
| F080 | Amount Received + Return         | High     | ⏳ Planned | -        |
| F081 | Balance Owed                     | High     | ⏳ Planned | -        |
| F082 | "⚠ PENDING BILL ⚠" Header       | High     | ⏳ Planned | -        |
| F083 | Payment Due Date                 | High     | ⏳ Planned | R4,R29   |
| F084 | "CREDIT NOTE" Label              | Medium   | ⏳ Planned | -        |
| F085 | Thank You / "Please Pay" Message | Low      | ⏳ Planned | -        |
| F086 | Rs. 100/- Currency Format        | High     | ⏳ Planned | R36      |
| F087 | Offline Printing Support         | High     | ⏳ Planned | -        |

### Module 5: 📦 INVENTORY (F088–F116) — 29 Features
| ID   | Feature                        | Priority | Status    | Rule Ref |
|------|-------------------------------|----------|-----------|----------|
| F088 | Search (name/barcode/brand)   | High     | ⏳ Planned | -        |
| F089 | Category Filter               | High     | ⏳ Planned | -        |
| F090 | Product Add (12 fields)       | High     | ⏳ Planned | -        |
| F091 | Unit Field (20ml, 100mg…)     | Medium   | ⏳ Planned | -        |
| F092 | Image Upload (base64, 2MB)    | Medium   | ⏳ Planned | -        |
| F093 | Duplicate Barcode Check       | High     | ⏳ Planned | -        |
| F094 | Edit Product (Owner only)     | High     | ⏳ Planned | R40      |
| F095 | Delete Product (Owner only)   | High     | ⏳ Planned | R40      |
| F096 | Stock-In (all roles)          | High     | ⏳ Planned | R43      |
| F097 | Stock-In Details (qty+price+batch+expiry)| High | ⏳ Planned | -   |
| F098 | Barcode Print (Code 128)      | Medium   | ⏳ Planned | -        |
| F099 | Expiry Warning 🟡 (7 months)  | High     | ⏳ Planned | R34      |
| F100 | Expiry Critical 🔴 (3 months) | High     | ⏳ Planned | R34      |
| F101 | Expiry Expired ⛔              | Critical | ⏳ Planned | R34      |
| F102 | Low Stock Alert ⚠️             | High     | ⏳ Planned | R35      |
| F103 | Near End Alert 🔴              | High     | ⏳ Planned | R35      |
| F104 | Two Custom Thresholds per Product | High  | ⏳ Planned | R35      |
| F105 | Smart Alert Panel (Collapsible)| Medium   | ⏳ Planned | -        |
| F106 | Purchase List Accordion        | Medium   | ⏳ Planned | -        |
| F107 | Low Stock Accordion            | Medium   | ⏳ Planned | -        |
| F108 | Near End Accordion             | Medium   | ⏳ Planned | -        |
| F109 | Expiry Accordion               | Medium   | ⏳ Planned | -        |
| F110 | Auto-Open if Alerts Present    | Medium   | ⏳ Planned | -        |
| F111 | Purchase Wish List             | High     | ⏳ Planned | -        |
| F112 | Wish List Fields (name,qty,unit,note)| High | ⏳ Planned | -       |
| F113 | Mark Done ✓                    | Medium   | ⏳ Planned | -        |
| F114 | Undo ↺                         | Medium   | ⏳ Planned | -        |
| F115 | Delete 🗑️                      | Medium   | ⏳ Planned | -        |
| F116 | Hide Purchase Price from Salesperson | Critical | ⏳ Planned | R2 |

### Module 6: 📖 LEDGER (F117–F136) — 20 Features
| ID   | Feature                        | Priority | Status    | Rule Ref |
|------|-------------------------------|----------|-----------|----------|
| F117 | Customers + Suppliers on 1 Page| High    | ⏳ Planned | -        |
| F118 | Customer Tabs (All/Pending/VIP&Doc)| High | ⏳ Planned | -       |
| F119 | Customer Types (Regular/VIP/Doctor)| High | ⏳ Planned | -       |
| F120 | VIP Phone Required (configurable)| High  | ⏳ Planned | R30      |
| F121 | Auto Customer ID (CID-XXXX)   | High     | ⏳ Planned | -        |
| F122 | Barcode Card Print            | Medium   | ⏳ Planned | -        |
| F123 | Loyalty Points in List        | Medium   | ⏳ Planned | -        |
| F124 | Stage Badge (🥉⭐🥇💎)         | Medium   | ⏳ Planned | -        |
| F125 | Customer Detail + Purchase History| High | ⏳ Planned | -       |
| F126 | Loyalty Stage + "X pts to next"| Medium  | ⏳ Planned | -        |
| F127 | Mark Paid → Sync              | High     | ⏳ Planned | -        |
| F128 | Overdue Banner (Red)          | High     | ⏳ Planned | -        |
| F129 | WhatsApp Reminder (if phone)  | Medium   | ⏳ Planned | R55      |
| F130 | Pre-written Urdu Message      | Medium   | ⏳ Planned | R56      |
| F131 | Supplier Types (Preferred ⭐/Normal)| High | ⏳ Planned | -      |
| F132 | Preferred Suppliers First     | High     | ⏳ Planned | R33      |
| F133 | Supplier Fields (name,phone,email,address,notes)| High | ⏳ Planned | - |
| F134 | Supplier WhatsApp             | Medium   | ⏳ Planned | R55      |
| F135 | Supplier History Button 🕐    | Medium   | ⏳ Planned | -        |
| F136 | Supplier-Linked Expenses      | High     | ⏳ Planned | -        |

### Module 7: 💰 EXPENSES (F137–F145) — 9 Features
| ID   | Feature                        | Priority | Status    | Rule Ref |
|------|-------------------------------|----------|-----------|----------|
| F137 | Expense Types (purchase/monthly/daily)| High | ⏳ Planned | -      |
| F138 | Enable/Disable Toggle          | Medium   | ⏳ Planned | R32      |
| F139 | Disabled: Visible but Not in Total| Medium | ⏳ Planned | R32   |
| F140 | Supplier Dropdown (Medicine Purchase)| High | ⏳ Planned | -    |
| F141 | Preferred Suppliers First      | Medium   | ⏳ Planned | R33      |
| F142 | Edit Expense (Owner only)      | High     | ⏳ Planned | R40      |
| F143 | Delete Expense (Owner only)    | High     | ⏳ Planned | R40      |
| F144 | Supplier ID Saved              | High     | ⏳ Planned | -        |
| F145 | Auto-Reload on Sync            | Medium   | ⏳ Planned | -        |

### Module 8: 📊 REPORTS (F146–F180) — 35 Features / 6 Tabs
| ID   | Feature                        | Priority | Status    | Rule Ref |
|------|-------------------------------|----------|-----------|----------|
| F146 | Dashboard: Today's Overview    | High     | ⏳ Planned | -        |
| F147 | Sales Count, Revenue, Profit   | High     | ⏳ Planned | R19,R20,R21 |
| F148 | Pending Count + Total          | High     | ⏳ Planned | -        |
| F149 | 🔴 Overdue Pending             | High     | ⏳ Planned | -        |
| F150 | Low Stock + Expiry Counts      | Medium   | ⏳ Planned | -        |
| F151 | 7-Day Area Chart               | Medium   | ⏳ Planned | -        |
| F152 | Top 5 Products (30 days)       | Medium   | ⏳ Planned | -        |
| F153 | Best Products: Rank 1-100      | High     | ⏳ Planned | -        |
| F154 | Sort: Units / Revenue / Profit | High     | ⏳ Planned | -        |
| F155 | Filter: Brand, Category        | High     | ⏳ Planned | -        |
| F156 | Show: 20/50/100                | Medium   | ⏳ Planned | -        |
| F157 | Bar Chart Top 10               | Medium   | ⏳ Planned | -        |
| F158 | 🥇🥈🥉 Medals                   | Low      | ⏳ Planned | -        |
| F159 | CSV Export                     | High     | ⏳ Planned | -        |
| F160 | Brand/Category Breakdown       | High     | ⏳ Planned | -        |
| F161 | By Brand / By Category Toggle  | High     | ⏳ Planned | -        |
| F162 | Donut + Progress + Horizontal Bar| Medium | ⏳ Planned | -       |
| F163 | Revenue Share %                | Medium   | ⏳ Planned | -        |
| F164 | Sales History Table            | High     | ⏳ Planned | -        |
| F165 | Search: Bill#, Customer, Cashier| High    | ⏳ Planned | -        |
| F166 | Date Filter                    | High     | ⏳ Planned | -        |
| F167 | Payment Mode Filter            | Medium   | ⏳ Planned | -        |
| F168 | VIP/Doctor Badges in Table     | Low      | ⏳ Planned | -        |
| F169 | CSV Export (Sales History)     | High     | ⏳ Planned | -        |
| F170 | P&L Report (Owner/Manager)     | High     | ⏳ Planned | R44       |
| F171 | P&L Period: Today/Week/Month/Custom| High | ⏳ Planned | -      |
| F172 | Revenue, Expenses, Net Profit Cards| High | ⏳ Planned | R19   |
| F173 | Bar Chart: Revenue vs Expenses | Medium   | ⏳ Planned | -        |
| F174 | Expense Pie + List             | Medium   | ⏳ Planned | -        |
| F175 | Discount Summary               | Medium   | ⏳ Planned | -        |
| F176 | Staff Performance (Owner/SuperAdmin)| High | ⏳ Planned | R44    |
| F177 | 🥇🥈🥉 Staff Ranking            | Medium   | ⏳ Planned | -        |
| F178 | Staff: Sales, Items, Revenue, Profit| High | ⏳ Planned | R2,R19|
| F179 | Same Date Range Comparison     | Medium   | ⏳ Planned | -        |
| F180 | Date Range Bar                 | Medium   | ⏳ Planned | -        |

### Module 9: 👔 STAFF (F181–F193) — 13 Features
| ID   | Feature                        | Priority | Status    | Rule Ref |
|------|-------------------------------|----------|-----------|----------|
| F181 | Add Staff (name,role,phone,PIN×2,ID)| High | ⏳ Planned | -     |
| F182 | Auto Staff ID                  | High     | ⏳ Planned | -        |
| F183 | Unique ID Check               | High     | ⏳ Planned | -        |
| F184 | All 4 Roles                   | High     | ⏳ Planned | -        |
| F185 | Barcode Staff ID Card Print   | Medium   | ⏳ Planned | -        |
| F186 | Self PIN Change (verify old)  | High     | ⏳ Planned | -        |
| F187 | Owner PIN Change (no old needed)| High   | ⏳ Planned | R38      |
| F188 | Super Admin: Change Any PIN   | Critical | ⏳ Planned | R38      |
| F189 | Default PIN Warning           | Medium   | ⏳ Planned | -        |
| F190 | Deactivate (not self)         | High     | ⏳ Planned | R9       |
| F191 | Super Admin Deactivates All   | Critical | ⏳ Planned | R10,R37  |
| F192 | "You" Badge                   | Low      | ⏳ Planned | -        |
| F193 | Purple ⚡ Badge (Super Admin)  | Low      | ⏳ Planned | -        |

### Module 10: 📋 ACTIVITY LOG (F194–F206) — 13 Features
| ID   | Feature                        | Priority | Status    | Rule Ref |
|------|-------------------------------|----------|-----------|----------|
| F194 | IMMUTABLE Records              | Critical | ⏳ Planned | R1       |
| F195 | No Delete Button Exists        | Critical | ⏳ Planned | R1,R46   |
| F196 | 9 Action Types Logged          | High     | ⏳ Planned | -        |
| F197 | Emergency Login Logged         | Critical | ⏳ Planned | R8,R47   |
| F198 | Failed Emergency Also Logged   | Critical | ⏳ Planned | R8       |
| F199 | 4 Tabs: All/Login/Sales/Edits  | High     | ⏳ Planned | -        |
| F200 | Tab Counts                     | Medium   | ⏳ Planned | -        |
| F201 | Filters (All tab)              | High     | ⏳ Planned | -        |
| F202 | CSV Export per Tab             | High     | ⏳ Planned | -        |
| F203 | ⚠️ Emergency Badge             | Medium   | ⏳ Planned | -        |
| F204 | 200 Rows Limit                 | Medium   | ⏳ Planned | -        |
| F205 | Included in Backup             | High     | ⏳ Planned | R14      |
| F206 | Appended on Restore            | High     | ⏳ Planned | -        |

### Module 11: 🖨️ PRINT HISTORY (F207–F213) — 7 Features
| ID   | Feature                        | Priority | Status    | Rule Ref |
|------|-------------------------------|----------|-----------|----------|
| F207 | All Past Bills                 | High     | ⏳ Planned | -        |
| F208 | Search                         | High     | ⏳ Planned | -        |
| F209 | Date Filter                    | High     | ⏳ Planned | -        |
| F210 | Stats Cards                    | Medium   | ⏳ Planned | -        |
| F211 | Payment Mode Badge             | Medium   | ⏳ Planned | -        |
| F212 | 🖨️ Reprint Any Bill            | High     | ⏳ Planned | -        |
| F213 | 💚 WhatsApp Send               | Medium   | ⏳ Planned | R55      |

### Module 12: ⚙️ SETTINGS (F214–F233) — 20 Features
| ID   | Feature                        | Priority | Status    | Rule Ref |
|------|-------------------------------|----------|-----------|----------|
| F214 | Shop Info (name/address/phone) | High     | ⏳ Planned | -        |
| F215 | Logo Upload                    | Medium   | ⏳ Planned | -        |
| F216 | Expense Toggles                | Medium   | ⏳ Planned | R32      |
| F217 | Low Stock Default              | High     | ⏳ Planned | -        |
| F218 | Near-End Default               | High     | ⏳ Planned | -        |
| F219 | Pending Minimum Amount         | High     | ⏳ Planned | R28      |
| F220 | VIP Phone Toggle               | High     | ⏳ Planned | R30      |
| F221 | Loyalty Enable/Disable         | High     | ⏳ Planned | R31      |
| F222 | Points Rate                    | High     | ⏳ Planned | -        |
| F223 | Redeem Rate                    | High     | ⏳ Planned | -        |
| F224 | Stage Thresholds               | High     | ⏳ Planned | -        |
| F225 | Global Discount Toggle         | Medium   | ⏳ Planned | R24      |
| F226 | Global Discount Type           | Medium   | ⏳ Planned | R24      |
| F227 | Global Discount %              | Medium   | ⏳ Planned | R24      |
| F228 | Backup JSON Export             | Critical | ⏳ Planned | R14      |
| F229 | Backup Import/Restore          | Critical | ⏳ Planned | -        |
| F230 | Restore → All Devices Sync     | Critical | ⏳ Planned | R15      |
| F231 | Settings Sync                  | High     | ⏳ Planned | -        |
| F232 | Owner Only Access              | High     | ⏳ Planned | R41      |
| F233 | Super Admin Also Access        | High     | ⏳ Planned | R39      |

### Module 13: 🎁 LOYALTY (F234–F243) — 10 Features
| ID   | Feature                        | Priority | Status    | Rule Ref |
|------|-------------------------------|----------|-----------|----------|
| F234 | 4 Loyalty Stages               | High     | ⏳ Planned | -        |
| F235 | 🥉 Bronze = 0 pts              | High     | ⏳ Planned | -        |
| F236 | ⭐ Silver = 100 pts             | High     | ⏳ Planned | -        |
| F237 | 🥇 Gold = 500 pts              | High     | ⏳ Planned | -        |
| F238 | 💎 Platinum = 2000 pts          | High     | ⏳ Planned | -        |
| F239 | Customer Card: Stage + Progress | High    | ⏳ Planned | -        |
| F240 | Customer List: Stage Icon       | Medium   | ⏳ Planned | -        |
| F241 | Auto Points on Cash Sale        | High     | ⏳ Planned | R16,R31  |
| F242 | Points Saved in Customer Record | High     | ⏳ Planned | -        |
| F243 | Loyalty Sync                    | High     | ⏳ Planned | -        |

### Module 14: 💚 WHATSAPP (F244–F253) — 10 Features
| ID   | Feature                        | Priority | Status    | Rule Ref |
|------|-------------------------------|----------|-----------|----------|
| F244 | Open WhatsApp Web/App          | Medium   | ⏳ Planned | -        |
| F245 | +92 Pakistan Auto-Format       | Medium   | ⏳ Planned | -        |
| F246 | Hide Button if No Phone        | Medium   | ⏳ Planned | R55      |
| F247 | Pending Tab Reminder           | Medium   | ⏳ Planned | -        |
| F248 | Customer Detail Button         | Medium   | ⏳ Planned | -        |
| F249 | Supplier Card Button           | Medium   | ⏳ Planned | -        |
| F250 | Print History Send             | Medium   | ⏳ Planned | -        |
| F251 | POS Post-Sale Send             | Medium   | ⏳ Planned | -        |
| F252 | Urdu Payment Reminder          | Medium   | ⏳ Planned | R56      |
| F253 | Urdu Bill Summary              | Medium   | ⏳ Planned | R56      |

### Module 15: 🌐 SYNC & OFFLINE (F254–F263) — 10 Features
| ID   | Feature                        | Priority | Status    | Rule Ref |
|------|-------------------------------|----------|-----------|----------|
| F254 | Offline-First (Local Storage)  | Critical | ⏳ Planned | R11      |
| F255 | Real-time Cloud Sync           | Critical | ⏳ Planned | -        |
| F256 | All 9 Tables Sync              | Critical | ⏳ Planned | -        |
| F257 | Offline Write Queue            | Critical | ⏳ Planned | -        |
| F258 | Auto-Upload on Reconnect       | Critical | ⏳ Planned | -        |
| F259 | Dates in Correct Format        | High     | ⏳ Planned | -        |
| F260 | Multi-Device Instant Sync      | High     | ⏳ Planned | -        |
| F261 | Online/Offline Badge           | Medium   | ⏳ Planned | -        |
| F262 | "Offline — Local Only" Notice  | Medium   | ⏳ Planned | -        |
| F263 | Restore → All Devices Sync     | Critical | ⏳ Planned | R15      |

### Module 16: 📱 PWA & MOBILE (F264–F278) — 15 Features
| ID   | Feature                        | Priority | Status    | Rule Ref |
|------|-------------------------------|----------|-----------|----------|
| F264 | Mobile Install                | High     | ⏳ Planned | -        |
| F265 | Desktop Install               | High     | ⏳ Planned | -        |
| F266 | App Icons                     | Medium   | ⏳ Planned | -        |
| F267 | Service Worker                | Critical | ⏳ Planned | -        |
| F268 | Offline Cache                 | Critical | ⏳ Planned | -        |
| F269 | Cloud Cache                   | High     | ⏳ Planned | -        |
| F270 | Mobile POS Tabs               | High     | ⏳ Planned | -        |
| F271 | Hamburger Menu                | Medium   | ⏳ Planned | -        |
| F272 | Sidebar Drawer                | Medium   | ⏳ Planned | -        |
| F273 | Responsive Tables             | High     | ⏳ Planned | R57      |
| F274 | PIN Pad Large Touch Buttons   | Medium   | ⏳ Planned | -        |
| F275 | iOS Screen Fix                | Medium   | ⏳ Planned | -        |
| F276 | Double-tap Zoom Disabled      | Low      | ⏳ Planned | -        |
| F277 | Pull-to-refresh Disabled      | Low      | ⏳ Planned | -        |
| F278 | Blue Tap Flash Disabled       | Low      | ⏳ Planned | -        |

### Module 17: 🎨 UI / DESIGN (F279–F293) — 15 Features
| ID   | Feature                        | Priority | Status    | Rule Ref |
|------|-------------------------------|----------|-----------|----------|
| F279 | Full Dark Mode                | High     | ⏳ Planned | R50      |
| F280 | Custom Color Palette (9 shades)| Medium  | ⏳ Planned | -        |
| F281 | Primary: Pharmacy Green       | High     | ⏳ Planned | -        |
| F282 | Glassmorphism Login           | Low      | ⏳ Planned | -        |
| F283 | Gradient Login Background     | Low      | ⏳ Planned | -        |
| F284 | Logo + Glow Effect            | Low      | ⏳ Planned | -        |
| F285 | Custom Scrollbar              | Low      | ⏳ Planned | -        |
| F286 | Sidebar Fixed/Drawer          | Medium   | ⏳ Planned | -        |
| F287 | Role-Colored Badges           | Medium   | ⏳ Planned | -        |
| F288 | Active Navigation Dot         | Low      | ⏳ Planned | -        |
| F289 | Bordered Cards                | Medium   | ⏳ Planned | -        |
| F290 | Responsive Tables             | High     | ⏳ Planned | R57      |
| F291 | Scrollable Modals             | Medium   | ⏳ Planned | -        |
| F292 | Fast Loading (Code Split)     | High     | ⏳ Planned | -        |
| F293 | Lazy Loading                  | High     | ⏳ Planned | -        |

---

## 📜 RULES INDEX — 63 Permanent Rules

### 🔴 Critical Rules (R1–R10)
| Rule | Description | Affected Features |
|------|------------|------------------|
| R1   | Activity Log NEVER deleted | F194-F206 |
| R2   | Salesperson NEVER sees purchase price | F116, F178 |
| R3   | Margin discount % NEVER on receipt | F078, F045 |
| R4   | Pending sale ALWAYS has payback date | F060, F083 |
| R5   | Super Admin account NEVER deleted | F021 |
| R6   | Expired products NEVER sold | F036 |
| R7   | Out-of-stock NEVER sold | F035 |
| R8   | Emergency login ALWAYS logged | F011, F012, F197, F198 |
| R9   | Deactivated account CANNOT login | F015 |
| R10  | Nobody deactivates Super Admin | F023, F029, F191 |

### 🟡 Data Rules (R11–R19)
| Rule | Description |
|------|------------|
| R11  | Local first, then cloud sync |
| R12  | Unique bill number (MM-XXXX-YYY) |
| R13  | Logs are append-only |
| R14  | Backup includes ALL tables including logs |
| R15  | After restore, all devices sync |
| R16  | Loyalty points only on cash sales |
| R17  | NO loyalty on pending/credit sales |
| R18  | Bill number has timestamp suffix |
| R19  | Profit = Sale Price − Purchase Price |

### 🟢 Business Rules (R20–R36)
*(See feature index for mapping)*

### 🔵 Permission Rules (R37–R48)
*(See feature index for mapping)*

### 🟣 UI/UX Rules (R49–R57)
*(See feature index for mapping)*

---

## 📝 DISCOVERY NOTES

### Session 1 — 2026-05-30
- **Input Received:** Complete PRD document (293+ features, 63 rules, 9 tables, 3-phase roadmap)
- **Key Observations:**
  - Phase 1 & Phase 1.5 marked as COMPLETE
  - Phase 2 is PLANNED (Loyalty redemption, auto reminders, multi-branch, etc.)
  - Phase 3 is FUTURE (AI, prescriptions, insurance, etc.)
  - Pakistan-specific (+92, Rs., Urdu messages)
  - Offline-first architecture is critical
  - 4 roles with strict permission hierarchy
  - Activity logs are IMMUTABLE

### Section 1 DECISIONS — Core Business & Workflow ✅

| # | Topic | Decision |
|---|-------|----------|
| Q1 | Device Count | **4–6 devices** — Multiple staff with own devices |
| Q2 | Offline Conflict | **Queue & Auto-merge** — Both sales count, stock deducted even if negative |
| Q3 | Bill Number Format | **[StaffCode]-[Index#]-[DeviceCode]** e.g., "AH-0001-M" where AH=staff, 0001=sequential (never resets, trackable, undeletable), M=mobile/D=desktop |
| Q4 | Sale Cancellation | **Permanent sale + Return entry** — Mistakes via new "Return" bill referencing original bill #. Owner approval: ✅ tick = accepted, ⚠️ alert = pending |
| Q5 | Shift System | **Day Open/Close only** — Open with starting cash, close at night, compare expected vs actual cash |

**NEW FEATURES IDENTIFIED:**
| New ID | Feature | Source |
|--------|---------|--------|
| NF-001 | Return/Refund System (with owner approval) | Q4 |
| NF-002 | Day Open/Close with Cash Drawer Tracking | Q5 |
| NF-003 | Bill Number: Staff Code + Index + Device Code | Q3 |

### Section 2 DECISIONS — Auth & Login ✅

| # | Topic | Decision |
|---|-------|----------|
| Q6 | Master Passwords | **3 Magic Keys** — each maps to a power level: Key 1 ("sorRy#13") = Super Admin, Key 2 = Manager, Key 3 = Salesperson. Name field is required but can be random. Each key gives the power level of that role. |
| Q7 | Emergency Login Use | **Forgot PIN + No Account + Owner Backdoor** — The Super Key is the owner's secret master key that opens any lock. All 3 scenarios covered. |
| Q8 | Session Duration | **Until browser/tab closed** — Refresh keeps session. Close browser = logout. |
| Q9 | PIN Rules | **No repeated + no sequential** — Block 1111, 2222 AND 1234, 4321. Must be random-ish. |
| Q10 | Auto-Seed & Super Key | **First launch = Super Key "sorRy#13"** — Not a super USER, but a super KEY. Super Admin has same power as Owner, but super key can login to ANY ID and change any password. Other 2 keys give Manager/Salesperson access. |

**IMPORTANT CLARIFICATIONS:**
- Super Admin ≠ separate user account. It's a KEY that gives ultimate power
- The name field in emergency login is for logging only (can be random text)
- "sorRy#13" is the primary super key (should be configurable later)
- Super key can impersonate any staff member

### Section 3 DECISIONS — Super Admin + POS/Sales ✅

| # | Topic | Decision |
|---|-------|----------|
| Q11 | Discount System | **BOTH per-product AND whole-bill** — Per-product discount on individual items. Bill-level flat discount replaces/cancels the global auto-discount when applied. |
| Q12 | Max Discount | **Owner setting with 3 options:** (1) Set max % in settings, (2) Flat discount type selection, (3) "No profit" mode. Alert shown when limit exceeded. |
| Q13 | Cart Item Limit | **Owner-configurable** — In settings: either "no limit" or a specific max number per bill. |
| Q14 | Duplicate Product in Cart | **Auto-merge** — Same product code = merge quantities. No separate entries. |
| Q15 | Printer Type | **Any printer via browser print dialog** — Universal support, no thermal-specific dependency. |

**NEW SETTINGS IDENTIFIED:**
| New ID | Setting | Source |
|--------|---------|--------|
| NS-001 | Max Discount % (owner setting) | Q12 |
| NS-002 | Discount Mode (flat/no-profit/%) | Q12 |
| NS-003 | Cart Item Limit (owner setting) | Q13 |

### Section 4 DECISIONS — Inventory & Receipt ✅

| # | Topic | Decision |
|---|-------|----------|
| Q16 | Product Delete | **Deactivate, never delete** — Deactivated products visible in old history and searchable, but can't be sold. Can be reactivated later. |
| Q17 | Batch System | **Multiple batches, manual pick** — Each batch has its own purchase price, sale price, expiry. Cashier manually selects batch. If not selected, auto-pick (FIFO). |
| Q18 | Receipt Format | **Both thermal + A4, selectable in settings** — Owner chooses format in settings. |
| Q19 | Credit Note / Returns | **Return references original sale #. Money given back = recorded as expense. Items auto-restored to inventory. Both bills linked.** |
| Q20 | Negative Stock | **Owner setting (YES/NO), default = NO** — Configurable per shop preference. |

**NEW FEATURES/SETTINGS IDENTIFIED:**
| New ID | Feature | Source |
|--------|---------|--------|
| NF-004 | Product Deactivate/Reactivate | Q16 |
| NF-005 | Multi-batch per product with manual/auto pick | Q17 |
| NF-006 | Return flow: link to original sale, expense entry, auto restock | Q19 |
| NS-004 | Allow Negative Stock (owner setting, default NO) | Q20 |
| NS-005 | Receipt Format (thermal/A4 selector) | Q18 |

### Section 5 DECISIONS — Ledger, Expenses, Sync ✅

| # | Topic | Decision |
|---|-------|----------|
| Q21 | Partial Payments | **Partial payments allowed, each logged** — Each partial payment is a separate entry with date, amount, running balance. All tracked in customer history. |
| Q22 | Overdue Action | **Warn + owner decides** — Red badge on customer card. Popup asks owner: 'Block new pending?' Decided case by case. |
| Q23 | Cloud Provider | **No preference — AI decides** — Best fit based on offline-first, multi-device, PWA requirements. |
| Q24 | Multiple Pending Bills | **Separate bills, all visible** — Each pending sale is its own bill with full details. All shown in customer's purchase history. |
| Q25 | Tax (GST) | **Configurable in settings, default OFF** — Can be enabled later. When ON, auto-calculates and shows on receipt. |

**NEW SETTINGS IDENTIFIED:**
| New ID | Setting | Source |
|--------|---------|--------|
| NS-006 | Tax Enable/Disable + % (default OFF) | Q25 |
| NS-007 | Auto-block overdue pending (owner toggle) | Q22 |

---

## 📊 DISCOVERY SESSION SUMMARY — 25 Questions Answered ✅

### TOTAL PROJECT SCOPE:
| Metric | Count |
|--------|-------|
| Original Features (PRD) | 293+ |
| New Features Discovered | 6 (NF-001 to NF-006) |
| New Settings Discovered | 7 (NS-001 to NS-007) |
| Permanent Rules | 63 |
| Data Tables | 9 |
| New Tables Needed | 2 (BATCHES, RETURNS) |
| Total Questions Asked | 25 |
| Sections Completed | 10 of 19 |

### REMAINING SECTIONS (well-defined in PRD, no critical questions):
- Reports (F146-F180) — PRD covers all 6 tabs clearly
- Staff (F181-F193) — PRD covers all features
- Activity Log (F194-F206) — PRD covers all features
- Print History (F207-F213) — PRD covers all features
- Settings (F214-F233) — PRD + 7 new settings documented
- Loyalty (F234-F243) — PRD covers all features
- WhatsApp (F244-F253) — PRD covers all features
- Sync & Offline (F254-F263) — PRD covers all features
- PWA & Mobile (F264-F278) — PRD covers all features
- UI / Design (F279-F293) — PRD covers all features

### ALL KEY DECISIONS:

| # | Decision | Summary |
|---|----------|---------|
| 1 | Device Count | 4–6 devices |
| 2 | Conflict Resolution | Queue & auto-merge |
| 3 | Bill Format | [StaffCode]-[Index]-[Device] |
| 4 | Sale Cancellation | Permanent + Return entry (owner approval) |
| 5 | Shift System | Day Open/Close only |
| 6 | Master Passwords | 3 Magic Keys (sorRy#13 = super) |
| 7 | Emergency Login | Forgot PIN + no account + backdoor |
| 8 | Session | Until browser closed |
| 9 | PIN Rules | No 1111, 2222, 1234, 4321 |
| 10 | Auto-Seed | Super Key, not super user |
| 11 | Discount | Per-product + whole-bill (bill replaces global) |
| 12 | Max Discount | Owner setting (flat/no-profit/%) |
| 13 | Cart Limit | Owner-configurable |
| 14 | Duplicate Product | Auto-merge |
| 15 | Printer | Any (browser print) |
| 16 | Product Delete | Deactivate only, never delete |
| 17 | Batch System | Multi-batch, manual/auto pick |
| 18 | Receipt Format | Thermal + A4 (setting) |
| 19 | Credit Note/Return | Links to original sale, expense entry, auto-restock |
| 20 | Negative Stock | Owner setting, default NO |
| 21 | Partial Payments | Allowed, each logged with running balance |
| 22 | Overdue | Warn + owner decides to block |
| 23 | Cloud Provider | AI recommendation |
| 24 | Multiple Pending | Separate bills, all visible |
| 25 | Tax | Setting, default OFF |

---

## ⏭️ NEXT STEPS

- [x] ✅ Section 1: Core Business & Workflow
- [x] ✅ Section 2: Auth & Login
- [x] ✅ Section 3: Super Admin + POS/Sales
- [x] ✅ Section 4: Inventory & Receipt
- [x] ✅ Section 5: Ledger, Expenses, Sync
- [x] ✅ Sections 6-14: PRD-sufficient, no critical questions needed
- [ ] 🔄 Tech Stack Recommendation (AI to decide based on requirements)
- [ ] 🔄 Generate Final Architecture Plan
- [ ] 🔄 Begin Development

---

*Last Updated: 2026-05-31 | Tracker Version: v1.9 | Discovery COMPLETE*
