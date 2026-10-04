import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CalendarDays,
  Check,
  ChevronDown,
  CircleDollarSign,
  CopyPlus,
  FileText,
  ImagePlus,
  Paintbrush,
  Plus,
  ReceiptText,
  Trash2,
  Upload,
  UserRound,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import InvoicePreview from "../components/InvoicePreview.jsx";
import TemplatePicker from "../components/TemplatePicker.jsx";
import { getCurrencyOptions } from "../lib/currency.js";
import { createEmptyInvoice, makeId } from "../lib/invoice.js";
import { createDuplicateInvoice, getInvoiceTemplate, invoiceDesignFonts, invoiceLogoPositions, invoiceTableStyles } from "../lib/templates.js";
import { applyDocumentPage, createCountryFields, getDocumentPageBySlug } from "../lib/documentPages.js";

const currencies = getCurrencyOptions();
const paymentMethods = [
  ["none", "No payment QR"],
  ["url", "Payment URL"],
  ["paypal", "PayPal"],
  ["stripe", "Stripe payment link"],
  ["wise", "Wise"],
  ["bank", "Bank transfer details"],
  ["upi", "UPI"],
  ["wallet", "Wallet address"],
  ["custom", "Custom payment URL"],
];

export default function InvoiceBuilder({ documentPage, invoices, onSave, onToast }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(() => applyDocumentPage(createEmptyInvoice(), documentPage));
  const [saved, setSaved] = useState(false);
  const activeDocumentPage = getDocumentPageBySlug(invoice.documentPage || documentPage.slug);
  const selectedTemplate = getInvoiceTemplate(invoice.template);
  const customDesignAccent = /^#[\da-f]{6}$/i.test(invoice.designAccent || "");
  const designFontValue = invoiceDesignFonts.some((font) => font.id === invoice.designFont) ? invoice.designFont : "template";
  const logoPositionValue = invoiceLogoPositions.some((position) => position.id === invoice.designLogoPosition) ? invoice.designLogoPosition : "template";
  const tableStyleValue = invoiceTableStyles.some((style) => style.id === invoice.designTableStyle) ? invoice.designTableStyle : "template";

  useEffect(() => {
    document.title = `${activeDocumentPage.heading} | Invoice Studio`;
    const description = document.querySelector('meta[name="description"]');
    if (description) description.content = activeDocumentPage.description;
    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) canonical.href = new URL(activeDocumentPage.path, window.location.origin).href;
  }, [activeDocumentPage]);

  useEffect(() => {
    if (location.state?.invoice) {
      const defaults = applyDocumentPage(createEmptyInvoice(), documentPage);
      setInvoice({
        ...defaults,
        ...location.state.invoice,
        countryFields: createCountryFields(
          getDocumentPageBySlug(location.state.invoice.documentPage || documentPage.slug),
          location.state.invoice,
        ),
        items: location.state.invoice.items?.length ? location.state.invoice.items : defaults.items,
      });
      setSaved(false);
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [documentPage, location.key, location.pathname, location.state, navigate]);

  function change(field, value) {
    setInvoice((current) => ({ ...current, [field]: value }));
    setSaved(false);
  }

  function changeItem(id, field, value) {
    setInvoice((current) => ({
      ...current,
      items: current.items.map((item) => item.id === id ? { ...item, [field]: value } : item),
    }));
    setSaved(false);
  }

  function addItem() {
    setInvoice((current) => ({
      ...current,
      items: [...current.items, { id: makeId(), description: "", quantity: 1, unitPrice: 0 }],
    }));
    setSaved(false);
  }

  function removeItem(id) {
    setInvoice((current) => ({ ...current, items: current.items.filter((item) => item.id !== id) }));
    setSaved(false);
  }

  function changeCountryField(id, field, value) {
    setInvoice((current) => ({
      ...current,
      countryFields: (current.countryFields || []).map((item) => item.id === id ? { ...item, [field]: value } : item),
    }));
    setSaved(false);
  }

  function addCountryField() {
    const fields = invoice.countryFields || [];
    if (fields.length >= 12) {
      onToast("You can add up to 12 country detail fields.", "error");
      return;
    }
    const field = { id: makeId(), label: "", value: "" };
    setInvoice((current) => ({
      ...current,
      countryFields: [...(current.countryFields || []), field],
    }));
    setSaved(false);
  }

  function removeCountryField(id) {
    setInvoice((current) => ({
      ...current,
      countryFields: (current.countryFields || []).filter((field) => field.id !== id),
    }));
    setSaved(false);
  }

  function handleLogo(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      onToast("Choose an image file to use as your logo.", "error");
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      onToast("Please choose a logo smaller than 3 MB.", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        onToast("We couldn't read that image. Please try another file.", "error");
        return;
      }
      change("logo", reader.result);
    };
    reader.onerror = () => onToast("We couldn't read that image. Please try another file.", "error");
    reader.readAsDataURL(file);
  }

  function saveDraft() {
    const result = onSave(invoice);
    if (result) {
      setInvoice(result);
      setSaved(true);
    }
  }

  function duplicateInvoice() {
    const duplicate = createDuplicateInvoice(invoice, invoices);
    setInvoice(duplicate);
    setSaved(false);
    onToast(`Created ${duplicate.invoiceNumber}. Review it and save when ready.`, "success");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function convertToInvoice() {
    const seed = {
      ...invoice,
      documentType: "invoice",
      documentPage: "invoice-generator",
      invoiceNumber: "INV-000",
      taxLabel: "Tax",
      taxFree: false,
    };
    const converted = createDuplicateInvoice(seed, invoices);
    navigate("/invoice-generator/", { state: { invoice: converted } });
    onToast(`Converted to ${converted.invoiceNumber}. Review it and save when ready.`, "success");
  }

  return (
    <main className="builder-page">
      <div className="page-heading">
        <div className="breadcrumbs"><Link to="/document-tools/">Document tools</Link><span>/</span><strong>{activeDocumentPage.label}</strong></div>
        <div className="page-heading-main">
          <div>
            <h1>{activeDocumentPage.heading}</h1>
            <p>{activeDocumentPage.description}</p>
          </div>
          <div className="heading-actions">
            <Link className="secondary-button saved-link" to="/invoices"><FileText size={16} /><span>Saved invoices</span></Link>
            {invoice.documentType === "quote" && <button className="secondary-button" onClick={convertToInvoice} type="button"><ReceiptText size={15} /><span>Convert to invoice</span></button>}
            {invoice.id && <button aria-label="Duplicate invoice" className="secondary-button duplicate-invoice-button" onClick={duplicateInvoice} type="button"><CopyPlus size={15} /><span>Duplicate invoice</span></button>}
            <button className={`primary-button${saved ? " is-saved" : ""}`} onClick={saveDraft} type="button">
              {saved ? <Check size={16} /> : <ArrowRight size={16} />}
              <span>{saved ? "Draft saved" : "Save draft"}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="workspace-grid">
        <div className="form-column">
          <section className="form-card">
            <SectionHeading icon={Building2} number="01" title="Your business" hint="The details at the top of your document" />
            <div className="business-identity-row">
              <div className="logo-picker-wrap">
                <label className={`logo-picker${invoice.logo ? " has-logo" : ""}`} htmlFor="logo-upload">
                  {invoice.logo ? <img src={invoice.logo} alt="Business logo preview" /> : <ImagePlus size={19} />}
                  <span className="logo-upload-plus"><Plus size={12} /></span>
                </label>
                <input accept="image/*" aria-label="Upload business logo" className="visually-hidden" id="logo-upload" onChange={handleLogo} type="file" />
              </div>
              <div className="business-name-field">
                <FieldLabel htmlFor="businessName">Business name</FieldLabel>
                <input autoComplete="organization" className="input form-input" id="businessName" onChange={(event) => change("businessName", event.target.value)} placeholder="Studio North" value={invoice.businessName} />
              </div>
            </div>
            {invoice.logo && (
              <button className="remove-logo" onClick={() => change("logo", "")} type="button"><Trash2 size={12} />Remove logo</button>
            )}
            <div className="field-grid two">
              <FormField id="businessEmail" label="Email address" onChange={(value) => change("businessEmail", value)} placeholder="hello@yourbusiness.com" type="email" value={invoice.businessEmail} />
              <FormField id="businessPhone" label="Phone number" onChange={(value) => change("businessPhone", value)} placeholder="+1 (555) 000-0000" type="tel" value={invoice.businessPhone} />
            </div>
            <FormField id="businessAddress" label="Business address" onChange={(value) => change("businessAddress", value)} placeholder="Street address, city, country" value={invoice.businessAddress} />
            {activeDocumentPage.countryCode && (
              <div className="country-fields-section">
                <div className="country-fields-heading">
                  <span><strong>Country-specific details</strong><small>Rename these fields or add any local details you need.</small></span>
                </div>
                <div className="country-fields-list">
                  {(invoice.countryFields || []).map((field, index) => (
                    <div className="country-field-row" key={field.id}>
                      <label className="field-label" htmlFor={`country-field-label-${field.id}`}>
                        <span>Detail name</span>
                        <input
                          className="input form-input"
                          id={`country-field-label-${field.id}`}
                          maxLength={50}
                          onChange={(event) => changeCountryField(field.id, "label", event.target.value)}
                          placeholder={`Detail ${index + 1} label`}
                          value={field.label}
                        />
                      </label>
                      <label className="field-label" htmlFor={`country-field-value-${field.id}`}>
                        <span>Value</span>
                        <input
                          className="input form-input"
                          id={`country-field-value-${field.id}`}
                          maxLength={120}
                          onChange={(event) => changeCountryField(field.id, "value", event.target.value)}
                          placeholder={`Enter ${field.label || "a country detail"}`}
                          value={field.value}
                        />
                      </label>
                      <button
                        aria-label={`Remove ${field.label || `country detail ${index + 1}`}`}
                        className="item-remove country-field-remove"
                        onClick={() => removeCountryField(field.id)}
                        title="Remove country detail"
                        type="button"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
                <button className="add-item-button country-field-add" disabled={(invoice.countryFields || []).length >= 12} onClick={addCountryField} type="button">
                  <Plus size={15} />Add a country detail
                </button>
              </div>
            )}
          </section>

          <section className="form-card">
            <SectionHeading icon={UserRound} number="02" title={activeDocumentPage.recipientLabel === "SUPPLIER" ? "Supplier details" : "Client details"} hint="Who is receiving this document?" />
            <div className="field-grid two">
              <FormField id="clientName" label="Contact name" onChange={(value) => change("clientName", value)} placeholder="Alex Morgan" value={invoice.clientName} />
              <FormField id="clientCompany" label={activeDocumentPage.recipientLabel === "SUPPLIER" ? "Supplier company" : "Company"} onChange={(value) => change("clientCompany", value)} placeholder="Acme Co." value={invoice.clientCompany} />
            </div>
            <FormField id="clientEmail" label={activeDocumentPage.recipientLabel === "SUPPLIER" ? "Supplier email" : "Client email"} onChange={(value) => change("clientEmail", value)} placeholder="alex@company.com" type="email" value={invoice.clientEmail} />
            <FormField id="clientAddress" label={activeDocumentPage.hidePricing ? "Delivery address" : activeDocumentPage.recipientLabel === "SUPPLIER" ? "Supplier address" : "Billing address"} onChange={(value) => change("clientAddress", value)} placeholder="Street address, city, country" value={invoice.clientAddress} />
          </section>

          <section className="form-card">
            <SectionHeading icon={CalendarDays} number="03" title={`${activeDocumentPage.label} details`} hint="Set the reference, dates, currency, and applicable charges" />
            <div className="field-grid two">
              <FormField id="invoiceNumber" label={activeDocumentPage.numberLabel || `${activeDocumentPage.label} number`} onChange={(value) => change("invoiceNumber", value)} placeholder="INV-001" value={invoice.invoiceNumber} />
              <label className="field-label" htmlFor="currency">
                <span>Currency</span>
                <span className="select-wrap">
                  <select className="select form-input" id="currency" onChange={(event) => change("currency", event.target.value)} value={invoice.currency}>
                    {currencies.map(({ code, label }) => <option key={code} value={code}>{label}</option>)}
                  </select>
                  <ChevronDown size={14} />
                </span>
              </label>
              <label className="currency-conversion-toggle" htmlFor="showPkrEquivalent">
                <input checked={Boolean(invoice.showPkrEquivalent)} id="showPkrEquivalent" onChange={(event) => change("showPkrEquivalent", event.target.checked)} type="checkbox" />
                <span><strong>Show approximate PKR equivalent</strong><small>Displays the remaining balance in PKR; invoice currency stays {invoice.currency}.</small></span>
              </label>
              <FormField id="issueDate" label={activeDocumentPage.dateLabel || "Issue date"} onChange={(value) => change("issueDate", value)} type="date" value={invoice.issueDate} />
              <FormField id="dueDate" label={activeDocumentPage.dueDateLabel || "Due date"} onChange={(value) => change("dueDate", value)} type="date" value={invoice.dueDate} />
            </div>
            {activeDocumentPage.countryCode && (
              <div className="country-mode-note"><strong>{activeDocumentPage.countryName} starting format</strong><span>Preview dates and currency use {activeDocumentPage.locale}. The tax rate is blank-by-default; enter what applies to your transaction.</span></div>
            )}
          </section>

          <section className="form-card template-card">
            <SectionHeading icon={Paintbrush} number="04" title="Choose a template" hint="Switch the visual style without changing invoice values" />
            <TemplatePicker onChange={(value) => change("template", value)} selected={invoice.template || "minimal"} />
            <div className="design-controls">
              <div className="design-controls-heading">
                <strong>Customize design</strong>
                <span>Fine-tune this invoice without changing its layout.</span>
              </div>
              <label className="field-label design-color-field" htmlFor="designAccent">
                <span>Accent color</span>
                <span className="design-color-control">
                  <input
                    aria-label="Choose invoice accent color"
                    id="designAccent"
                    onChange={(event) => change("designAccent", event.target.value)}
                    type="color"
                    value={customDesignAccent ? invoice.designAccent : selectedTemplate.accent}
                  />
                  <span>{customDesignAccent ? invoice.designAccent.toUpperCase() : "Template color"}</span>
                  {customDesignAccent && (
                    <button className="design-reset-button" onClick={() => change("designAccent", "template")} type="button">Reset</button>
                  )}
                </span>
              </label>
              <div className="field-grid two design-control-grid">
                <label className="field-label" htmlFor="designFont">
                  <span>Invoice font</span>
                  <select className="select form-input" id="designFont" onChange={(event) => change("designFont", event.target.value)} value={designFontValue}>
                    {invoiceDesignFonts.map((font) => <option key={font.id} value={font.id}>{font.label}</option>)}
                  </select>
                </label>
                <label className="field-label" htmlFor="designLogoPosition">
                  <span>Logo alignment</span>
                  <select className="select form-input" id="designLogoPosition" onChange={(event) => change("designLogoPosition", event.target.value)} value={logoPositionValue}>
                    {invoiceLogoPositions.map((position) => <option key={position.id} value={position.id}>{position.label}</option>)}
                  </select>
                </label>
                <label className="field-label" htmlFor="designTableStyle">
                  <span>Line item table</span>
                  <select className="select form-input" id="designTableStyle" onChange={(event) => change("designTableStyle", event.target.value)} value={tableStyleValue}>
                    {invoiceTableStyles.map((style) => <option key={style.id} value={style.id}>{style.label}</option>)}
                  </select>
                </label>
                <FormField id="designFooter" label="Footer text" maxLength={140} onChange={(value) => change("designFooter", value)} placeholder={selectedTemplate.footer} value={invoice.designFooter || ""} />
              </div>
              <p className="design-help">Leave an option on “Template default” to use this template’s original styling.</p>
            </div>
          </section>

          <section className="form-card items-card">
            <SectionHeading icon={ReceiptText} number="05" title="Line items" hint="Add everything you’re billing for" />
            <div className="items-label-row">
              <span>DESCRIPTION</span><span>QTY</span><span>RATE</span><span aria-hidden="true" />
            </div>
            <div className="invoice-items">
              {invoice.items.map((item, index) => (
                <div className="item-input-row" key={item.id}>
                  <label className="visually-hidden" htmlFor={`item-description-${item.id}`}>Item {index + 1} description</label>
                  <input className="input form-input item-description" id={`item-description-${item.id}`} onChange={(event) => changeItem(item.id, "description", event.target.value)} placeholder="e.g. Brand design" value={item.description} />
                  <label className="visually-hidden" htmlFor={`item-quantity-${item.id}`}>Quantity for item {index + 1}</label>
                  <input className="input form-input item-quantity" id={`item-quantity-${item.id}`} min="0" onChange={(event) => changeItem(item.id, "quantity", event.target.value)} placeholder="1" type="number" value={item.quantity} />
                  <label className="visually-hidden" htmlFor={`item-price-${item.id}`}>Unit price for item {index + 1}</label>
                  <input className="input form-input item-price" id={`item-price-${item.id}`} min="0" onChange={(event) => changeItem(item.id, "unitPrice", event.target.value)} placeholder="0.00" step="0.01" type="number" value={item.unitPrice} />
                  <button aria-label={`Remove item ${index + 1}`} className="item-remove" disabled={invoice.items.length === 1} onClick={() => removeItem(item.id)} type="button"><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
            <button className="add-item-button" onClick={addItem} type="button"><Plus size={15} />Add a line item</button>

            {!activeDocumentPage.hidePricing && (
              <>
                <div className="adjustments-divider" />
                <div className="field-grid two">
                  {!activeDocumentPage.taxFree && (
                  <label className="field-label" htmlFor="taxRate">
                    <span>{activeDocumentPage.taxLabel || "Tax"} rate</span>
                    <span className="input-with-suffix"><input className="input form-input" id="taxRate" min="0" onChange={(event) => change("taxRate", event.target.value)} placeholder="0" step="0.01" type="number" value={invoice.taxRate} /><span>%</span></span>
                  </label>
                  )}
                  <label className="field-label" htmlFor="discount">
                    <span>Discount</span>
                    <span className="input-with-suffix discount-input">
                      <input className="input form-input" id="discount" min="0" onChange={(event) => change("discount", event.target.value)} placeholder="0" step="0.01" type="number" value={invoice.discount} />
                      <select aria-label="Discount type" className="discount-type" onChange={(event) => change("discountType", event.target.value)} value={invoice.discountType}>
                        <option value="fixed">{invoice.currency}</option><option value="percent">%</option>
                      </select>
                    </span>
                  </label>
                  <label className="field-label" htmlFor="shipping">
                    <span>Shipping</span>
                    <span className="input-with-prefix"><span>{currencySymbol(invoice.currency)}</span><input className="input form-input" id="shipping" min="0" onChange={(event) => change("shipping", event.target.value)} placeholder="0.00" step="0.01" type="number" value={invoice.shipping} /></span>
                  </label>
                  <label className="field-label" htmlFor="deposit">
                    <span>Deposit paid</span>
                    <span className="input-with-prefix"><span>{currencySymbol(invoice.currency)}</span><input className="input form-input" id="deposit" min="0" onChange={(event) => change("deposit", event.target.value)} placeholder="0.00" step="0.01" type="number" value={invoice.deposit ?? 0} /></span>
                  </label>
                  <label className="field-label" htmlFor="previousPayments">
                    <span>Previous payments</span>
                    <span className="input-with-prefix"><span>{currencySymbol(invoice.currency)}</span><input className="input form-input" id="previousPayments" min="0" onChange={(event) => change("previousPayments", event.target.value)} placeholder="0.00" step="0.01" type="number" value={invoice.previousPayments ?? 0} /></span>
                  </label>
                </div>
              </>
            )}
          </section>

          <section className="form-card">
            <SectionHeading icon={CircleDollarSign} number="06" title={activeDocumentPage.hidePricing ? "Delivery notes" : "Notes & payment"} hint={activeDocumentPage.hidePricing ? "Add handling or delivery instructions" : "Share payment details or add a payment QR code"} />
            <FormField id="notes" label={activeDocumentPage.hidePricing ? "Note for recipient" : "Note to your client"} onChange={(value) => change("notes", value)} placeholder={activeDocumentPage.hidePricing ? "Handling instructions or items included" : "Thanks for your business!"} textarea value={invoice.notes} />
            {!activeDocumentPage.hidePricing && (
              <>
                <FormField id="paymentInstructions" label="Payment instructions" onChange={(value) => change("paymentInstructions", value)} placeholder="Bank transfer to account ..." textarea value={invoice.paymentInstructions} />
                <label className="field-label" htmlFor="paymentMethod">
                  <span>Payment method for QR code</span>
                  <span className="select-wrap">
                    <select className="select form-input" id="paymentMethod" onChange={(event) => change("paymentMethod", event.target.value)} value={invoice.paymentMethod || "none"}>
                      {paymentMethods.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </select>
                    <ChevronDown size={14} />
                  </span>
                </label>
                {["url", "paypal", "stripe", "wise", "custom"].includes(invoice.paymentMethod) && (
                  <FormField
                    id="paymentUrl"
                    label={invoice.paymentMethod === "url" || invoice.paymentMethod === "custom" ? "Payment URL" : `${paymentMethods.find(([value]) => value === invoice.paymentMethod)?.[1]} URL`}
                    onChange={(value) => change("paymentUrl", value)}
                    placeholder="https://"
                    maxLength={1500}
                    type="url"
                    value={invoice.paymentUrl || ""}
                  />
                )}
                {["bank", "upi", "wallet"].includes(invoice.paymentMethod) && (
                  <FormField
                    id="paymentDetails"
                    label={invoice.paymentMethod === "bank" ? "Bank transfer details" : invoice.paymentMethod === "upi" ? "UPI ID" : "Wallet address"}
                    onChange={(value) => change("paymentDetails", value)}
                    maxLength={800}
                    placeholder={invoice.paymentMethod === "bank" ? "Bank, account name, account number, routing details" : invoice.paymentMethod === "upi" ? "name@bank" : "Wallet address"}
                    textarea={invoice.paymentMethod === "bank"}
                    value={invoice.paymentDetails || ""}
                  />
                )}
                <p className="payment-privacy-note">QR codes and PDF files are generated in your browser. The optional PKR lookup sends currency codes only to the rate service.</p>
              </>
            )}
          </section>

          {activeDocumentPage.taxFree && <p className="document-legal-note">This tool does not determine tax exemption or legal status. Confirm your obligations with the relevant tax authority.</p>}
          {(activeDocumentPage.countryCode || (activeDocumentPage.taxLabel && activeDocumentPage.taxLabel !== "Tax")) && !activeDocumentPage.taxFree && (
            <p className="document-legal-note">Tax labels and fields are general tools only, not legal or tax advice. Requirements vary by location and transaction; verify applicable rules with an authoritative local source.</p>
          )}
          <div className="form-footer-note"><Upload size={13} /><span>Your invoice details stay on your device. PDF and payment QR codes are generated locally.</span></div>
        </div>

        <InvoicePreview documentPage={activeDocumentPage} invoice={invoice} onToast={onToast} />
      </div>

      <div className="mobile-preview-link">
        <a href="#invoice-paper"><ArrowLeft size={15} />Jump to live preview</a>
      </div>
    </main>
  );
}

function SectionHeading({ icon: Icon, number, title, hint }) {
  return (
    <div className="section-heading">
      <span className="section-icon"><Icon size={17} strokeWidth={1.8} /></span>
      <div className="section-heading-copy"><div className="section-title-row"><h2>{title}</h2><span className="section-number">{number}</span></div><p>{hint}</p></div>
    </div>
  );
}

function FieldLabel({ htmlFor, children }) {
  return <label className="field-label" htmlFor={htmlFor}><span>{children}</span></label>;
}

function FormField({ id, label, maxLength, onChange, placeholder, type = "text", value, textarea = false }) {
  return (
    <label className="field-label" htmlFor={id}>
      <span>{label}</span>
      {textarea
        ? <textarea className="textarea form-input form-textarea" id={id} maxLength={maxLength} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} rows="2" value={value} />
        : <input className="input form-input" id={id} maxLength={maxLength} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} type={type} value={value} />}
    </label>
  );
}

function currencySymbol(currency) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 0 }).formatToParts(0).find((part) => part.type === "currency")?.value ?? currency;
}
