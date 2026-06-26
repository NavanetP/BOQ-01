import { GoogleLogin } from '@react-oauth/google';
import { useState } from 'react';
import { Link } from "react-router-dom";
import ProjectDetailsCard from '../components/ProjectDetailsCard';
import { useAuth } from '../context/AuthContext';
import { useCatalogue } from "../hooks/useCatalogue";
import { INFRA_CATEGORY_ORDER } from "../data/catalogue";
import { SEGMENTS } from "../data/segments";
import { Icon } from "../components/Icons";

export default function HomePage() {
  const { isAuthenticated, login, logout, user } = useAuth();
  const { catalogue, loading, error, refetch } = useCatalogue();
  const [refreshing, setRefreshing] = useState(false);
  const [refreshResult, setRefreshResult] = useState<{ success: boolean; message: string } | null>(null);
  const segmentEntries = Object.entries(SEGMENTS);

  const catalogueEntries = catalogue
    ? Object.entries(catalogue.categories)
    : [];
  const totalItems = catalogueEntries.reduce((a, [, cat]) => a + cat.items.length, 0);

  const handleRefreshPrices = async () => {
    if (!window.confirm(
      "Refresh all catalogue prices using AI?\n\nThis queries Groq with current market context and updates all 125 SKU prices. Takes about 1–2 minutes."
    )) return;

    setRefreshing(true);
    setRefreshResult(null);
    try {
      const res = await fetch("/api/catalogue/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      const count = Object.keys(data.refreshed || {}).length;
      setRefreshResult({ success: true, message: `${count} categories updated — prices refreshed from AI.` });
      setTimeout(() => refetch(), 400);
    } catch (err) {
      setRefreshResult({ success: false, message: err instanceof Error ? err.message : "Unknown error" });
    } finally {
      setRefreshing(false);
    }
  };

  const [fullRefreshing, setFullRefreshing] = useState(false);
  const [fullRefreshResult, setFullRefreshResult] = useState<{ success: boolean; message: string; detail?: string } | null>(null);

  const handleFullRefresh = async () => {
    if (!window.confirm(
      "Update ALL product data from AI?\n\n" +
      "This will refresh:\n" +
      "• All 125 catalogue SKU prices & specs\n" +
      "• Server models (Dell PowerEdge, HPE ProLiant, Lenovo ThinkSystem)\n" +
      "• CPU / GPU / RAM / storage options\n\n" +
      "Uses 2025–2026 market data from Groq AI.\n" +
      "Takes 3–5 minutes. The app will reload when done."
    )) return;

    setFullRefreshing(true);
    setFullRefreshResult(null);
    try {
      const res = await fetch("/api/refresh-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target: "all" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);

      const updatedKeys = Object.keys(data.results || {});
      const errorKeys = Object.keys(data.errors || {});
      const detail = errorKeys.length ? `Errors in: ${errorKeys.join(", ")}` : undefined;

      setFullRefreshResult({
        success: data.ok,
        message: `${updatedKeys.length} data sets updated with 2025–2026 market data.`,
        detail,
      });

      // Reload the page so the new data is fetched fresh
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      setFullRefreshResult({
        success: false,
        message: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setFullRefreshing(false);
    }
  };

  /* ── Auth gate ─────────────────────────────────────────── */
  if (!isAuthenticated) {
    return (
      <div className="boq-app boq-auth-page">
        <div className="boq-auth-card">
          <div className="boq-auth-logo">
            <img src="/logo.png" alt="Sniper Presales Logo" />
          </div>

          <h1 className="boq-brand-title boq-auth-title">Sniper Presales</h1>
          <p
            className="boq-brand-sub"
            style={{ fontSize: "0.6875rem", marginBottom: "2rem", display: "block" }}
          >
            BOQ Configuration Platform
          </p>

          <div style={{ display: "flex", justifyContent: "center" }}>
            <GoogleLogin
              onSuccess={(cr) => { if (cr.credential) login(cr.credential); }}
              onError={() => console.log("Login Failed")}
              useOneTap
            />
          </div>

          <p className="boq-auth-note">
            Authorized personnel only. Sign in with your corporate Gmail account.
          </p>
        </div>
      </div>
    );
  }

  /* ── Main dashboard ────────────────────────────────────── */
  return (
    <div className="boq-app">

      {/* ── Header ── */}
      <header className="boq-masthead">
        <div className="boq-header-left">
          <div className="boq-mark">
            <img src="/logo.png" alt="Sniper Presales Logo" className="boq-logo" />
          </div>
          <div className="boq-header-divider" />
          <div className="boq-header-brand-text">
            <div className="boq-brand-title">Sniper Datacenter Presales</div>
            <div className="boq-brand-sub">Bill of Quantity · Rev 9</div>
          </div>
        </div>

        <div className="boq-header-right">
          {user && (
            <>
              <div className="boq-user-block">
                <div className="boq-user-name">{user.name}</div>
                <div className="boq-user-email">{user.email}</div>
              </div>
              <div className="boq-header-divider" />
            </>
          )}
          <Link to="/segments" className="boq-btn boq-btn-ghost boq-btn-sm" style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
            <Icon name="menu" size={13} />
            <span className="boq-header-nav-label">Segments</span>
          </Link>
          <Link to="/ai" className="boq-btn boq-btn-ghost boq-btn-sm" style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
            <Icon name="sparkles" size={13} />
            <span className="boq-header-nav-label">AI BOQ</span>
          </Link>
          <button onClick={logout} className="boq-btn boq-btn-ghost boq-btn-sm">
            Sign out
          </button>

          {/* Update All Products button */}
          <div className="boq-header-divider" />
          <button
            type="button"
            onClick={handleFullRefresh}
            disabled={fullRefreshing}
            title="Fetch current 2025–2026 market data for all products, servers, CPUs, and GPUs"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.35rem",
              padding: "0.3rem 0.65rem",
              borderRadius: "var(--boq-radius-sm, 4px)",
              border: "1px solid var(--boq-accent, #1a4d7c)",
              background: fullRefreshing ? "var(--boq-accent, #1a4d7c)" : "var(--boq-accent-muted, #e8f2fb)",
              color: fullRefreshing ? "#fff" : "var(--boq-accent, #1a4d7c)",
              fontFamily: "var(--boq-mono, monospace)",
              fontSize: "0.5rem",
              fontWeight: 700,
              letterSpacing: "0.07em",
              textTransform: "uppercase",
              cursor: fullRefreshing ? "not-allowed" : "pointer",
              opacity: fullRefreshing ? 0.8 : 1,
              whiteSpace: "nowrap",
              transition: "all 0.15s",
            }}
          >
            <Icon name="refresh" size={11} className={fullRefreshing ? "boq-spin" : ""} />
            {fullRefreshing ? "Updating..." : "Update All Products"}
          </button>
        </div>
      </header>

      {/* Full refresh result banner */}
      {fullRefreshResult && (
        <div style={{
          padding: "0.6rem 1.25rem",
          background: fullRefreshResult.success ? "rgba(13,148,136,0.08)" : "rgba(239,68,68,0.08)",
          borderBottom: `2px solid ${fullRefreshResult.success ? "var(--boq-teal, #0d9488)" : "var(--boq-danger, #ef4444)"}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            {fullRefreshResult.success ? <Icon name="check" size={14} style={{ color: "var(--boq-teal)" }} /> : <Icon name="close" size={14} style={{ color: "var(--boq-danger)" }} />}
            <div>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: fullRefreshResult.success ? "var(--boq-teal)" : "var(--boq-danger)" }}>
                {fullRefreshResult.message}
              </span>
              {fullRefreshResult.detail && (
                <span style={{ marginLeft: "0.5rem", fontSize: "0.6875rem", color: "var(--boq-ink-muted)" }}>
                  {fullRefreshResult.detail}
                </span>
              )}
              {fullRefreshResult.success && (
                <span style={{ marginLeft: "0.5rem", fontSize: "0.6875rem", color: "var(--boq-ink-muted)" }}>
                  Reloading app…
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setFullRefreshResult(null)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--boq-ink-muted)", fontSize: "0.875rem", padding: 0 }}
            aria-label="Dismiss"
          >✕</button>
        </div>
      )}

      {/* ── Welcome strip ── */}
      <div className="boq-welcome-strip">
        <span className="boq-welcome-strip-greeting">
          Welcome back,&nbsp;<strong>{user?.name.split(" ")[0]}</strong>
        </span>
        <span className="boq-welcome-strip-meta">
          DOC-ID: BOQ-PLATFORM &nbsp;·&nbsp; {segmentEntries.length} verticals &nbsp;·&nbsp;{" "}
          {INFRA_CATEGORY_ORDER.length} catalogue layers
        </span>
      </div>

      {/* ── Body ── */}
      <main className="boq-home">
        <div className="boq-home-grid">

          {/* ── Left: intro + project card + actions ── */}
          <aside className="boq-home-intro">
            <p className="boq-eyebrow">Configure &amp; Quote</p>
            <h1 className="boq-page-title">
              Infrastructure BOQ, line-item precise.
            </h1>
            <p className="boq-page-lead">
              Build full-stack bills of quantity by vertical — compute, network,
              storage, hypervisor — or draft requirements and let the engine
              propose the entire bill.
            </p>

            {/* Stat strip */}
            <div className="boq-stat-strip" style={{ marginBottom: "1.25rem" }}>
              <div className="boq-stat-cell">
                <span className="boq-stat-label">Verticals</span>
                <span className="boq-stat-value">{segmentEntries.length}</span>
              </div>
              <div className="boq-stat-cell">
                <span className="boq-stat-label">Layers</span>
                <span className="boq-stat-value">{INFRA_CATEGORY_ORDER.length}</span>
              </div>
              <div className="boq-stat-cell">
                <span className="boq-stat-label">Catalogue</span>
                <span className="boq-stat-value">
                  {loading ? "..." : error ? "—" : totalItems}
                  <span
                    style={{
                      fontSize: "0.5rem",
                      fontWeight: 400,
                      color: "var(--boq-ink-muted)",
                      marginLeft: 4,
                    }}
                  >
                    SKUs
                  </span>
                </span>
              </div>
            </div>

            {/* Project details form */}
            <ProjectDetailsCard />

            {/* CTA buttons */}
            <div className="boq-home-actions">
              <Link to="/segments" className="boq-btn boq-btn-primary boq-btn-lg">
                Open segment index →
              </Link>
              <Link to="/ai" className="boq-btn boq-btn-accent boq-btn-lg">
                Requirements → BOQ
              </Link>
            </div>

            <div className="boq-home-meta">
              Platform version: Rev 9 &nbsp;·&nbsp; All prices in USD catalogue<br />
              FX &amp; tax applied at quote generation
            </div>
          </aside>

          {/* ── Right: index lists ── */}
          <div>

            {/* Industry verticals */}
            <h2 className="boq-index-heading">
              <span>01</span> Industry verticals
            </h2>
            <ul className="boq-index-list">
              {segmentEntries.map(([key, seg], i) => (
                <li key={key}>
                  <Link to={`/segments/${key}/servers`} className="boq-index-item">
                    <span className="boq-index-num">{String(i + 1).padStart(2, "0")}</span>
                    <span>
                      <span className="boq-index-label">{seg.label}</span>
                      <span className="boq-index-desc">{seg.description}</span>
                    </span>
                    <span className="boq-index-arrow">→</span>
                  </Link>
                </li>
              ))}
            </ul>

            {/* Product catalogue */}
            <h2 className="boq-index-heading" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span><span>02</span> Product catalogue</span>
              <button
                type="button"
                onClick={handleRefreshPrices}
                disabled={refreshing || !catalogue}
                title="Use AI to refresh market prices for all catalogue items"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  padding: "0.25rem 0.65rem",
                  borderRadius: "var(--boq-radius-sm, 4px)",
                  border: "1px solid var(--boq-rule-dark, #c8d6e8)",
                  background: refreshing ? "var(--boq-accent-muted, #e8f2fb)" : "var(--boq-paper-elevated, #fff)",
                  color: refreshing ? "var(--boq-ink-muted, #7aa3c0)" : "var(--boq-accent, #1a4d7c)",
                  fontFamily: "var(--boq-mono, monospace)",
                  fontSize: "0.5rem",
                  fontWeight: 700,
                  letterSpacing: "0.07em",
                  textTransform: "uppercase",
                  cursor: refreshing || !catalogue ? "not-allowed" : "pointer",
                  transition: "all 0.15s",
                  opacity: refreshing || !catalogue ? 0.6 : 1,
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                <Icon name={refreshing ? "refresh" : "sparkles"} size={10} className={refreshing ? "boq-spin" : ""} />
                {refreshing ? "Refreshing..." : "Refresh Prices"}
              </button>
            </h2>

            {/* Refresh result banner */}
            {refreshResult && (
              <div
                style={{
                  marginBottom: "0.75rem",
                  padding: "0.5rem 0.75rem",
                  borderRadius: "var(--boq-radius-sm, 4px)",
                  border: `1px solid ${refreshResult.success ? "var(--boq-teal, #0d9488)" : "var(--boq-danger, #ef4444)"}40`,
                  background: refreshResult.success ? "rgba(13,148,136,0.06)" : "rgba(239,68,68,0.06)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "0.5rem",
                }}
              >
                <span style={{ fontSize: "0.6875rem", display: "inline-flex", alignItems: "center", gap: "0.3rem", color: refreshResult.success ? "var(--boq-teal, #0d9488)" : "var(--boq-danger, #ef4444)" }}>
                  <Icon name={refreshResult.success ? "check" : "close"} size={12} /> {refreshResult.message}
                </span>
                <button
                  type="button"
                  onClick={() => setRefreshResult(null)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--boq-ink-muted)", fontSize: "0.75rem", flexShrink: 0, padding: 0 }}
                  aria-label="Dismiss"
                >
                  <Icon name="close" size={12} />
                </button>
              </div>
            )}
            {loading ? (
              <div className="boq-form-card" style={{ padding: "2rem", textAlign: "center", color: "var(--boq-ink-muted)" }}>
                Loading catalogue...
              </div>
            ) : error ? (
              <div className="boq-form-card" style={{ padding: "2rem", textAlign: "center" }}>
                <div style={{ color: "var(--boq-danger)", marginBottom: "0.5rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem" }}>
                  <Icon name="warning" size={16} /> Error loading catalogue
                </div>
                <div style={{ color: "var(--boq-ink-muted)", fontSize: "0.75rem" }}>{error}</div>
              </div>
            ) : (
              <div className="boq-form-card">
                <div style={{ padding: "0.35rem 0.875rem" }}>
                  {catalogueEntries.map(([key, cat]) => {
                    const first = cat.items[0];
                    return (
                      <Link
                        key={key}
                        to={first ? `/products/${key}/${first.id}` : "/segments"}
                        className="boq-cat-row"
                      >
                        <span className="boq-cat-icon" style={{ display: "inline-flex", alignItems: "center" }}>
                          <Icon name={cat.icon} size={14} />
                        </span>
                        <span className="boq-cat-name">{cat.label}</span>
                        <span className="boq-cat-meta">{cat.items.length} SKUs</span>
                      </Link>
                    );
                  })}
                </div>
                {catalogue?.metadata?.lastFullUpdate && (
                  <div
                    style={{
                      padding: "0.4rem 0.875rem",
                      borderTop: "1px solid var(--boq-rule, #e0e7f0)",
                      fontFamily: "var(--boq-mono, monospace)",
                      fontSize: "0.5rem",
                      color: "var(--boq-ink-muted)",
                      letterSpacing: "0.05em",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.4rem",
                    }}
                  >
                    <Icon name="refresh" size={10} />
                    <span>
                      LAST UPDATED · {new Date(catalogue.metadata.lastFullUpdate).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </main>
    </div>
  );
}
