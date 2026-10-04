import { Check } from "lucide-react";
import { invoiceTemplates } from "../lib/templates.js";

export default function TemplatePicker({ onChange, selected }) {
  return (
    <div className="template-grid" role="group" aria-label="Invoice template">
      {invoiceTemplates.map((template) => (
        <button
          aria-pressed={selected === template.id}
          className={`template-option${selected === template.id ? " is-selected" : ""}`}
          key={template.id}
          onClick={() => onChange(template.id)}
          type="button"
        >
          <span aria-hidden="true" className={`template-thumbnail template-thumbnail-${template.style}`}>
            <span className="template-thumb-bar" />
            <span className="template-thumb-head"><i /><i /></span>
            <span className="template-thumb-meta"><i /><i /></span>
            <span className="template-thumb-table"><i /><i /><i /></span>
            <span className="template-thumb-total" />
          </span>
          <span className="template-option-top">
            <span className="template-swatch" style={{ backgroundColor: template.accent }} />
            {selected === template.id && <Check className="template-option-check" size={13} />}
          </span>
          <strong>{template.name}</strong>
          <small>{template.description}</small>
        </button>
      ))}
    </div>
  );
}
