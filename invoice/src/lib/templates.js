export const invoiceTemplates = [
  { id: "minimal", name: "Minimal", description: "Quiet spacing, crisp type", accent: "#171717", style: "minimal", fontFamily: "Arial, sans-serif", logoPosition: "left", tableStyle: "clean", footer: "Thank you for your business.", invoiceLabel: "INVOICE", paymentLabel: "PAYMENT DETAILS" },
  { id: "modern", name: "Modern", description: "Bold masthead, sharp grid", accent: "#181818", style: "modern", fontFamily: "Manrope, sans-serif", logoPosition: "left", tableStyle: "striped", footer: "Made with care. Thank you.", invoiceLabel: "INVOICE", paymentLabel: "PAYMENT" },
  { id: "professional", name: "Professional", description: "Balanced and client-ready", accent: "#111111", style: "professional", fontFamily: "DM Sans, sans-serif", logoPosition: "left", tableStyle: "clean", footer: "We appreciate your business.", invoiceLabel: "INVOICE", paymentLabel: "PAYMENT INFORMATION" },
  { id: "corporate", name: "Corporate", description: "Structured, formal layout", accent: "#0a0a0a", style: "corporate", fontFamily: "Arial, sans-serif", logoPosition: "left", tableStyle: "bordered", footer: "Please remit payment by the due date.", invoiceLabel: "INVOICE", paymentLabel: "REMITTANCE INFORMATION" },
  { id: "freelancer", name: "Freelancer", description: "Personal and approachable", accent: "#202020", style: "freelancer", fontFamily: "DM Sans, sans-serif", logoPosition: "left", tableStyle: "striped", footer: "Thanks for choosing to work with me.", invoiceLabel: "INVOICE", paymentLabel: "HOW TO PAY" },
  { id: "creative", name: "Creative", description: "Expressive editorial layout", accent: "#151515", style: "creative", fontFamily: "Manrope, sans-serif", logoPosition: "right", tableStyle: "clean", footer: "Here’s to making good things together.", invoiceLabel: "INVOICE", paymentLabel: "LET’S MAKE IT HAPPEN" },
  { id: "service", name: "Service", description: "Work-first, easy to scan", accent: "#191919", style: "service", fontFamily: "Arial, sans-serif", logoPosition: "left", tableStyle: "compact", footer: "Thank you for trusting our team.", invoiceLabel: "SERVICE INVOICE", paymentLabel: "PAYMENT & SERVICE NOTES" },
  { id: "consulting", name: "Consulting", description: "Refined, editorial typography", accent: "#171717", style: "consulting", fontFamily: "Georgia, serif", logoPosition: "center", tableStyle: "clean", footer: "We value your partnership.", invoiceLabel: "CONSULTING INVOICE", paymentLabel: "PAYMENT TERMS" },
  { id: "retail", name: "Retail", description: "Itemized, clear totals", accent: "#121212", style: "retail", fontFamily: "Arial, sans-serif", logoPosition: "left", tableStyle: "striped", footer: "Thank you for shopping with us.", invoiceLabel: "INVOICE", paymentLabel: "PAYMENT" },
  { id: "international", name: "International", description: "Clear billing across borders", accent: "#101010", style: "international", fontFamily: "DM Sans, sans-serif", logoPosition: "left", tableStyle: "bordered", footer: "Please include the invoice number with payment.", invoiceLabel: "COMMERCIAL INVOICE", paymentLabel: "INTERNATIONAL PAYMENT DETAILS" },
  { id: "taxInvoice", name: "Tax invoice", description: "Tax-forward, compliance-first", accent: "#090909", style: "tax", fontFamily: "Arial, sans-serif", logoPosition: "left", tableStyle: "bordered", footer: "Keep this document for your records.", invoiceLabel: "TAX INVOICE", paymentLabel: "PAYMENT & TAX DETAILS" },
  { id: "simple", name: "Simple", description: "Straightforward and familiar", accent: "#181818", style: "simple", fontFamily: "Arial, sans-serif", logoPosition: "left", tableStyle: "clean", footer: "Thank you.", invoiceLabel: "INVOICE", paymentLabel: "PAYMENT" },
];

export const invoiceDesignFonts = [
  { id: "template", label: "Template default", family: null },
  { id: "dm-sans", label: "DM Sans", family: "'DM Sans', sans-serif" },
  { id: "arial", label: "Arial", family: "Arial, sans-serif" },
  { id: "georgia", label: "Georgia", family: "Georgia, serif" },
];

export const invoiceLogoPositions = [
  { id: "template", label: "Template default" },
  { id: "left", label: "Left" },
  { id: "center", label: "Centered" },
  { id: "right", label: "Right" },
];

export const invoiceTableStyles = [
  { id: "template", label: "Template default" },
  { id: "clean", label: "Clean lines" },
  { id: "striped", label: "Striped rows" },
  { id: "bordered", label: "Full borders" },
  { id: "compact", label: "Compact rows" },
];

export function getInvoiceTemplate(id) {
  return invoiceTemplates.find((template) => template.id === id) ?? invoiceTemplates[0];
}

export function createDuplicateInvoice(invoice, existingInvoices = [], now = new Date()) {
  const currentNumber = String(invoice.invoiceNumber || "");
  const match = currentNumber.match(/^(.*?)(\d+)$/);
  const prefix = match ? match[1] : `${currentNumber ? `${currentNumber}-` : "INV-"}${now.getFullYear()}-`;
  const width = match ? match[2].length : 3;
  const currentSequence = match ? Number(match[2]) : 0;
  const usedNumbers = new Set(existingInvoices.map((item) => item.invoiceNumber));
  let nextSequence = currentSequence + 1;
  let nextNumber = `${prefix}${String(nextSequence).padStart(width, "0")}`;

  while (usedNumbers.has(nextNumber)) {
    nextSequence += 1;
    nextNumber = `${prefix}${String(nextSequence).padStart(width, "0")}`;
  }

  const issueDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dueDate = new Date(issueDate);
  dueDate.setDate(dueDate.getDate() + 14);

  return {
    ...invoice,
    id: "",
    invoiceNumber: nextNumber,
    issueDate: toDateValue(issueDate),
    dueDate: toDateValue(dueDate),
    items: invoice.items.map((item) => ({ ...item, id: makeLocalId() })),
  };
}

function toDateValue(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function makeLocalId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
