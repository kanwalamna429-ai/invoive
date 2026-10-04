import { useEffect, useState } from "react";
import { BadgeHelp, Calculator, FileText, Files, LayoutDashboard, Menu, Settings2, Sparkles, X } from "lucide-react";
import { BrowserRouter, Navigate, NavLink, Route, Routes, useLocation } from "react-router-dom";
import InvoiceBuilder from "./pages/InvoiceBuilder.jsx";
import SavedInvoices from "./pages/SavedInvoices.jsx";
import RateCalculator from "./pages/RateCalculator.jsx";
import DocumentTools from "./pages/DocumentTools.jsx";
import { loadSavedInvoices, makeId, parseInvoiceImport, STORAGE_KEY } from "./lib/invoice.js";
import { documentPages, getDocumentPage } from "./lib/documentPages.js";

export default function App() {
  const [stored, setStored] = useState(loadSavedInvoices);
  const [toast, setToast] = useState(stored.error ? { message: stored.error, kind: "error" } : null);

  useEffect(() => {
    if (!toast) return undefined;
    const timeout = window.setTimeout(() => setToast(null), toast.kind === "error" ? 6000 : 3200);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  function showToast(message, kind = "success") {
    setToast({ message, kind });
  }

  function saveInvoice(invoice) {
    const saved = {
      ...invoice,
      id: invoice.id || makeId(),
      updatedAt: new Date().toISOString(),
    };
    const next = stored.invoices.some((item) => item.id === saved.id)
      ? stored.invoices.map((item) => item.id === saved.id ? saved : item)
      : [saved, ...stored.invoices];
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setStored({ invoices: next, error: "" });
      showToast("Your invoice draft is saved on this device.", "success");
      return saved;
    } catch (error) {
      console.error("Unable to save invoice:", error);
      showToast("We couldn't save this draft. Your browser storage may be full or unavailable.", "error");
      return null;
    }
  }

  function deleteInvoice(id) {
    const next = stored.invoices.filter((invoice) => invoice.id !== id);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setStored({ invoices: next, error: "" });
      showToast("Invoice removed from saved drafts.", "success");
    } catch (error) {
      console.error("Unable to delete invoice:", error);
      showToast("We couldn't remove this invoice from browser storage.", "error");
    }
  }

  function importInvoices(data) {
    try {
      const imported = parseInvoiceImport(data);
      const next = [...imported, ...stored.invoices];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setStored({ invoices: next, error: "" });
      showToast(`${imported.length} ${imported.length === 1 ? "invoice" : "invoices"} imported to this device.`, "success");
      return true;
    } catch (error) {
      console.error("Unable to import invoice backup:", error);
      showToast(error instanceof Error ? error.message : "We couldn't import that invoice backup.", "error");
      return false;
    }
  }

  function clearLocalInvoices() {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setStored({ invoices: [], error: "" });
      showToast("Saved invoice data was removed from this browser.", "success");
      return true;
    } catch (error) {
      console.error("Unable to delete local invoice data:", error);
      showToast("We couldn't delete saved invoices from this browser.", "error");
      return false;
    }
  }

  return (
    <BrowserRouter>
      <div className="app-shell">
        <aside className="sidebar">
          <NavLink className="brand-lockup" to="/" aria-label="Invoice Studio home">
            <span className="brand-mark"><FileText size={19} strokeWidth={2.2} /></span>
            <span className="brand-name">invoice<span>studio</span></span>
          </NavLink>

          <div className="sidebar-workspace">
            <span className="workspace-avatar">S</span>
            <span className="workspace-copy"><strong>My workspace</strong><small>Saved on this device</small></span>
            <span className="workspace-menu-dots">···</span>
          </div>

          <span className="nav-caption">WORKSPACE</span>
          <nav className="sidebar-nav" aria-label="Main navigation">
            <NavLink aria-label="New document" className={({ isActive }) => `nav-link${isActive ? " active" : ""}`} end to="/invoice-generator/">
            <LayoutDashboard size={17} /><span>New document</span>
            </NavLink>
            <NavLink aria-label="Saved invoices" className={({ isActive }) => `nav-link${isActive ? " active" : ""}`} to="/invoices">
              <FileText size={17} /><span>Saved invoices</span>{stored.invoices.length > 0 && <span className="nav-count">{stored.invoices.length}</span>}
            </NavLink>
            <NavLink aria-label="Document tools" className={({ isActive }) => `nav-link${isActive ? " active" : ""}`} to="/document-tools/">
              <Files size={17} /><span>Document tools</span>
            </NavLink>
            <NavLink aria-label="Hourly rate calculator" className={({ isActive }) => `nav-link${isActive ? " active" : ""}`} title="Hourly rate calculator" to="/hourly-rate-calculator">
              <Calculator size={17} /><span>Rate calculator</span>
            </NavLink>
          </nav>

          <div className="sidebar-bottom">
            <div className="sidebar-prompt"><span className="prompt-icon"><Sparkles size={14} /></span><strong>Your documents stay on your device.</strong><p>No account, no uploads. Your drafts stay in this browser.</p></div>
            <button aria-label="Privacy and how it works" className="sidebar-help" onClick={() => showToast("Invoice data and files stay on this device. The optional PKR estimate sends currency codes only to the exchange-rate service.", "success")} type="button"><BadgeHelp size={16} /><span>Privacy & how it works</span></button>
            <div className="sidebar-profile"><span className="profile-avatar">Y</span><span className="profile-copy"><strong>Your workspace</strong><small>Free · no sign-up</small></span><Settings2 size={16} /></div>
          </div>
        </aside>

        <div className="main-shell">
          <RouteMetadata />
          <WorkspaceTopbar />
          <Routes>
            <Route element={<Navigate replace to="/invoice-generator/" />} path="/" />
            <Route element={<Navigate replace to="/invoice-generator/" />} path="/invoice-generator" />
            {documentPages.map((page) => (
              <Route
                element={<InvoiceBuilder documentPage={page} invoices={stored.invoices} key={page.slug} onSave={saveInvoice} onToast={showToast} />}
                key={page.slug}
                path={page.path}
              />
            ))}
            <Route element={<DocumentTools />} path="/document-tools/" />
            <Route element={<SavedInvoices invoices={stored.invoices} onClear={clearLocalInvoices} onDelete={deleteInvoice} onImport={importInvoices} onToast={showToast} />} path="/invoices" />
            <Route element={<RateCalculator />} path="/hourly-rate-calculator" />
            <Route element={<Navigate replace to="/invoice-generator/" />} path="*" />
          </Routes>
        </div>
        {toast && <div className={`toast-message ${toast.kind === "error" ? "toast-error" : ""}`} role={toast.kind === "error" ? "alert" : "status"}>{toast.kind !== "error" && <span className="toast-check">✓</span>}{toast.message}</div>}
      </div>
    </BrowserRouter>
  );
}

function RouteMetadata() {
  const { pathname } = useLocation();
  const normalizedPath = pathname.endsWith("/") ? pathname : `${pathname}/`;
  const documentPage = getDocumentPage(normalizedPath);
  const metadata = normalizedPath === "/hourly-rate-calculator/"
    ? {
      title: "How Much Should I Invoice? Hourly Rate Calculator | Invoice Studio",
      description: "Calculate the hourly rate and project price you need based on your income goal, business expenses, taxes, billable hours, and profit margin.",
      path: "/hourly-rate-calculator",
    }
    : normalizedPath === "/document-tools/"
      ? {
        title: "Free Business Document Generators | Invoice Studio",
        description: "Create invoices, quotes, estimates, receipts, purchase orders, timesheets, delivery notes, and country-specific invoice drafts. Private and free.",
        path: "/document-tools/",
      }
      : normalizedPath === "/invoices/"
        ? {
          title: "Saved Documents | Invoice Studio",
          description: "Open, duplicate, export, or remove business document drafts saved in this browser.",
          path: "/invoices",
        }
        : {
          title: `${documentPage.heading} | Invoice Studio`,
          description: documentPage.description,
          path: documentPage.path,
        };

  useEffect(() => {
    document.title = metadata.title;
    const description = document.querySelector('meta[name="description"]');
    if (description) description.content = metadata.description;
    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) canonical.href = new URL(metadata.path, window.location.origin).href;
  }, [metadata.description, metadata.path, metadata.title]);

  return null;
}

function WorkspaceTopbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();
  const section = pathname === "/hourly-rate-calculator"
    ? "Rate calculator"
    : pathname === "/invoices"
      ? "Saved invoices"
      : pathname === "/document-tools/"
        ? "Document tools"
        : getDocumentPage(pathname).heading;

  return (
    <header className="topbar">
      <div className="mobile-brand"><span className="brand-mark"><FileText size={17} strokeWidth={2.2} /></span><span className="brand-name">invoice<span>studio</span></span></div>
      <div className="topbar-location"><span className="topbar-breadcrumb-muted">My workspace</span><span>/</span><strong>{section}</strong></div>
      <div className="topbar-right">
        <span className="privacy-status"><span />Private on this device</span>
        <span className="topbar-divider" />
        <span className="topbar-initial" aria-hidden="true">Y</span>
        <button
          aria-controls="mobile-primary-navigation"
          aria-expanded={menuOpen}
          aria-label={menuOpen ? "Close navigation" : "Open navigation"}
          className="mobile-nav-toggle"
          onClick={() => setMenuOpen((open) => !open)}
          type="button"
        >
          {menuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>
      <nav aria-label="Mobile navigation" className="mobile-primary-nav" hidden={!menuOpen} id="mobile-primary-navigation">
        <NavLink aria-label="New document" onClick={() => setMenuOpen(false)} to="/invoice-generator/">New document</NavLink>
        <NavLink aria-label="Saved invoices" onClick={() => setMenuOpen(false)} to="/invoices">Saved invoices</NavLink>
        <NavLink aria-label="Document tools" onClick={() => setMenuOpen(false)} to="/document-tools/">Document tools</NavLink>
        <NavLink aria-label="Hourly rate calculator" onClick={() => setMenuOpen(false)} to="/hourly-rate-calculator">Rate calculator</NavLink>
      </nav>
    </header>
  );
}
