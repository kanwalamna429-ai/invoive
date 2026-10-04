const invoiceGenerator = {
  slug: "invoice-generator",
  path: "/invoice-generator/",
  documentType: "invoice",
  label: "Invoice",
  paperLabel: "INVOICE",
  heading: "Free Invoice Generator",
  description: "Create a clear, professional invoice with your business details, itemized charges, payment instructions, and a live calculation check.",
  currency: "USD",
  taxLabel: "Tax",
};

const documentDefinitions = [
  invoiceGenerator,
  {
    slug: "quote-generator",
    path: "/quote-generator/",
    documentType: "quote",
    label: "Quote",
    heading: "Free Quote Generator",
    description: "Prepare an itemized quote with clear quantities, rates, notes, and a validity date. Convert an approved quote into an invoice while keeping its client and line items.",
    numberLabel: "Quote number",
    dateLabel: "Quote date",
    dueDateLabel: "Valid until",
    totalLabel: "Quoted total",
    numberPrefix: "QUO",
  },
  {
    slug: "estimate-generator",
    path: "/estimate-generator/",
    documentType: "estimate",
    label: "Estimate",
    heading: "Free Estimate Generator",
    description: "Build a client-ready estimate with line-by-line pricing, tax and discount calculations, and an estimated total for the proposed work.",
    numberLabel: "Estimate number",
    dateLabel: "Estimate date",
    dueDateLabel: "Estimate valid until",
    totalLabel: "Estimated total",
    numberPrefix: "EST",
  },
  {
    slug: "receipt-generator",
    path: "/receipt-generator/",
    documentType: "receipt",
    label: "Receipt",
    heading: "Free Receipt Generator",
    description: "Create an itemized receipt with customer details, payment notes, taxes, and a record of the amount received.",
    numberLabel: "Receipt number",
    dateLabel: "Receipt date",
    dueDateLabel: "Payment date",
    totalLabel: "Receipt total",
    balanceLabel: "Amount remaining",
    numberPrefix: "RCT",
  },
  {
    slug: "proforma-invoice-generator",
    path: "/proforma-invoice-generator/",
    documentType: "proforma",
    label: "Proforma invoice",
    heading: "Free Proforma Invoice Generator",
    description: "Draft a clearly labelled proforma invoice with itemized pricing, currency, delivery notes, and payment instructions before a final sale.",
    numberLabel: "Proforma number",
    totalLabel: "Proforma total",
    numberPrefix: "PRO",
  },
  {
    slug: "credit-note-generator",
    path: "/credit-note-generator/",
    documentType: "credit-note",
    label: "Credit note",
    heading: "Free Credit Note Generator",
    description: "Prepare an itemized credit note with a reference number, client details, adjustments, and a clearly calculated credited amount.",
    numberLabel: "Credit note number",
    dateLabel: "Credit note date",
    totalLabel: "Credit amount",
    balanceLabel: "Credit balance",
    numberPrefix: "CRN",
  },
  {
    slug: "purchase-order-generator",
    path: "/purchase-order-generator/",
    documentType: "purchase-order",
    label: "Purchase order",
    heading: "Free Purchase Order Generator",
    description: "Create a purchase order with supplier details, requested items, quantities, rates, delivery notes, and a purchase-order reference.",
    numberLabel: "Purchase order number",
    recipientLabel: "SUPPLIER",
    dateLabel: "Order date",
    dueDateLabel: "Requested delivery date",
    totalLabel: "Order total",
    numberPrefix: "PO",
  },
  {
    slug: "payment-receipt-generator",
    path: "/payment-receipt-generator/",
    documentType: "payment-receipt",
    label: "Payment receipt",
    heading: "Free Payment Receipt Generator",
    description: "Record a received payment with payer details, a payment reference, itemized amounts, and space for payment method notes.",
    numberLabel: "Payment receipt number",
    dateLabel: "Payment date",
    dueDateLabel: "Related invoice due date",
    totalLabel: "Payment received",
    balanceLabel: "Remaining balance",
    numberPrefix: "PAY",
  },
  {
    slug: "timesheet-generator",
    path: "/timesheet-generator/",
    documentType: "timesheet",
    label: "Timesheet",
    heading: "Free Timesheet Generator",
    description: "Summarize billable work with task descriptions, hours, rates, client details, and a calculated period total.",
    numberLabel: "Timesheet number",
    dateLabel: "Period start",
    dueDateLabel: "Period end",
    totalLabel: "Period total",
    numberPrefix: "TS",
  },
  {
    slug: "bill-generator",
    path: "/bill-generator/",
    documentType: "bill",
    label: "Bill",
    heading: "Free Bill Generator",
    description: "Prepare a straightforward bill with customer and business details, itemized charges, tax, payment instructions, and a balance summary.",
    numberLabel: "Bill number",
    totalLabel: "Bill total",
    numberPrefix: "BILL",
  },
  {
    slug: "packing-slip-generator",
    path: "/packing-slip-generator/",
    documentType: "packing-slip",
    label: "Packing slip",
    heading: "Free Packing Slip Generator",
    description: "Create a packing slip with sender and recipient details, an itemized goods list, quantities, and shipment notes.",
    numberLabel: "Packing slip number",
    recipientLabel: "SHIP TO",
    dateLabel: "Packing date",
    dueDateLabel: "Expected delivery",
    hidePricing: true,
    numberPrefix: "PKG",
  },
  {
    slug: "delivery-note-generator",
    path: "/delivery-note-generator/",
    documentType: "delivery-note",
    label: "Delivery note",
    heading: "Free Delivery Note Generator",
    description: "Prepare a delivery note with recipient details, delivered items and quantities, delivery notes, and a reference for your records.",
    numberLabel: "Delivery note number",
    recipientLabel: "DELIVER TO",
    dateLabel: "Dispatch date",
    dueDateLabel: "Delivery date",
    hidePricing: true,
    numberPrefix: "DN",
  },
];

const countryDefinitions = [
  { slug: "us-invoice-generator", path: "/us-invoice-generator/", name: "United States", code: "US", currency: "USD", taxLabel: "Sales tax", locale: "en-US", regionLabel: "State", postalLabel: "ZIP code", referenceLabel: "Business or tax reference" },
  { slug: "uk-invoice-generator", path: "/uk-invoice-generator/", name: "United Kingdom", code: "GB", currency: "GBP", taxLabel: "VAT", locale: "en-GB", regionLabel: "County or region", postalLabel: "Postcode", referenceLabel: "Business or tax reference" },
  { slug: "canada-invoice-generator", path: "/canada-invoice-generator/", name: "Canada", code: "CA", currency: "CAD", taxLabel: "GST/HST", locale: "en-CA", regionLabel: "Province or territory", postalLabel: "Postal code", referenceLabel: "Business or tax reference" },
  { slug: "australia-invoice-generator", path: "/australia-invoice-generator/", name: "Australia", code: "AU", currency: "AUD", taxLabel: "GST", locale: "en-AU", regionLabel: "State or territory", postalLabel: "Postcode", referenceLabel: "Business or tax reference" },
  { slug: "india-invoice-generator", path: "/india-invoice-generator/", name: "India", code: "IN", currency: "INR", taxLabel: "GST", locale: "en-IN", regionLabel: "State or union territory", postalLabel: "PIN code", referenceLabel: "Business or tax reference" },
  { slug: "pakistan-invoice-generator", path: "/pakistan-invoice-generator/", name: "Pakistan", code: "PK", currency: "PKR", taxLabel: "Sales tax", locale: "en-PK", regionLabel: "Province or territory", postalLabel: "Postal code", referenceLabel: "Business or tax reference" },
  { slug: "bangladesh-invoice-generator", path: "/bangladesh-invoice-generator/", name: "Bangladesh", code: "BD", currency: "BDT", taxLabel: "VAT", locale: "en-BD", regionLabel: "Division", postalLabel: "Postal code", referenceLabel: "Business or tax reference" },
  { slug: "uae-invoice-generator", path: "/uae-invoice-generator/", name: "United Arab Emirates", code: "AE", currency: "AED", taxLabel: "VAT", locale: "en-AE", regionLabel: "Emirate", postalLabel: "PO box (optional)", referenceLabel: "Business or tax reference" },
  { slug: "saudi-arabia-invoice-generator", path: "/saudi-arabia-invoice-generator/", name: "Saudi Arabia", code: "SA", currency: "SAR", taxLabel: "VAT", locale: "en-SA", regionLabel: "Region or province", postalLabel: "Postal code", referenceLabel: "Business or tax reference" },
].map((country) => ({
  ...country,
  documentType: "invoice",
  label: `${country.name} invoice`,
  paperLabel: "INVOICE",
  heading: `Free ${country.name} Invoice Generator`,
  description: `Create an itemized invoice in ${country.currency}, with a configurable ${country.taxLabel} field, dates, client details, and payment notes. Enter rates that apply to your circumstances and verify requirements with your local tax authority.`,
  countryName: country.name,
  countryCode: country.code,
  locale: country.locale,
  regionLabel: country.regionLabel,
  postalLabel: country.postalLabel,
  referenceLabel: country.referenceLabel,
}));

const taxDefinitions = [
  { slug: "vat-invoice-generator", path: "/vat-invoice-generator/", name: "VAT", taxLabel: "VAT" },
  { slug: "gst-invoice-generator", path: "/gst-invoice-generator/", name: "GST", taxLabel: "GST" },
  { slug: "sales-tax-invoice-generator", path: "/sales-tax-invoice-generator/", name: "Sales Tax", taxLabel: "Sales tax" },
  { slug: "tax-invoice-generator", path: "/tax-invoice-generator/", name: "Tax", taxLabel: "Tax" },
  { slug: "non-tax-invoice-generator", path: "/non-tax-invoice-generator/", name: "Non-Tax", taxLabel: "Tax", taxFree: true },
].map((mode) => ({
  ...mode,
  documentType: "invoice",
  label: `${mode.name} invoice`,
  paperLabel: mode.taxFree ? "INVOICE" : `${mode.name.toUpperCase()} INVOICE`,
  heading: `Free ${mode.name} Invoice Generator`,
  description: mode.taxFree
    ? "Create an invoice without a tax charge. This tool does not determine whether a transaction is tax-exempt; confirm your tax status and obligations with the relevant authority."
    : `Create an itemized invoice with a configurable ${mode.taxLabel} rate, client details, and payment notes. Tax treatment and required invoice details depend on your jurisdiction; verify them with the relevant authority.`,
}));

export const documentPages = [...documentDefinitions, ...countryDefinitions, ...taxDefinitions];
export const documentToolGroups = [
  { title: "Business documents", description: "Create a professional document for each step of your business workflow.", pages: documentDefinitions },
  { title: "Country invoice tools", description: "Start in a familiar currency and enter tax details appropriate to your own circumstances.", pages: countryDefinitions },
  { title: "Tax invoice tools", description: "Use a matching tax label and enter the applicable rate yourself.", pages: taxDefinitions },
];

export function getDocumentPage(pathname) {
  const normalizedPath = pathname.endsWith("/") ? pathname : `${pathname}/`;
  return documentPages.find((page) => page.path === normalizedPath) || invoiceGenerator;
}

export function getDocumentPageBySlug(slug) {
  return documentPages.find((page) => page.slug === slug) || invoiceGenerator;
}

export function createCountryFields(page, invoice = {}) {
  if (!page.countryCode) return [];
  if (Array.isArray(invoice.countryFields)) {
    return invoice.countryFields
      .filter((field) => field && typeof field === "object")
      .slice(0, 12)
      .map((field, index) => ({
        id: typeof field.id === "string" && field.id ? field.id : `${page.slug}-field-${index + 1}`,
        label: typeof field.label === "string" ? field.label : "",
        value: typeof field.value === "string" ? field.value : String(field.value ?? ""),
      }));
  }

  return [
    { id: `${page.slug}-region`, label: page.regionLabel || "Region or province", value: invoice.businessRegion || "" },
    { id: `${page.slug}-postal`, label: page.postalLabel || "Postal code", value: invoice.businessPostalCode || "" },
    { id: `${page.slug}-reference`, label: page.referenceLabel || "Business or tax reference", value: invoice.businessReference || "" },
  ];
}

export function applyDocumentPage(invoice, page = invoiceGenerator) {
  return {
    ...invoice,
    invoiceNumber: page.numberPrefix && invoice.invoiceNumber === "INV-001"
      ? `${page.numberPrefix}-001`
      : invoice.invoiceNumber,
    documentType: page.documentType,
    documentPage: page.slug,
    countryName: page.countryName || "",
    countryCode: page.countryCode || "",
    locale: page.locale || "",
    countryFields: createCountryFields(page, invoice),
    taxLabel: page.taxLabel || "Tax",
    taxFree: Boolean(page.taxFree),
    currency: page.currency || invoice.currency,
    taxRate: page.taxFree ? 0 : invoice.taxRate,
  };
}
