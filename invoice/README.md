# Invoice Studio

A responsive, no-sign-up invoice generator at `/invoice-generator/`. Create and preview invoices as you edit, then save drafts in your browser or export them as PDF, PNG, JSON, or printable pages. The root route redirects to the canonical generator URL.

## Run locally

```sh
npm install
npm run dev
```

## Deploy

See the [Cloudflare Pages and Workers deployment guide](./docs/cloudflare-deployment.md) for Git integration, manual Pages uploads, Workers Static Assets deployment, SPA route handling, custom domains, and draft migration.

## Features

- Business and client details, optional logo, dates, and a broad currency list supported by the browser
- Dedicated local-first generators for invoices, quotes, estimates, receipts, proforma invoices, credit notes, purchase orders, payment receipts, timesheets, bills, packing slips, and delivery notes
- Country invoice starting points for the US, UK, Canada, Australia, India, Pakistan, Bangladesh, UAE, and Saudi Arabia, with localized dates/currency and fully editable country-detail fields, plus VAT, GST, sales-tax, tax, and non-tax modes
- Country-detail labels and values can be renamed, added, and removed per invoice, with up to 12 saved custom fields
- Country and tax pages use editable starting defaults, provide general-information disclaimers, and do not claim legal or tax compliance
- Twelve polished invoice templates with distinct typography, accent colors, logo positions, table treatments, and payment/footer styling
- Per-invoice design controls for custom accent color, font, logo alignment, item table style, and footer text
- Optional approximate PKR balance with published exchange-rate timestamp; the lookup sends currency codes only, never invoice data
- Editable product and service lines, tax, discounts, shipping, deposits, previous payments, notes, and payment instructions
- Local QR codes for payment links, PayPal, Stripe, Wise, bank transfer details, UPI, wallet addresses, or custom links
- Automatic invoice math checks for line items, subtotal, tax, total, and remaining balance before export
- Standalone hourly-rate and project-price calculator based on income, expenses, taxes, billable hours, and profit margin
- Live invoice preview, clipboard copy, browser print, and PDF, PNG, and JSON downloads
- Saved drafts stored locally in this browser; no account or invoice uploads
- Import/export JSON backups and delete saved local invoice data
- Duplicate saved invoices with the next available invoice number, fresh invoice dates, and the same client and line items

Use **Saved invoices** in the app to reopen or remove a draft, import/export JSON backups, or delete all saved invoice data. Browser storage can also be cleared by the browser or device. An optional PKR estimate contacts ExchangeRate-API with the selected currency code only; invoice values and client details are not sent. Invoice PDFs and payment QR codes are generated in your browser.
