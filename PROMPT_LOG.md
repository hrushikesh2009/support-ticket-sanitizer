# PromptWars Cybersecurity & Data Privacy Challenge
## Project: Support Ticket Sanitizer (Dashboard Redesign)

### 1. Active Local Development URL
> **Local Application URL:** [http://127.0.0.1:5173/](http://127.0.0.1:5173/)  
> Running continuously from `frontend/` on external loopback `127.0.0.1:5173` outside sandbox, ready for browser evaluation.

---

### 2. Redesign Overview & Architecture
The application has been redesigned into a **Single-Page Privacy Dashboard** featuring a warm off-white and royal-indigo palette, live summary metric cards, interactive category filters, a tasteful CSS 3D document illustration, and responsive side-by-side preview panels.

All detection, Luhn validation, masking, and RFC-4180 CSV parsing remain **100% in-browser memory** with zero external network requests.

---

### 3. Redesign Changelog & Features Implemented

| Component / Feature | Implementation Details | Verification |
| :--- | :--- | :--- |
| **Warm & Royal Indigo Palette** | Light: Canvas `#F7F7F4`, Surface `#FFFFFF`, Ink text `#16162A`, Royal Indigo `#4338CA`. Dark: Canvas `#11111B`, Surface `#1C1D2B`, Light text `#F1F0FA`, Primary `#A5B4FC`. Tokenized via CSS variables and Tailwind. | Checked contrast in both themes across text, controls, badges, and borders. |
| **Compact Navbar** | Product brand icon & title, smooth-scrolling `Dashboard` link jumping to `#workspace`, and theme toggle. | Clicked `Dashboard` link; confirmed smooth navigation to workspace. |
| **Compact Hero & CTA** | Headline: *“Share the ticket. Protect the customer.”*, one-sentence pitch, and primary *“Try demo”* button with 2px hover lift (`hover:-translate-y-0.5 active:scale-[0.97]`). | Keeps dashboard visible in initial desktop viewport. Click loads sample, sets Full Mask, focuses input. |
| **Tasteful 3D Document Effect** | Beside hero copy: layered document illustration with perspective (1000px), offset sheets, redacted ticket lines, and pointer tilt up to 6° on mouse move; resets smoothly on mouse leave. Static on touch devices & reduced motion. No Three.js. | Hovered over illustration; observed 6° tilt and smooth return. |
| **Three Summary Cards** | 1. **Matches detected** (live count, e.g. 9 matches)<br>2. **Entity types found** (e.g. 7 of 7 supported)<br>3. **Active mode** (Full Mask / Partial Mask / Pseudonymize with preview tag). Cards have neutral cursor and subtle hover shadow. | Live counts update synchronously when text, mode, or sample changes. |
| **Category Filters** | Placed below summary cards. Each badge displays entity name and live count. Visibly selected with active ring/fill when clicked to isolate preview highlights. | Clicked All, Email, Phone, Card, PAN, Aadhaar; preview highlights filter immediately. |
| **Preview Panels** | Side-by-side on desktop, stacked on mobile. Replaced "Safe to Share" with live label: **"9 matches redacted"**. Scroll position automatically resets to top on sample load or file import. Clear empty state when no text loaded. | Verified side-by-side layout, scroll reset on sample load, and empty state rendering. |
| **Primary Download Action** | Prominent royal-indigo action button: **"Download sanitized TXT file"** / **"Download sanitized CSV file"**. | Clicked download; tested valid `.txt` and `.csv` downloads. |
| **CSV Engine (RFC-4180)** | Preserves quoted commas (`"Doe, John"`), escaped quotes (`""quotes""`), multiline fields (`"Multi\nLine, with ""quotes"""`), rows, and columns. Offers Raw CSV and Tabular View. | Imported, processed, and exported CSV. Row/column parity verified in unit tests. |
| **Repeated Aliases** | Identical emails receive the same alias (`EMAIL_01`) across both text occurrences and across multiple CSV rows. | Verified `EMAIL_01` mapped identically for both occurrences. |
| **Luhn Mod-10 Validation** | Card `4012 8888 8888 1881` passes Luhn and is redacted. 16-digit trace reference `9876-5432-1098-7654` fails Luhn and stays untouched. | Verified test card redacted while audit reference remains unredacted. |
| **Button States & Feedback** | 2px hover lift, 0.97 press scale, focus rings (`ring-2 ring-royal-500`), brief "Copied" toast feedback on Copy button, and error clearing on Clear/Load. | Click-tested all buttons and keyboard tab navigation. |

---

### 4. Interactive Control Click-Testing Log

- [x] **"Try demo" Button**: Loads `TICKET #SEC-89241`, sets Full Mask mode, scrolls to `#workspace`, and focuses input textarea.
- [x] **"Load Ticket Sample" Button**: Loads fictional ticket with 9 entities, updates summary cards, resets preview scrolls to top.
- [x] **"Load CSV Sample" Button**: Loads 3-row CSV, enables CSV table/raw toggles, preserves columns and rows.
- [x] **"Import .txt / .csv" Button**: Opens file picker; accepts `.txt` and `.csv` files; displays error for unsupported extensions and clears error upon valid load.
- [x] **"Clear" Button**: Clears textarea, resets summary cards to 0, resets preview panels to empty state.
- [x] **"Full Mask" Mode**: Replaces all sensitive data with `[REDACTED]`.
- [x] **"Partial Mask" Mode**: Displays `**** 1881`, `a***n@cybersecure-vault.io`, `ABCDE****F`, `+1 ******5678`.
- [x] **"Pseudonymize" Mode**: Deterministically assigns `EMAIL_01` to both email occurrences and maintains cross-row CSV consistency.
- [x] **Category Filter Buttons** (All, Email, Phone, IPv4, IPv6, PAN, Aadhaar, Card): Filter preview highlights with visible checked/selected outline.
- [x] **"Copy" Button**: Copies original or sanitized content to clipboard; shows brief "Copied" confirmation.
- [x] **"Download sanitized file" Button**: Generates and downloads sanitized `.txt` or `.csv` file.
- [x] **"Theme Toggle" Button**: Toggles between warm off-white and charcoal-indigo themes with 300ms transition; persists in `localStorage`.
- [x] **"Dashboard" Navbar Link**: Jumps/scrolls to `#workspace`.

---

### 5. Automated Engine Tests (28 Assertions)

```powershell
cd frontend
npm test
```
**Output:**
```
--- Running Engine Verification Tests ---
PASS: Luhn accepts valid 16-digit card 4012 8888 8888 1881
PASS: Luhn rejects non-card 16-digit reference 9876-5432-1098-7654
PASS: Card 4012 8888 8888 1881 detected as CARD
PASS: 16-digit reference 9876-5432-1098-7654 NOT detected as PII
PASS: Detected exactly 2 email occurrences (found: 2)
PASS: Detected PAN ABCDE1234F
PASS: Detected Aadhaar 5489 1234 5678
PASS: Detected IPv4 192.168.1.105
PASS: Detected IPv6
PASS: Full Mask contains [REDACTED]
PASS: Full Mask keeps 16-digit reference untouched
PASS: Full Mask redacts card
PASS: Partial mask retains last 4 card digits (1881)
PASS: Partial mask retains PAN ABCDE****F
PASS: Partial mask keeps 16-digit reference untouched
PASS: Both email occurrences mapped to EMAIL_01 (found count: 2)
PASS: Pseudonymize keeps 16-digit reference untouched
PASS: Parsed 3 CSV rows (header + 2 records)
PASS: Preserved quoted comma inside name field
PASS: Preserved newline and unescaped double quotes
PASS: Preserved second row name
PASS: Serialized CSV correctly quoted comma field
PASS: Serialized CSV correctly re-escaped double quotes
PASS: Row count strictly preserved after Full Mask
PASS: Column counts strictly preserved across all rows
PASS: Preserved non-sensitive field in row 1
PASS: Preserved multiline cell in row 1
PASS: Masked phone in row 1
PASS: Masked email in row 1
PASS: Row 1 email pseudonymized as EMAIL_01
PASS: Row 2 identical email also pseudonymized as EMAIL_01 across rows
--- ALL TESTS PASSED SUCCESSFULLY! ---
```

---

### 6. Production Build

```powershell
cd frontend
npm run build
```
- Bundler: Vite v6.4.6
- Modules transformed: 1,595
- Output directory: `frontend/dist/`
- Build status: **0 errors, 0 warnings**
