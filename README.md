# Support Ticket Sanitizer

Support Ticket Sanitizer helps support teams remove sensitive information from tickets before sharing them with engineering. Paste a ticket or load a TXT or CSV file, review the changes, and download the sanitized result.

Built for the PromptWars Cybersecurity & Data Privacy challenge.

## What it does

- Detects emails, phone numbers, IPv4 and IPv6 addresses, Indian PAN and Aadhaar formats, and payment card candidates that pass the Luhn checksum.
- Shows original and sanitized content side by side, with highlighted matches, category filters, and detection counts.
- Offers Full Mask, Partial Mask, and Pseudonymize. Repeated values receive the same alias within the document.
- Lets you review CSV detections by column, compare before and after, and export a sanitized CSV with its row and column structure preserved.
- Shows session scan counts and recent activity on the Dashboard.

The app processes ticket and CSV contents in the browser. It requires no backend, account, or API key. Review the sanitized result before sharing.

## Run locally

Install Node.js 22 or newer. From the repository root, run:

~~~sh
cd frontend
npm ci
npm run dev
~~~

Open the local URL Vite prints. To build and preview the production version, run these commands from the same folder:

~~~sh
npm run build
npm run preview
~~~

## 45-second demo

1. Open **Home** and click **Try demo**. The sample has **9 matches across 7 categories**.
2. Switch from **Full Mask** to **Pseudonymize**. Both occurrences of the same email become **EMAIL_01**.
3. In the payment section, show that the test card is replaced and the **9876-5432-1098-7654** trace reference remains visible because it fails Luhn.
4. Click **Download sanitized TXT file**. Open **Dashboard** to show the session’s scan counts.

To demonstrate CSV, open **CSV → Load CSV Sample → Sanitize CSV**. Compare **Before** and **After**, then click **Download sanitized CSV**.

## Deploy to Vercel

Import this GitHub repository and use these settings.

| Setting | Value |
| --- | --- |
| Framework preset | Vite |
| Root directory | frontend |
| Build command | npm run build |
| Output directory | dist |
| Environment variables | None required |

After deployment, open the public URL and run the sample demo. [Vercel build settings](https://vercel.com/docs/builds/configure-a-build)

## Project structure

- **frontend/src/pages/** holds Home, Scanner, CSV, Dashboard, Modes, Entity Types, and Settings.
- **frontend/src/components/** holds shared UI and the previews.
- **frontend/src/engine/** holds detection, Luhn validation, masking, and CSV processing.
- **frontend/src/state/** holds in-memory session data and preferences.
- **frontend/src/styles/** holds the layout and appearance.
- **[PROMPT_LOG.md](PROMPT_LOG.md)** records the hackathon development workflow.

React, TypeScript, Vite, Tailwind CSS, React Router, Framer Motion, and Lucide power the frontend.
 
