import { Link } from "react-router-dom";
import { INFRA_CATALOGUE } from "../data/catalogue";
import { SEGMENTS } from "../data/segments";

export default function HomePage() {
  const segmentEntries = Object.entries(SEGMENTS);

  return (
    <div className="boq-app boq-shell">
      <header className="boq-masthead">
        <div className="boq-header-left">
          <div className="boq-mark" aria-hidden>SN</div>
          <div>
            <div className="boq-brand-title">Sniper Presales</div>
            <div className="boq-brand-sub">Bill of Quantity · Rev 9</div>
          </div>
        </div>
      </header>

      <main className="boq-home">
        <div className="boq-home-grid">
          <aside className="boq-home-intro">
            <p className="boq-eyebrow">Data centre presales</p>
            <h1 className="boq-page-title">
              Configure infrastructure quotes with line-item precision.
            </h1>
            <p className="boq-page-lead">
              Build full-stack BOQs by vertical—compute, network, storage, hypervisor—or
              draft requirements and let the engine propose a bill.
            </p>
            <div className="boq-home-actions">
              <Link to="/segments" className="boq-btn boq-btn-primary boq-btn-lg">
                Open segment index
              </Link>
              <Link to="/ai" className="boq-btn boq-btn-accent boq-btn-lg">
                AI Requirements → BOQ              </Link>
            </div>
            <div className="boq-home-meta">
              DOC-ID: BOQ-PLATFORM
              <br />
              {segmentEntries.length} verticals ·{" "}
              {Object.keys(INFRA_CATALOGUE).length} catalogue layers
            </div>
          </aside>

          <div>
            <h2 className="boq-index-heading">
              <span>01</span> Industry verticals
            </h2>
            <ul className="boq-index-list">
              {segmentEntries.map(([key, seg], i) => (
                <li key={key}>
                  <Link to={`/segments/${key}/servers`} className="boq-index-item">
                    <span className="boq-index-num">{String(i + 1).padStart(2, "0")}</span>
                    <span>
                      <span className="boq-index-label">
                        {seg.icon} {seg.label}
                      </span>
                      <span className="boq-index-desc">{seg.description}</span>
                    </span>
                    <span className="boq-index-arrow">→</span>
                  </Link>
                </li>
              ))}
            </ul>

            <h2 className="boq-index-heading">
              <span>02</span> Product catalogue
            </h2>
            <div className="boq-form-card" style={{ padding: "0.5rem 1rem" }}>
              {Object.entries(INFRA_CATALOGUE).map(([key, cat]) => {
                const first = cat.items[0];
                return (
                  <Link
                    key={key}
                    to={first ? `/products/${key}/${first.id}` : "/segments"}
                    className="boq-cat-row"
                  >
                    <span className="boq-cat-icon">{cat.icon}</span>
                    <span className="boq-cat-name">{cat.label}</span>
                    <span className="boq-cat-meta">{cat.items.length} SKUs</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
