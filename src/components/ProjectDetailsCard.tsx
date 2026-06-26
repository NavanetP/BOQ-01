import { useProject } from "../context/ProjectContext";
import {
  CURRENCIES,
  TAX_PRESETS,
  DEFAULT_FX_FROM_USD,
  type CurrencyCode,
} from "../utils/currency";

const FIELDS = [
  ["name",     "Project Name",        "Acme DC Expansion"],
  ["client",   "Client / Organization", ""],
  ["engineer", "Presales Engineer",   ""],
  ["date",     "Quote Date",          ""],
] as const;

export default function ProjectDetailsCard() {
  const { projectInfo, setProjectInfo } = useProject();

  const applyTaxPreset = (presetId: string) => {
    const preset = TAX_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setProjectInfo((p) => ({ ...p, taxLabel: preset.taxLabel, taxRate: preset.taxRate }));
  };

  const onCurrencyChange = (code: CurrencyCode) => {
    setProjectInfo((p) => ({
      ...p,
      currency: code,
      fxRate:
        p.fxRate === 1 ||
        p.fxRate === DEFAULT_FX_FROM_USD[(p.currency as CurrencyCode) || "USD"]
          ? DEFAULT_FX_FROM_USD[code]
          : p.fxRate,
    }));
  };

  const activePreset =
    TAX_PRESETS.find(
      (p) => p.taxLabel === projectInfo.taxLabel && p.taxRate === projectInfo.taxRate,
    )?.id ?? "custom";

  return (
    <div className="boq-form-card boq-project-details" style={{ marginBottom: "1.25rem" }}>

      {/* Card header */}
      <div className="boq-form-card-header">
        <div className="boq-form-card-header-icon">PRJ</div>
        <div>
          <h2>Project Details</h2>
          <p>Metadata printed on your BOQ document</p>
        </div>
      </div>

      <div className="boq-form-body" style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>

        {/* ── Section: Project info ── */}
        {FIELDS.map(([field, label, placeholder]) => (
          <div key={field} className="boq-form-field">
            <label className="boq-label" htmlFor={`proj-${field}`}>
              {label}
            </label>
            <input
              id={`proj-${field}`}
              type={field === "date" ? "date" : "text"}
              className={`boq-input${field === "date" ? "" : " boq-input-mono"}`}
              placeholder={placeholder}
              value={projectInfo[field]}
              onChange={(e) => setProjectInfo((p) => ({ ...p, [field]: e.target.value }))}
            />
          </div>
        ))}

        {/* ── Divider ── */}
        <div className="boq-form-divider" />

        {/* ── Section: Currency & Tax ── */}
        <div className="boq-quote-settings-title">
          <span>&#x24;</span> Currency &amp; Tax
        </div>

        <div className="boq-form-field">
          <label className="boq-label" htmlFor="proj-currency">Quote currency</label>
          <select
            id="proj-currency"
            className="boq-select"
            value={projectInfo.currency || "USD"}
            onChange={(e) => onCurrencyChange(e.target.value as CurrencyCode)}
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>{c.label}</option>
            ))}
          </select>
        </div>

        <div className="boq-form-field">
          <label className="boq-label" htmlFor="proj-fx">FX rate (USD → quote currency)</label>
          <input
            id="proj-fx"
            type="number"
            min={0.0001}
            step={0.01}
            className="boq-input boq-input-mono"
            value={projectInfo.fxRate ?? 1}
            onChange={(e) =>
              setProjectInfo((p) => ({
                ...p,
                fxRate: Math.max(0.0001, parseFloat(e.target.value) || 1),
              }))
            }
          />
          <span className="boq-field-hint">
            Catalogue prices are in USD. This multiplier converts to{" "}
            {projectInfo.currency || "USD"}.
          </span>
        </div>

        <div className="boq-form-field">
          <label className="boq-label" htmlFor="proj-tax-preset">Tax preset</label>
          <select
            id="proj-tax-preset"
            className="boq-select"
            value={activePreset}
            onChange={(e) => { if (e.target.value !== "custom") applyTaxPreset(e.target.value); }}
          >
            {TAX_PRESETS.map((p) => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
            <option value="custom">Custom</option>
          </select>
        </div>

        <div className="boq-form-grid-inline">
          <div className="boq-form-field">
            <label className="boq-label" htmlFor="proj-tax-label">Tax name</label>
            <input
              id="proj-tax-label"
              type="text"
              className="boq-input"
              placeholder="GST, VAT, Sales tax…"
              value={projectInfo.taxLabel ?? "GST"}
              onChange={(e) => setProjectInfo((p) => ({ ...p, taxLabel: e.target.value }))}
            />
          </div>
          <div className="boq-form-field">
            <label className="boq-label" htmlFor="proj-tax-rate">Rate (%)</label>
            <input
              id="proj-tax-rate"
              type="number"
              min={0}
              max={100}
              step={0.01}
              className="boq-input boq-input-mono"
              value={projectInfo.taxRate ?? 18}
              onChange={(e) =>
                setProjectInfo((p) => ({
                  ...p,
                  taxRate: Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)),
                }))
              }
            />
          </div>
        </div>

        {/* ── Divider ── */}
        <div className="boq-form-divider" />

        {/* ── Section: Notes ── */}
        <div className="boq-form-field">
          <label className="boq-label" htmlFor="proj-notes">Notes</label>
          <textarea
            id="proj-notes"
            className="boq-textarea"
            rows={3}
            placeholder="Scope, assumptions, special requirements…"
            value={projectInfo.notes}
            onChange={(e) => setProjectInfo((p) => ({ ...p, notes: e.target.value }))}
          />
        </div>

      </div>
    </div>
  );
}
