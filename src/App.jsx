import { useEffect, useState } from "react";
import { Calculator, FileText, Files, LayoutDashboard, Menu, X } from "lucide-react";
import { BrowserRouter, Navigate, NavLink, Route, Routes, useLocation } from "react-router-dom";
import InvoiceBuilder from "./pages/InvoiceBuilder.jsx";
import SavedInvoices from "./pages/SavedInvoices.jsx";
import RateCalculator from "./pages/RateCalculator.jsx";
import DocumentTools from "./pages/DocumentTools.jsx";
import { loadSavedInvoices, makeId, parseInvoiceImport, STORAGE_KEY } from "./lib/invoice.js";
import { documentPages, getDocumentPage } from "./lib/documentPages.js";

const mainNavigation = [
  { to: "/invoice-generator/", label: "New document", Icon: LayoutDashboard, end: true },
  { to: "/invoices", label: "Saved invoices", Icon: FileText },
  { to: "/document-tools/", label: "Document tools", Icon: Files },
  { to: "/hourly-rate-calculator", label: "Rate calculator", Icon: Calculator },
];

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
        <div className="main-shell">
          <RouteMetadata />
          <WorkspaceTopbar savedInvoiceCount={stored.invoices.length} />
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

function WorkspaceTopbar({ savedInvoiceCount }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigationLinks = (onNavigate) => mainNavigation.map(({ to, label, Icon, end }) => (
    <NavLink
      aria-label={label}
      className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
      end={end}
      key={to}
      onClick={onNavigate}
      to={to}
    >
      <Icon aria-hidden="true" size={19} strokeWidth={2} />
      <span>{label}</span>
      {label === "Saved invoices" && savedInvoiceCount > 0 && <span className="nav-count">{savedInvoiceCount}</span>}
    </NavLink>
  ));

  return (
    <header className="topbar">
      <NavLink className="brand-lockup" to="/" aria-label="Invoice Studio home">
        <span className="brand-mark"><FileText size={20} strokeWidth={2.2} /></span>
        <span className="brand-name">invoice<span>studio</span></span>
      </NavLink>
      <nav aria-label="Main navigation" className="primary-nav">
        {navigationLinks()}
      </nav>
      <button
        aria-controls="mobile-primary-navigation"
        aria-expanded={menuOpen}
        aria-label={menuOpen ? "Close navigation" : "Open navigation"}
        className="mobile-nav-toggle"
        onClick={() => setMenuOpen((open) => !open)}
        type="button"
      >
        {menuOpen ? <X size={20} /> : <Menu size={20} />}
      </button>
      <nav aria-label="Mobile main navigation" className="mobile-primary-nav" hidden={!menuOpen} id="mobile-primary-navigation">
        {navigationLinks(() => setMenuOpen(false))}
      </nav>
    </header>
  );
}
