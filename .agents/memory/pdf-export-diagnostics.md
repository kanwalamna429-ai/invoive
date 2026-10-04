---
name: Client-side PDF export diagnostics
description: Lessons for investigating PDF export failures that only occur in a visitor's browser.
---

PDF rendering and saving run in the visitor's browser, so interactive exceptions may not appear in server or workflow logs. A successful headless test on the app URL does not guarantee downloads work in the Replit preview frame or with a visitor's saved assets.

**Why:** A reported Chrome/Edge error persisted despite successful desktop, mobile, QR, and logo tests. Exposing the caught exception and testing the embedded preview helps distinguish invoice-rendering failures from browser or download restrictions.

**How to apply:** Keep caught export errors visible to users and test the embedded preview and invoices with assets before changing the PDF generation pipeline.