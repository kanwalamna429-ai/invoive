import { useMemo, useState } from "react";
import { ArrowRight, Calculator, CircleHelp, FileText } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { getCurrencyOptions } from "../lib/currency.js";
import { createEmptyInvoice, formatMoney } from "../lib/invoice.js";
import { calculateRecommendedRates } from "../lib/rateCalculator.js";

const currencies = getCurrencyOptions();

const initialValues = {
  desiredIncome: "",
  businessExpenses: "",
  taxRate: "",
  workingHours: "",
  billableHours: "",
  profitMargin: "",
  currency: "USD",
};

const fields = [
  { name: "desiredIncome", label: "Desired income", hint: "Take-home income target for your chosen period.", prefix: true },
  { name: "businessExpenses", label: "Business expenses", hint: "Total business costs for that same period.", prefix: true },
  { name: "taxRate", label: "Tax percentage", hint: "Estimated portion of revenue set aside for tax.", suffix: "%" },
  { name: "profitMargin", label: "Profit margin", hint: "Target share of revenue retained as profit.", suffix: "%" },
  { name: "billableHours", label: "Billable hours", hint: "Hours you expect to bill in that same period.", suffix: "hrs" },
  { name: "workingHours", label: "Project working hours", hint: "Estimated hours for the project you want to price.", suffix: "hrs" },
];

export default function RateCalculator() {
  const navigate = useNavigate();
  const [values, setValues] = useState(initialValues);
  const [submitted, setSubmitted] = useState(false);

  const estimate = useMemo(() => {
    const required = ["desiredIncome", "businessExpenses", "taxRate", "workingHours", "billableHours", "profitMargin"];
    if (!required.every((key) => values[key].trim() !== "")) return { result: null, error: "" };

    try {
      return { result: calculateRecommendedRates(values), error: "" };
    } catch (error) {
      return { result: null, error: error.message };
    }
  }, [values]);

  function change(name, value) {
    setValues((current) => ({ ...current, [name]: value }));
  }

  function createInvoice() {
    if (!estimate.result) {
      setSubmitted(true);
      return;
    }
    const invoice = createEmptyInvoice();
    invoice.currency = values.currency;
    invoice.items = [{
      ...invoice.items[0],
      description: "Project work",
      quantity: Number(values.workingHours),
      unitPrice: estimate.result.hourlyRate,
    }];
    navigate("/invoice-generator/", { state: { invoice } });
  }

  return (
    <main className="calculator-page">
      <div className="page-heading">
        <div className="breadcrumbs"><Link to="/invoice-generator/">Workspace</Link><span>/</span><strong>Rate calculator</strong></div>
        <div className="page-heading-main calculator-heading">
          <div>
            <span className="calculator-eyebrow"><Calculator size={14} /> FREE FREELANCE PRICING TOOL</span>
            <h1>How much should I invoice?</h1>
            <p>Find an hourly rate and project price that account for your income goals, expenses, tax, and profit.</p>
          </div>
        </div>
      </div>

      <div className="calculator-layout">
        <section className="calculator-card" aria-labelledby="calculator-input-heading">
          <div className="section-heading">
            <span className="section-icon"><Calculator size={17} /></span>
            <div className="section-heading-copy"><h2 id="calculator-input-heading">Your pricing details</h2><p>Use the same time period for income, expenses, and billable hours.</p></div>
          </div>
          <div className="calculator-fields">
            {fields.map(({ name, label, hint, prefix, suffix }) => (
              <label className="calculator-field" htmlFor={name} key={name}>
                <span>{label}</span>
                <span className={`calculator-input-wrap${prefix ? " has-prefix" : ""}${suffix ? " has-suffix" : ""}`}>
                  {prefix && <span className="calculator-input-affix">{currencySymbol(values.currency)}</span>}
                  <input
                    aria-describedby={`${name}-hint`}
                    className="input form-input"
                    id={name}
                    min="0"
                    onChange={(event) => change(name, event.target.value)}
                    placeholder="0"
                    step={prefix ? "0.01" : "any"}
                    type="number"
                    value={values[name]}
                  />
                  {suffix && <span className="calculator-input-affix">{suffix}</span>}
                </span>
                <small id={`${name}-hint`}>{hint}</small>
              </label>
            ))}
            <label className="calculator-field calculator-currency" htmlFor="calculator-currency">
              <span>Currency</span>
              <select className="select form-input" id="calculator-currency" onChange={(event) => change("currency", event.target.value)} value={values.currency}>
                {currencies.map(({ code, label }) => <option key={code} value={code}>{label}</option>)}
              </select>
              <small>Used to display your estimate and invoice.</small>
            </label>
          </div>
          {submitted && !estimate.result && !estimate.error && <p className="calculator-error" role="alert">Fill in all the fields to calculate your recommended rate.</p>}
          {estimate.error && <p className="calculator-error" role="alert">{estimate.error}</p>}
          <p className="calculator-assumption"><CircleHelp size={14} />This estimate treats tax and profit margin as percentages of revenue. Together, they must be less than 100%.</p>
        </section>

        <aside className="calculator-result-card" aria-live="polite" aria-label="Recommended pricing">
          <span className="calculator-result-icon"><Calculator size={18} /></span>
          <span className="calculator-result-label">YOUR RECOMMENDED RATE</span>
          <strong className="calculator-hourly-rate">{estimate.result ? formatMoney(estimate.result.hourlyRate, values.currency) : "—"}<small>/ hour</small></strong>
          <div className="calculator-result-divider" />
          <span className="calculator-result-label">RECOMMENDED PROJECT PRICE</span>
          <strong className="calculator-project-price">{estimate.result ? formatMoney(estimate.result.projectPrice, values.currency) : "—"}</strong>
          <p>{estimate.result
            ? `For ${Number(values.workingHours).toLocaleString()} project hours, based on ${Number(values.billableHours).toLocaleString()} billable hours in your income period.`
            : "Enter your details to see a personalized estimate."}</p>
          <button className="primary-button calculator-create-button" disabled={!estimate.result} onClick={createInvoice} type="button">
            <FileText size={16} /><span>Create invoice</span><ArrowRight size={15} />
          </button>
          <span className="calculator-private-note">Your numbers stay in this browser.</span>
        </aside>
      </div>

      <section className="calculator-explainer">
        <h2>How does the invoice rate calculator work?</h2>
        <p>First, it combines your desired income with business expenses. It then grosses up that amount to account for the tax and profit percentages you enter, and divides the result by your expected billable hours. The project price multiplies that hourly rate by your estimated project working hours.</p>
        <div className="calculator-formula"><strong>Hourly rate</strong><span>= (desired income + expenses) ÷ (1 − tax %/100 − margin %/100) ÷ billable hours</span></div>
        <div className="calculator-formula"><strong>Project price</strong><span>= hourly rate × project working hours</span></div>
        <p className="calculator-disclaimer">This is a planning estimate, not tax or financial advice. Tax treatment varies by location and business structure; confirm your pricing assumptions with a qualified professional.</p>
      </section>
    </main>
  );
}

function currencySymbol(currency) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 0 })
    .formatToParts(0)
    .find((part) => part.type === "currency")?.value ?? currency;
}
