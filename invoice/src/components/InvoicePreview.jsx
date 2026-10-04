import { ArrowDown, ArrowUp, Check, Copy, Download, FileImage, FileText, Printer } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useRef, useState } from "react";
import { fetchPkrExchangeRate } from "../lib/currency.js";
import { calculateItemTotal, calculateTotals, checkInvoiceCalculations, createInvoiceText, formatDate, formatMoney } from "../lib/invoice.js";
import { getInvoiceTemplate, invoiceDesignFonts } from "../lib/templates.js";
import { getDocumentPageBySlug } from "../lib/documentPages.js";

const EXPORT_WIDTH = 440;
const EXPORT_SCALE = 1.75;
const EXPORT_MARGIN_MM = 12;

function AmountRow({ label, amount, currency, locale, subdued = false }) {
  return (
    <div className={`amount-row${subdued ? " subdued" : ""}`}>
      <span>{label}</span>
      <span>{amount < 0 ? `−${formatMoney(Math.abs(amount), currency, locale)}` : formatMoney(amount, currency, locale)}</span>
    </div>
  );
}

export default function InvoicePreview({ documentPage: routeDocumentPage, invoice, onToast, compact = false }) {
  const paperRef = useRef(null);
  const [busy, setBusy] = useState("");
  const [exchange, setExchange] = useState({ status: "idle", rate: 0, updatedAt: "" });
  const totals = calculateTotals(invoice);
  const invoiceChecks = checkInvoiceCalculations(invoice);
  const paymentQr = getPaymentQr(invoice, totals);
  const hasIdentity = invoice.businessName.trim() || invoice.logo;
  const template = getInvoiceTemplate(invoice.template);
  const designFont = invoiceDesignFonts.find((font) => font.id === invoice.designFont)?.family || template.fontFamily;
  const designAccent = invoice.designAccent && /^#[\da-f]{6}$/i.test(invoice.designAccent) ? invoice.designAccent : template.accent;
  const designLogoPosition = ["left", "center", "right"].includes(invoice.designLogoPosition) ? invoice.designLogoPosition : template.logoPosition;
  const designTableStyle = ["clean", "striped", "bordered", "compact"].includes(invoice.designTableStyle) ? invoice.designTableStyle : template.tableStyle;
  const documentPage = getDocumentPageBySlug(invoice.documentPage || routeDocumentPage.slug);
  const documentTitle = documentPage.paperLabel || (documentPage.documentType === "invoice" ? template.invoiceLabel : documentPage.label.toUpperCase());
  const locale = invoice.locale || undefined;

  useEffect(() => {
    if (!invoice.showPkrEquivalent) {
      setExchange({ status: "idle", rate: 0, updatedAt: "" });
      return undefined;
    }
    if (invoice.currency === "PKR") {
      setExchange({ status: "ready", rate: 1, updatedAt: "Same as invoice currency" });
      return undefined;
    }

    const controller = new AbortController();
    setExchange({ status: "loading", rate: 0, updatedAt: "" });
    fetchPkrExchangeRate(invoice.currency, controller.signal)
      .then(({ rate, updatedAt }) => {
        if (!controller.signal.aborted) setExchange({ status: "ready", rate, updatedAt });
      })
      .catch((error) => {
        if (!controller.signal.aborted && error.name !== "AbortError") {
          console.error("Unable to load PKR exchange rate:", error);
          setExchange({ status: "error", rate: 0, updatedAt: "" });
        }
      });

    return () => controller.abort();
  }, [invoice.showPkrEquivalent, invoice.currency]);

  function verifyBeforeExport() {
    if (invoiceChecks.every((check) => check.passed)) return true;
    onToast("The invoice math check found a mismatch. Review the calculations before exporting.", "error");
    return false;
  }

  function printInvoice() {
    if (verifyBeforeExport()) window.print();
  }

  async function renderInvoice() {
    if (!paperRef.current) throw new Error("The invoice preview is not ready yet.");
    const { default: html2canvas } = await import("html2canvas");
    await document.fonts.ready;
    const host = document.createElement("div");
    const paper = paperRef.current.cloneNode(true);
    host.style.cssText = `position:fixed;left:-10000px;top:0;width:${EXPORT_WIDTH * EXPORT_SCALE}px;overflow:visible;background:#fff;`;
    paper.removeAttribute("id");
    paper.style.setProperty("width", `${EXPORT_WIDTH}px`, "important");
    paper.style.setProperty("max-width", "none", "important");
    paper.style.setProperty("min-height", "550px", "important");
    paper.style.setProperty("margin", "0", "important");
    paper.style.setProperty("box-shadow", "none", "important");
    paper.style.setProperty("transform", `scale(${EXPORT_SCALE})`);
    paper.style.setProperty("transform-origin", "top left");
    paper.querySelectorAll(".paper-business strong, .paper-business > span, .paper-client > strong, .paper-client > span:not(.paper-label), .paper-table-row > span:first-child")
      .forEach((element) => {
        element.style.setProperty("overflow", "visible", "important");
        element.style.setProperty("white-space", "normal", "important");
        element.style.setProperty("text-overflow", "clip", "important");
      });
    host.appendChild(paper);
    document.body.appendChild(host);
    host.style.height = `${paper.scrollHeight * EXPORT_SCALE}px`;

    try {
      await Promise.all([...paper.querySelectorAll("img")].map((image) => image.decode()));
      return await html2canvas(host, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
        windowWidth: Math.max(794, window.innerWidth),
      });
    } finally {
      host.remove();
    }
  }

  async function downloadPdf() {
    if (!verifyBeforeExport()) return;
    setBusy("pdf");
    try {
      const canvas = await renderInvoice();
      const { jsPDF } = await import("jspdf");
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const contentWidth = pageWidth - EXPORT_MARGIN_MM * 2;
      const contentHeight = pageHeight - EXPORT_MARGIN_MM * 2;
      const ratio = contentWidth / canvas.width;
      const width = canvas.width * ratio;
      const pageCanvasHeight = Math.floor(contentHeight / ratio);
      const pageCount = Math.ceil(canvas.height / pageCanvasHeight);
      const x = (pageWidth - width) / 2;

      for (let pageIndex = 0; pageIndex < pageCount; pageIndex += 1) {
        const sourceY = pageIndex * pageCanvasHeight;
        const sliceHeight = Math.min(pageCanvasHeight, canvas.height - sourceY);
        const pageCanvas = document.createElement("canvas");
        pageCanvas.width = canvas.width;
        pageCanvas.height = sliceHeight;
        pageCanvas.getContext("2d").drawImage(canvas, 0, sourceY, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight);

        if (pageIndex > 0) pdf.addPage();
        const height = sliceHeight * ratio;
        pdf.addImage(pageCanvas.toDataURL("image/png"), "PNG", x, EXPORT_MARGIN_MM, width, height, undefined, "SLOW");
      }

      pdf.save(`${safeFileName(invoice.invoiceNumber || "invoice")}.pdf`);
      onToast("Your PDF is ready to download.", "success");
    } catch (error) {
      console.error("PDF export failed:", error);
      onToast("We couldn't create the PDF. Try printing and choosing “Save as PDF” instead.", "error");
    } finally {
      setBusy("");
    }
  }

  async function downloadPng() {
    if (!verifyBeforeExport()) return;
    setBusy("png");
    try {
      const canvas = await renderInvoice();
      const blob = await canvasToBlob(canvas);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = `${safeFileName(invoice.invoiceNumber || "invoice")}.png`;
      link.href = url;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      onToast("Your invoice image is ready to download.", "success");
    } catch (error) {
      console.error("PNG export failed:", error);
      onToast("We couldn't create the image. Please try again.", "error");
    } finally {
      setBusy("");
    }
  }

  async function copyInvoice() {
    try {
      await navigator.clipboard.writeText(createInvoiceText(invoice));
      onToast("Invoice details copied to your clipboard.", "success");
    } catch (error) {
      console.error("Invoice copy failed:", error);
      onToast("Clipboard access was blocked. Please allow clipboard access and try again.", "error");
    }
  }

  function downloadJson() {
    if (!verifyBeforeExport()) return;
    try {
      const data = {
        schemaVersion: 1,
        exportedAt: new Date().toISOString(),
        invoice,
        totals,
        checks: invoiceChecks,
      };
      const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `${safeFileName(invoice.invoiceNumber || "invoice")}.json`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      onToast("Invoice data downloaded as JSON.", "success");
    } catch (error) {
      console.error("JSON export failed:", error);
      onToast("We couldn't export the invoice data. Please try again.", "error");
    }
  }

  return (
    <section className={`preview-panel${compact ? " preview-panel-compact" : ""}`} aria-label="Live invoice preview">
      <div className="preview-toolbar">
        <div className="preview-heading">
          <span className="live-indicator" />
          <div>
            <h2>Live preview</h2>
            <p>Updates as you edit</p>
          </div>
        </div>
        <div className="preview-actions">
          <button className="icon-button" onClick={copyInvoice} type="button" title="Copy invoice details" aria-label="Copy invoice details">
            <Copy size={16} />
          </button>
          <button className="icon-button" onClick={printInvoice} type="button" title="Print invoice" aria-label="Print invoice">
            <Printer size={16} />
          </button>
          <ExportMenu busy={busy} onPdf={downloadPdf} onPng={downloadPng} onJson={downloadJson} />
        </div>
      </div>

      <div className="paper-stage">
        <article
          className={`invoice-paper template-${template.id}`}
          data-logo-position={designLogoPosition}
          data-table-style={designTableStyle}
          data-template-style={template.style}
          data-hide-pricing={documentPage.hidePricing ? "true" : "false"}
          id="invoice-paper"
          ref={paperRef}
          aria-label={`Preview of ${documentPage.label.toLowerCase()} ${invoice.invoiceNumber || "draft"}`}
          style={{
            "--template-accent": designAccent,
            "--template-accent-border": colorWithAlpha(designAccent, 0.24),
            "--template-font": designFont,
          }}
        >
          <div className="paper-topline" />
          <div className="paper-content">
            <div className="paper-header">
              <div className="paper-brand">
                {invoice.logo ? (
                  <img className="paper-logo" src={invoice.logo} alt={`${invoice.businessName || "Business"} logo`} />
                ) : (
                  <div className="paper-logo-placeholder">{(invoice.businessName || "B").slice(0, 1).toUpperCase()}</div>
                )}
                <div className="paper-business">
                  <strong>{invoice.businessName || "Your business"}</strong>
                  {invoice.businessAddress && <span>{invoice.businessAddress}</span>}
                  {invoice.businessEmail && <span>{invoice.businessEmail}</span>}
                  {invoice.businessPhone && <span>{invoice.businessPhone}</span>}
                </div>
              </div>
              <div className="paper-title">
                <div><span>{documentTitle}</span><strong>{invoice.invoiceNumber || "INV-001"}</strong></div>
                <div className="paper-issued"><span>{(documentPage.dateLabel || "Issue date").toUpperCase()}</span><strong>{formatDate(invoice.issueDate, locale)}</strong></div>
              </div>
            </div>

            <div className="paper-rule" />

            <div className="paper-meta">
              <div className="paper-client">
                <span className="paper-label">{documentPage.recipientLabel || "BILLED TO"}</span>
                <strong>{invoice.clientName || "Client name"}</strong>
                {invoice.clientCompany && <span>{invoice.clientCompany}</span>}
                {invoice.clientAddress && <span>{invoice.clientAddress}</span>}
                {invoice.clientEmail && <span>{invoice.clientEmail}</span>}
              </div>
              <div className="paper-dates">
                <div><span>{documentPage.dateLabel || "Issue date"}</span><strong>{formatDate(invoice.issueDate, locale)}</strong></div>
                <div><span>{documentPage.dueDateLabel || "Due date"}</span><strong>{formatDate(invoice.dueDate, locale)}</strong></div>
              </div>
            </div>

            {invoice.countryName && (
              <div className="paper-country-details">
                <div><span>COUNTRY CONTEXT</span><strong>{invoice.countryName}</strong></div>
                {(Array.isArray(invoice.countryFields) ? invoice.countryFields : [])
                  .filter((field) => typeof field?.label === "string" && field.label.trim() && String(field.value ?? "").trim())
                  .map((field) => (
                    <div key={field.id}><span>{field.label.trim().toUpperCase()}</span><strong>{String(field.value).trim()}</strong></div>
                  ))}
              </div>
            )}

            {template.style === "international" && (
              <div className="paper-document-details">
                <div><span>DOCUMENT TYPE</span><strong>COMMERCIAL INVOICE</strong></div>
                <div><span>PAYMENT TERMS</span><strong>Due {formatDate(invoice.dueDate, locale)}</strong></div>
                <div><span>TRANSACTION CURRENCY</span><strong>{invoice.currency}</strong></div>
              </div>
            )}
            {template.style === "tax" && (
              <div className="paper-tax-banner">
                <span>OFFICIAL BILLING DOCUMENT</span>
                <strong>TAX INVOICE</strong>
                <small>Invoice reference · {invoice.invoiceNumber || "INV-001"}</small>
              </div>
            )}

            <div className="paper-table">
              <div className="paper-table-head">
                <span>DESCRIPTION</span><span>{documentPage.documentType === "timesheet" ? "HOURS" : "QTY"}</span><span>RATE</span><span>AMOUNT</span>
              </div>
              {invoice.items.map((item) => (
                <div className="paper-table-row" key={item.id}>
                  <span>{item.description || "Item or service"}</span>
                  <span>{Math.max(0, Number(item.quantity) || 0)}</span>
                  <span>{formatMoney(Math.max(0, Number(item.unitPrice) || 0), invoice.currency, locale)}</span>
                  <strong>{formatMoney(calculateItemTotal(item), invoice.currency, locale)}</strong>
                </div>
              ))}
              {invoice.items.length === 0 && <div className="paper-empty-row">Your services and products will appear here.</div>}
            </div>

            <div className="paper-bottom">
              <div className="paper-notes">
                {invoice.notes && <div><span className="paper-label">NOTE</span><p>{invoice.notes}</p></div>}
                {invoice.paymentInstructions && <div><span className="paper-label">{template.paymentLabel}</span><p>{invoice.paymentInstructions}</p></div>}
                {!invoice.notes && !invoice.paymentInstructions && hasIdentity && (
                  <p className="paper-thanks">Thank you for your business.</p>
                )}
              </div>
              <div className="paper-totals">
                {template.style === "retail" && <div className="paper-retail-heading"><span>ORDER SUMMARY</span><strong>{invoice.items.length} {invoice.items.length === 1 ? "item" : "items"}</strong></div>}
                {template.style === "service" && <div className="paper-service-heading">SERVICE SUMMARY</div>}
                <AmountRow label="Subtotal" amount={totals.subtotal} currency={invoice.currency} locale={locale} subdued />
                {totals.discount > 0 && <AmountRow label="Discount" amount={-totals.discount} currency={invoice.currency} locale={locale} subdued />}
                {totals.tax > 0 && <AmountRow label={`${invoice.taxLabel || documentPage.taxLabel || "Tax"} (${Number(invoice.taxRate) || 0}%)`} amount={totals.tax} currency={invoice.currency} locale={locale} subdued />}
                {totals.shipping > 0 && <AmountRow label="Shipping" amount={totals.shipping} currency={invoice.currency} locale={locale} subdued />}
                <div className="paper-total"><span>{documentPage.totalLabel || "Invoice total"}</span><strong>{formatMoney(totals.total, invoice.currency, locale)}</strong></div>
                {totals.deposit > 0 && <AmountRow label="Deposit paid" amount={-totals.deposit} currency={invoice.currency} locale={locale} subdued />}
                {totals.previousPayments > 0 && <AmountRow label="Previous payments" amount={-totals.previousPayments} currency={invoice.currency} locale={locale} subdued />}
                <div className="paper-total balance-total"><span>{documentPage.balanceLabel || "Balance due"}</span><strong>{formatMoney(totals.remainingBalance, invoice.currency, locale)}</strong></div>
                {invoice.showPkrEquivalent && exchange.status === "ready" && (
                  <>
                    <div className="paper-equivalent"><span>Approx. balance in PKR</span><strong>{formatMoney(totals.remainingBalance * exchange.rate, "PKR", locale)}</strong></div>
                    <small className="paper-exchange-source">Indicative rate: 1 {invoice.currency} = {exchange.rate.toLocaleString(locale, { maximumSignificantDigits: 6 })} PKR · {exchange.updatedAt}</small>
                  </>
                )}
              </div>
            </div>

            {paymentQr.value && (
              <div className="paper-payment-qr">
                <QRCodeSVG aria-label="Payment QR code" bgColor="#ffffff" fgColor="#26334d" includeMargin level="M" size={96} value={paymentQr.value} />
                <div>
                  <strong>{invoice.paymentMethod === "bank" ? "SCAN FOR PAYMENT DETAILS" : "SCAN TO PAY"}</strong>
                  <span>{paymentQr.description}</span>
                  {invoice.paymentUrl && <a className="paper-payment-link" href={invoice.paymentUrl} rel="noreferrer" target="_blank">{invoice.paymentUrl}</a>}
                  {invoice.paymentDetails && <span className="paper-payment-details">{invoice.paymentMethod === "upi" ? "UPI ID: " : invoice.paymentMethod === "wallet" ? "Wallet: " : ""}{invoice.paymentDetails}</span>}
                </div>
              </div>
            )}

            <div className="paper-footer">
              <span>{invoice.designFooter?.trim() || template.footer}</span>
              <span>{invoice.businessName || "Your business"}</span>
            </div>
          </div>
        </article>
      </div>
      {invoice.paymentMethod && invoice.paymentMethod !== "none" && !paymentQr.value && (
        <p className="payment-config-note" role="status">{paymentQr.description}</p>
      )}
      {invoice.showPkrEquivalent && exchange.status !== "ready" && (
        <p className={`exchange-rate-note${exchange.status === "error" ? " exchange-rate-error" : ""}`} role={exchange.status === "error" ? "status" : undefined}>
          {exchange.status === "loading" && "Loading approximate PKR exchange rate…"}
          {exchange.status === "error" && "The PKR exchange rate is temporarily unavailable. Your invoice remains in its original currency."}
        </p>
      )}
      {invoice.showPkrEquivalent && exchange.status === "ready" && (
        <p className="exchange-rate-note">Indicative rate: 1 {invoice.currency} = {exchange.rate.toLocaleString(undefined, { maximumSignificantDigits: 6 })} PKR · {exchange.updatedAt}</p>
      )}
      <InvoiceCheck checks={invoiceChecks} />

      <div className="preview-footnote">
        <span className="preview-footnote-icon"><Check size={13} /></span>
        <span>Your invoice is saved only in this browser. Optional rate lookup sends currency codes only.</span>
      </div>
    </section>
  );
}

function getPaymentQr(invoice, totals) {
  const method = invoice.paymentMethod || "none";
  if (method === "none") return { value: "", description: "" };
  if (totals.remainingBalance <= 0) return { value: "", description: "No balance due." };

  if (["url", "paypal", "stripe", "wise", "custom"].includes(method)) {
    try {
      const url = new URL(invoice.paymentUrl);
      if (!["http:", "https:"].includes(url.protocol)) throw new Error("Payment links must use http or https.");
      const labels = { url: "Payment link", paypal: "PayPal", stripe: "Stripe", wise: "Wise", custom: "Custom payment link" };
      return checkedQrValue(url.href, labels[method]);
    } catch {
      return { value: "", description: invoice.paymentUrl ? "Enter a valid http or https payment link." : "Add a payment link to create a QR code." };
    }
  }

  const details = invoice.paymentDetails?.trim();
  if (!details) return { value: "", description: method === "bank" ? "Add bank details to create a QR code." : "Add payment details to create a QR code." };
  if (method === "bank") {
    return checkedQrValue(
      `Bank transfer details\n${details}\nAmount due: ${formatMoney(totals.remainingBalance, invoice.currency, invoice.locale)}`,
      "Bank transfer details",
    );
  }
  if (method === "wallet") return checkedQrValue(details, "Wallet address");
  if (method === "upi") {
    if (invoice.currency !== "INR") return { value: "", description: "UPI QR payments require the invoice currency to be INR." };
    const params = new URLSearchParams({
      pa: details,
      pn: invoice.businessName || "Invoice payment",
      am: Math.max(0, totals.remainingBalance).toFixed(2),
      cu: "INR",
    });
    return checkedQrValue(`upi://pay?${params.toString()}`, "UPI payment");
  }
  return { value: "", description: "" };
}

function checkedQrValue(value, description) {
  if (new TextEncoder().encode(value).length > 2000) {
    return { value: "", description: "Payment details are too long for a QR code. Shorten them and try again." };
  }
  return { value, description };
}

function InvoiceCheck({ checks }) {
  return (
    <section className="invoice-check" aria-labelledby="invoice-check-heading" aria-live="polite">
      <div className="invoice-check-heading">
        <span className="invoice-check-mark"><Check size={13} /></span>
        <h3 id="invoice-check-heading">Invoice Check</h3>
        <span className="invoice-check-status">{checks.every((check) => check.passed) ? "All clear" : "Review needed"}</span>
      </div>
      <ul>
        {checks.map((check) => (
          <li className={check.passed ? "check-passed" : "check-failed"} key={check.id}>
            <span aria-hidden="true">{check.passed ? "✓" : "!"}</span>{check.label}
          </li>
        ))}
      </ul>
    </section>
  );
}

function ExportMenu({ busy, onPdf, onPng, onJson }) {
  const [open, setOpen] = useState(false);
  const buttons = [
    { label: busy === "pdf" ? "Making PDF…" : "Download PDF", icon: FileText, action: onPdf, disabled: Boolean(busy) },
    { label: busy === "png" ? "Making image…" : "Download PNG", icon: FileImage, action: onPng, disabled: Boolean(busy) },
    { label: "Download JSON", icon: Download, action: onJson, disabled: false },
  ];

  return (
    <div className="export-wrap">
      <button className="export-button" onClick={() => setOpen((current) => !current)} type="button" aria-expanded={open}>
        <Download size={15} />
        <span>Export</span>
        {open ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
      </button>
      {open && (
        <>
          <button className="menu-dismiss" type="button" aria-label="Close export menu" onClick={() => setOpen(false)} />
          <div className="export-menu" role="menu">
            {buttons.map(({ label, icon: Icon, action, disabled }) => (
              <button
                className="export-menu-item"
                disabled={disabled}
                key={label}
                onClick={() => { action(); setOpen(false); }}
                role="menuitem"
                type="button"
              >
                <Icon size={15} />{label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function safeFileName(value) {
  return value.replace(/[<>:"/\\|?*\u0000-\u001f]/g, "-").trim() || "invoice";
}

function colorWithAlpha(hex, alpha) {
  const channels = hex.match(/^#([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i);
  if (!channels) return `rgba(23, 23, 23, ${alpha})`;
  return `rgba(${Number.parseInt(channels[1], 16)}, ${Number.parseInt(channels[2], 16)}, ${Number.parseInt(channels[3], 16)}, ${alpha})`;
}

function canvasToBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("The invoice image could not be encoded."));
    }, "image/png");
  });
}
