import { useRef } from "react";
import { ArrowDownRight, ArrowUpRight, Copy, CopyPlus, Download, FileText, Plus, ReceiptText, ShieldCheck, Trash2, Upload } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { calculateTotals, createInvoiceText, formatDate, formatMoney } from "../lib/invoice.js";
import { createDuplicateInvoice } from "../lib/templates.js";
import { getDocumentPageBySlug } from "../lib/documentPages.js";

export default function SavedInvoices({ invoices, onClear, onDelete, onImport, onToast }) {
  const navigate = useNavigate();
  const importInput = useRef(null);

  async function importBackup(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      onToast("Choose an invoice backup smaller than 10 MB.", "error");
      return;
    }

    try {
      onImport(JSON.parse(await file.text()));
    } catch (error) {
      console.error("Unable to read invoice backup:", error);
      onToast("That file isn't valid invoice JSON. Choose an Invoice Studio backup and try again.", "error");
    }
  }

  function exportBackup() {
    try {
      const backup = {
        schemaVersion: 1,
        exportedAt: new Date().toISOString(),
        invoices,
      };
      const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `invoice-studio-backup-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      onToast("Your invoice backup was downloaded on this device.", "success");
    } catch (error) {
      console.error("Unable to export invoice backup:", error);
      onToast("We couldn't export the invoice backup. Please try again.", "error");
    }
  }

  function clearInvoices() {
    if (!window.confirm("Delete all saved invoice data from this browser? This cannot be undone. Export a backup first if you may need these invoices later.")) return;
    onClear();
  }

  async function copyInvoice(invoice) {
    try {
      await navigator.clipboard.writeText(createInvoiceText(invoice));
      onToast("Invoice details copied to your clipboard.", "success");
    } catch (error) {
      console.error("Invoice copy failed:", error);
      onToast("Clipboard access was blocked. Please allow clipboard access and try again.", "error");
    }
  }

  return (
    <main className="saved-page">
      <div className="page-heading">
        <div className="breadcrumbs"><span>Workspace</span><span>/</span><strong>Saved invoices</strong></div>
        <div className="page-heading-main">
          <div><h1>Your documents</h1><p>Your drafts, right here on this device.</p></div>
          <Link className="primary-button" to="/document-tools/"><Plus size={16} /><span>Create a document</span></Link>
        </div>
      </div>

      <section className="local-data-card" aria-label="Local invoice data controls">
        <div className="local-data-copy">
          <span className="local-data-icon"><ShieldCheck size={17} /></span>
          <span><strong>Your invoice stays on your device.</strong><small>Drafts are stored in this browser. PDF and QR files are generated locally.</small></span>
        </div>
        <div className="local-data-actions">
          <button className="secondary-button" onClick={exportBackup} type="button"><Download size={14} />Export backup</button>
          <button className="secondary-button" onClick={() => importInput.current?.click()} type="button"><Upload size={14} />Import JSON</button>
          <input accept=".json,application/json" className="visually-hidden" onChange={importBackup} ref={importInput} type="file" />
          <button className="secondary-button delete-local-data" disabled={invoices.length === 0} onClick={clearInvoices} type="button"><Trash2 size={14} />Delete local data</button>
        </div>
      </section>

      {invoices.length === 0 ? (
        <section className="empty-invoices">
          <div className="empty-art"><div className="empty-art-sheet"><ReceiptText size={27} /></div><span className="empty-art-spark">✳</span><span className="empty-art-dot" /></div>
          <h2>A fresh page</h2>
          <p>Invoices you save will show up here, ready whenever you need them.</p>
          <Link className="primary-button" to="/invoice-generator/"><Plus size={16} />Create your first invoice</Link>
          <span className="empty-privacy">No account. No cloud. Just you and your browser.</span>
        </section>
      ) : (
        <section className="saved-card">
          <div className="saved-card-top"><div><h2>Saved drafts</h2><p>{invoices.length} {invoices.length === 1 ? "document" : "documents"} stored on this device</p></div><span className="saved-count">{String(invoices.length).padStart(2, "0")}</span></div>
          <div className="saved-list">
            {invoices.slice().sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).map((invoice) => {
              const totals = calculateTotals(invoice);
              return (
                <article className="saved-invoice-row" key={invoice.id}>
                  <div className="saved-invoice-icon"><FileText size={18} /></div>
                  <div className="saved-invoice-details">
                    <strong>{invoice.invoiceNumber || `Untitled ${getDocumentPageBySlug(invoice.documentPage).label.toLowerCase()}`}</strong>
                    <span>{getDocumentPageBySlug(invoice.documentPage).label} <span className="row-dot">·</span> {invoice.clientName || invoice.clientCompany || "No recipient"} <span className="row-dot">·</span> Updated {formatDate(invoice.updatedAt?.slice(0, 10))}</span>
                  </div>
                  <div className="saved-invoice-total"><span>Total</span><strong>{formatMoney(totals.total, invoice.currency, invoice.locale)}</strong></div>
                  <div className="saved-invoice-actions">
                    <button aria-label={`Copy ${invoice.invoiceNumber || "invoice"} details`} className="icon-button" onClick={() => copyInvoice(invoice)} title="Copy document details" type="button"><Copy size={15} /></button>
                    <button aria-label={`Duplicate ${invoice.invoiceNumber || "invoice"}`} className="icon-button duplicate-invoice-row" onClick={() => navigate("/invoice-generator/", { state: { invoice: createDuplicateInvoice(invoice, invoices) } })} title={`Duplicate ${invoice.invoiceNumber || "invoice"}`} type="button"><CopyPlus size={15} /></button>
                    <button aria-label={`Delete ${invoice.invoiceNumber || "invoice"}`} className="icon-button danger-icon" onClick={() => onDelete(invoice.id)} title="Delete invoice" type="button"><Trash2 size={15} /></button>
                    <button className="edit-invoice-button" onClick={() => navigate("/invoice-generator/", { state: { invoice } })} type="button">Open <ArrowUpRight size={14} /></button>
                  </div>
                </article>
              );
            })}
          </div>
          <p className="saved-storage-note"><span />Saved privately in your browser. These drafts aren’t uploaded anywhere.</p>
        </section>
      )}

      {invoices.length > 0 && (
        <div className="saved-tip"><span><ArrowDownRight size={15} /></span><p>Pick up where you left off. Open any document to edit its details, then save your changes.</p></div>
      )}
    </main>
  );
}
