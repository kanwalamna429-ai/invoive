export const STORAGE_KEY = "invoice-studio-saved-invoices";

export const createEmptyInvoice = () => {
  const today = new Date();
  const due = new Date(today);
  due.setDate(due.getDate() + 14);

  return {
    id: "",
    businessName: "",
    businessAddress: "",
    businessEmail: "",
    businessPhone: "",
    logo: "",
    clientName: "",
    clientCompany: "",
    clientAddress: "",
    clientEmail: "",
    invoiceNumber: "INV-001",
    issueDate: toDateInputValue(today),
    dueDate: toDateInputValue(due),
    currency: "USD",
    taxRate: 0,
    discount: 0,
    discountType: "fixed",
    shipping: 0,
    deposit: 0,
    previousPayments: 0,
    template: "minimal",
    documentType: "invoice",
    documentPage: "invoice-generator",
    countryName: "",
    countryCode: "",
    locale: "",
    businessRegion: "",
    businessPostalCode: "",
    businessReference: "",
    taxLabel: "Tax",
    taxFree: false,
    designAccent: "template",
    designFont: "template",
    designLogoPosition: "template",
    designTableStyle: "template",
    designFooter: "",
    showPkrEquivalent: false,
    notes: "",
    paymentInstructions: "",
    paymentMethod: "none",
    paymentUrl: "",
    paymentDetails: "",
    items: [{ id: makeId(), description: "", quantity: 1, unitPrice: 0 }],
  };
};

export function toDateInputValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function makeId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function parseInvoiceImport(data) {
  if (data?.schemaVersion !== undefined && data.schemaVersion !== 1) {
    throw new Error("This invoice backup uses an unsupported file version.");
  }

  const entries = Array.isArray(data)
    ? data
    : Array.isArray(data?.invoices)
      ? data.invoices
      : [data?.invoice ?? data];
  if (entries.length > 1000) {
    throw new Error("Choose a backup containing no more than 1,000 invoices.");
  }

  return entries.map((entry) => {
    const source = entry?.invoice ?? entry;
    if (!source || typeof source !== "object" || Array.isArray(source) || !Array.isArray(source.items)) {
      throw new Error("The selected file does not contain valid invoice data.");
    }

    return {
      ...createEmptyInvoice(),
      ...source,
      id: makeId(),
      updatedAt: new Date().toISOString(),
      items: source.items.map((item) => {
        if (!item || typeof item !== "object" || Array.isArray(item)) {
          throw new Error("The selected file contains an invalid line item.");
        }
        return { ...item, id: makeId() };
      }),
    };
  });
}

export function calculateTotals(invoice) {
  const subtotal = invoice.items.reduce(
    (sum, item) => sum + calculateItemTotal(item),
    0,
  );
  const discountAmount = invoice.discountType === "percent"
    ? subtotal * Math.min(100, Math.max(0, Number(invoice.discount) || 0)) / 100
    : Math.min(subtotal, Math.max(0, Number(invoice.discount) || 0));
  const taxableSubtotal = Math.max(0, subtotal - discountAmount);
  const tax = taxableSubtotal * Math.max(0, Number(invoice.taxRate) || 0) / 100;
  const shipping = Math.max(0, Number(invoice.shipping) || 0);
  const deposit = Math.max(0, Number(invoice.deposit) || 0);
  const previousPayments = Math.max(0, Number(invoice.previousPayments) || 0);
  const total = taxableSubtotal + tax + shipping;

  return {
    subtotal,
    discount: discountAmount,
    tax,
    shipping,
    deposit,
    previousPayments,
    total,
    remainingBalance: total - deposit - previousPayments,
  };
}

export function calculateItemTotal(item) {
  return Math.max(0, Number(item.quantity) || 0) * Math.max(0, Number(item.unitPrice) || 0);
}

export function checkInvoiceCalculations(invoice) {
  const totals = calculateTotals(invoice);
  const lineAmounts = invoice.items.map((item) => (
    Math.max(0, Number(item.quantity) || 0) * Math.max(0, Number(item.unitPrice) || 0)
  ));
  const expectedSubtotal = lineAmounts.reduce((sum, amount) => sum + amount, 0);
  const expectedDiscount = invoice.discountType === "percent"
    ? expectedSubtotal * Math.min(100, Math.max(0, Number(invoice.discount) || 0)) / 100
    : Math.min(expectedSubtotal, Math.max(0, Number(invoice.discount) || 0));
  const taxableSubtotal = Math.max(0, expectedSubtotal - expectedDiscount);
  const expectedTax = taxableSubtotal * Math.max(0, Number(invoice.taxRate) || 0) / 100;
  const expectedTotal = taxableSubtotal + expectedTax + Math.max(0, Number(invoice.shipping) || 0);
  const expectedBalance = expectedTotal
    - Math.max(0, Number(invoice.deposit) || 0)
    - Math.max(0, Number(invoice.previousPayments) || 0);
  const matches = (left, right) => Math.round(left * 100) === Math.round(right * 100);

  return [
    {
      id: "calculations",
      label: "Calculations correct",
      passed: lineAmounts.every((amount, index) => matches(amount, calculateItemTotal(invoice.items[index])))
        && matches(expectedSubtotal, totals.subtotal),
    },
    { id: "tax", label: "Tax calculated correctly", passed: matches(expectedTax, totals.tax) },
    { id: "total", label: "Total matches line items", passed: matches(expectedTotal, totals.total) },
    { id: "balance", label: "Balance due calculated correctly", passed: matches(expectedBalance, totals.remainingBalance) },
  ];
}

export function formatMoney(amount, currency = "USD", locale) {
  try {
    return new Intl.NumberFormat(locale || undefined, {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(amount) || 0);
  } catch {
    return `${currency} ${(Number(amount) || 0).toFixed(2)}`;
  }
}

export function formatDate(value, locale) {
  if (!value) return "—";
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat(locale || undefined, { dateStyle: "medium" }).format(date);
}

export function createInvoiceText(invoice) {
  const totals = calculateTotals(invoice);
  const documentLabel = {
    "credit-note": "Credit note",
    "delivery-note": "Delivery note",
    estimate: "Estimate",
    invoice: "Invoice",
    "packing-slip": "Packing slip",
    "payment-receipt": "Payment receipt",
    "purchase-order": "Purchase order",
    proforma: "Proforma invoice",
    quote: "Quote",
    receipt: "Receipt",
    timesheet: "Timesheet",
    bill: "Bill",
  }[invoice.documentType] || "Invoice";
  const lines = [
    `${invoice.businessName || documentLabel} — ${invoice.invoiceNumber || "Draft"}`,
    ...(invoice.businessAddress ? [invoice.businessAddress] : []),
    ...(invoice.countryName ? [`Country context: ${invoice.countryName}`] : []),
    ...(Array.isArray(invoice.countryFields) ? invoice.countryFields : [])
      .filter((field) => typeof field?.label === "string" && field.label.trim() && String(field.value ?? "").trim())
      .map((field) => `${field.label.trim()}: ${String(field.value).trim()}`),
    ...([invoice.businessEmail, invoice.businessPhone].filter(Boolean).length
      ? [[invoice.businessEmail, invoice.businessPhone].filter(Boolean).join(" · ")]
      : []),
    `Bill to: ${invoice.clientName || invoice.clientCompany || "Client"}`,
    ...(invoice.clientCompany && invoice.clientName ? [invoice.clientCompany] : []),
    ...(invoice.clientAddress ? [invoice.clientAddress] : []),
    ...(invoice.clientEmail ? [invoice.clientEmail] : []),
    `${documentLabel} date: ${formatDate(invoice.issueDate, invoice.locale)} · Due date: ${formatDate(invoice.dueDate, invoice.locale)}`,
    "",
    ...invoice.items.map((item) =>
      `${item.description || "Item"}  × ${Math.max(0, Number(item.quantity) || 0)}  @ ${formatMoney(Math.max(0, Number(item.unitPrice) || 0), invoice.currency, invoice.locale)} = ${formatMoney(calculateItemTotal(item), invoice.currency, invoice.locale)}`,
    ),
    "",
    `Subtotal: ${formatMoney(totals.subtotal, invoice.currency, invoice.locale)}`,
    ...(totals.discount ? [`Discount: −${formatMoney(totals.discount, invoice.currency, invoice.locale)}`] : []),
    ...(totals.tax ? [`${invoice.taxLabel || "Tax"}: ${formatMoney(totals.tax, invoice.currency, invoice.locale)}`] : []),
    ...(totals.shipping ? [`Shipping: ${formatMoney(totals.shipping, invoice.currency, invoice.locale)}`] : []),
    `${documentLabel} total: ${formatMoney(totals.total, invoice.currency, invoice.locale)}`,
    ...(totals.deposit ? [`Deposit: −${formatMoney(totals.deposit, invoice.currency, invoice.locale)}`] : []),
    ...(totals.previousPayments ? [`Previous payments: −${formatMoney(totals.previousPayments, invoice.currency, invoice.locale)}`] : []),
    `Balance due: ${formatMoney(totals.remainingBalance, invoice.currency, invoice.locale)}`,
    ...(invoice.notes ? ["", `Notes: ${invoice.notes}`] : []),
    ...(invoice.paymentInstructions ? [`Payment: ${invoice.paymentInstructions}`] : []),
    ...(invoice.paymentUrl ? [`Payment link: ${invoice.paymentUrl}`] : []),
    ...(invoice.paymentDetails ? [`${invoice.paymentMethod === "upi" ? "UPI ID" : invoice.paymentMethod === "wallet" ? "Wallet address" : "Bank transfer details"}: ${invoice.paymentDetails}`] : []),
  ];

  return lines.join("\n");
}

export function loadSavedInvoices() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { invoices: [], error: "" };
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error("Saved invoice data must be a list.");
    return { invoices: parsed, error: "" };
  } catch (error) {
    console.error("Unable to read saved invoices:", error);
    return {
      invoices: [],
      error: "Saved invoices could not be read. You can keep creating invoices, but the saved list may need to be cleared.",
    };
  }
}
