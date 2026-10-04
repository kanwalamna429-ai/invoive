import { ArrowRight, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import { documentToolGroups } from "../lib/documentPages.js";

export default function DocumentTools() {
  return (
    <main className="tools-page">
      <div className="breadcrumbs"><span>Workspace</span><span>/</span><strong>Document tools</strong></div>
      <div className="page-heading tools-page-heading">
        <div>
          <span className="tools-eyebrow"><FileText size={14} /> FREE BUSINESS DOCUMENT TOOLS</span>
          <h1>Business documents, made simple</h1>
          <p>Create and customize business documents in your browser. Drafts stay on this device.</p>
        </div>
        <Link className="primary-button" to="/invoice-generator/"><ArrowRight size={15} />Start an invoice</Link>
      </div>

      {documentToolGroups.map((group) => (
        <section className="tool-group" key={group.title}>
          <div className="tool-group-heading"><h2>{group.title}</h2><p>{group.description}</p></div>
          <div className="tool-link-grid">
            {group.pages.map((page) => (
              <Link className="tool-link-card" key={page.slug} to={page.path}>
                <span className="tool-link-icon"><FileText size={16} /></span>
                <span className="tool-link-copy"><strong>{page.label}</strong><small>{page.description}</small></span>
                <ArrowRight className="tool-link-arrow" size={15} />
              </Link>
            ))}
          </div>
        </section>
      ))}
      <p className="document-legal-note tools-legal-note">Tax labels and calculations are general-purpose features, not tax or legal advice. Requirements depend on your location and circumstances; confirm them with an authoritative local source.</p>
    </main>
  );
}
