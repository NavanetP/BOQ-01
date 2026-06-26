import { Link, useParams, Navigate } from "react-router-dom";
import { BRAND_COLORS, BRAND_LABELS } from "../data/catalogue";
import { useCatalogue } from "../hooks/useCatalogue";
import { useQuoteMoney } from "../hooks/useQuoteMoney";
import { CURRENCIES } from "../utils/currency";
import { Icon } from "../components/Icons";

export default function ProductPage() {
  const { category, productId } = useParams();
  const { fmt, settings } = useQuoteMoney();
  const { catalogue, loading, error, findProduct } = useCatalogue();

  if (!category || !productId) return <Navigate to="/" replace />;

  // Loading state
  if (loading) {
    return (
      <div className="boq-app">
        <header className="boq-masthead">
          <div className="boq-header-left">
            <Link to="/" className="boq-btn boq-btn-ghost boq-btn-sm">← Home</Link>
          </div>
        </header>
        <main className="boq-container" style={{ padding: "2rem", textAlign: "center" }}>
          <p style={{ color: "var(--boq-ink-muted)" }}>Loading catalogue...</p>
        </main>
      </div>
    );
  }

  // Error state
  if (error || !catalogue) {
    return (
      <div className="boq-app">
        <header className="boq-masthead">
          <div className="boq-header-left">
            <Link to="/" className="boq-btn boq-btn-ghost boq-btn-sm">← Home</Link>
          </div>
        </header>
        <main className="boq-container" style={{ padding: "2rem" }}>
          <div className="boq-form-card">
            <div className="boq-form-card-header">
              <div className="boq-form-card-header-icon" style={{ border: "none", background: "transparent" }}>
                <Icon name="warning" size={20} style={{ color: "var(--boq-danger)" }} />
              </div>
              <div>
                <h2>Catalogue Unavailable</h2>
                <p>Could not load product catalogue from the server.</p>
              </div>
            </div>
            <div className="boq-form-body">
              <p style={{ color: "var(--boq-ink-soft)", fontSize: "0.875rem" }}>
                {error || "Unknown error"}
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const product = findProduct(category, productId);
  if (!product) return <Navigate to="/" replace />;

  const cat = catalogue.categories[category];
  const siblings = cat?.items ?? [];
  const brand = "brand" in product ? product.brand : undefined;
  const currencyLabel =
    CURRENCIES.find((c) => c.code === settings.currency)?.label ?? settings.currency;

  return (
    <div className="boq-app">

      {/* ── Header ── */}
      <header className="boq-masthead">
        <div className="boq-header-left">
          <Link to="/" className="boq-btn boq-btn-ghost boq-btn-sm">← Home</Link>
          <div className="boq-header-divider" />
          <Link to="/segments" className="boq-btn boq-btn-ghost boq-btn-sm" style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
            <Icon name="settings" size={13} />
            <span className="boq-header-nav-label">Configure</span>
          </Link>
        </div>
        <div className="boq-header-right">
          <span
            className="boq-header-nav-label"
            style={{
              fontFamily: "var(--boq-mono)",
              fontSize: "0.5625rem",
              color: "var(--boq-ink-muted)",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            Product Reference
          </span>
        </div>
      </header>

      <main className="boq-container">

        {/* ── Breadcrumb ── */}
        <nav
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
            marginBottom: "1.25rem",
            fontFamily: "var(--boq-mono)",
            fontSize: "0.5625rem",
            color: "var(--boq-ink-muted)",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}
        >
          <Link to="/" style={{ color: "var(--boq-accent)", textDecoration: "none", fontWeight: 700 }}>Home</Link>
          <span>/</span>
          <Link to="/segments" style={{ color: "var(--boq-accent)", textDecoration: "none", fontWeight: 700 }}>Catalogue</Link>
          <span>/</span>
          <span style={{ color: "var(--boq-ink-soft)", textTransform: "none", fontSize: "0.625rem" }}>{category}</span>
          <span>/</span>
          <span style={{ color: "var(--boq-ink)", fontWeight: 700, textTransform: "none", fontSize: "0.625rem" }}>{productId}</span>
        </nav>

        <div
          className="boq-product-two-col"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 300px",
            gap: "1.5rem",
            alignItems: "start",
          }}
        >

          {/* ── Left: product detail ── */}
          <div>
            <article className="boq-form-card boq-product-hero">
              <div className="boq-form-card-header">
                <div className="boq-form-card-header-icon">
                  {cat?.icon ? <Icon name={cat.icon} size={16} /> : <Icon name="rack" size={16} />}
                </div>
                <div>
                  <h2>{(product as { categoryLabel?: string }).categoryLabel ?? cat?.label}</h2>
                  <p>
                    Unit price reference · USD catalogue
                    {settings.currency !== "USD"
                      ? ` · converted to ${currencyLabel} at FX ${settings.fxRate}`
                      : ""}
                  </p>
                </div>
              </div>

              <div className="boq-form-body">
                {/* Brand badge row */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    marginBottom: "1rem",
                    flexWrap: "wrap",
                  }}
                >
                  {brand && (
                    <span
                      className="boq-brand-badge"
                      style={{ background: BRAND_COLORS[brand] || "var(--boq-accent)" }}
                    >
                      {BRAND_LABELS[brand] || brand.toUpperCase()}
                    </span>
                  )}
                  <span
                    style={{
                      fontFamily: "var(--boq-mono)",
                      fontSize: "0.5rem",
                      color: "var(--boq-ink-muted)",
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                    }}
                  >
                    {category?.replace(/_/g, " ")}
                  </span>
                </div>

                {/* Product name */}
                <h1
                  style={{
                    fontFamily: "var(--boq-font)",
                    fontSize: "1.375rem",
                    fontWeight: 700,
                    letterSpacing: "-0.025em",
                    color: "var(--boq-ink)",
                    margin: "0 0 0.625rem",
                    lineHeight: 1.2,
                  }}
                >
                  {product.name}
                </h1>

                {/* Spec */}
                <p
                  style={{
                    fontSize: "0.875rem",
                    color: "var(--boq-ink-soft)",
                    lineHeight: 1.65,
                    margin: "0 0 1.5rem",
                  }}
                >
                  {product.spec}
                </p>

                {/* Price callout */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: "0.75rem",
                    padding: "1rem 1.125rem",
                    background: "var(--boq-accent-muted)",
                    border: "1px solid var(--boq-accent-light)",
                    borderLeft: "3px solid var(--boq-accent)",
                    borderRadius: "var(--boq-radius-sm)",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--boq-mono)",
                      fontSize: "1.5rem",
                      fontWeight: 700,
                      color: "var(--boq-accent)",
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {product.unitPrice === 0 ? "Free" : fmt(product.unitPrice)}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--boq-mono)",
                      fontSize: "0.5625rem",
                      fontWeight: 700,
                      letterSpacing: "0.09em",
                      textTransform: "uppercase",
                      color: "var(--boq-ink-muted)",
                    }}
                  >
                    per unit
                  </span>
                </div>
              </div>
            </article>

            {/* Actions */}
            <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem" }}>
              <Link to="/segments" className="boq-btn boq-btn-primary">
                Add to BOQ →
              </Link>
              <Link to={`/segments`} className="boq-btn boq-btn-ghost">
                Browse catalogue
              </Link>
            </div>
          </div>

          {/* ── Right: related SKUs ── */}
          <div>
            <h2 className="boq-index-heading">
              <span>—</span> Related SKUs
            </h2>

            <div className="boq-form-card">
              <div style={{ padding: "0.35rem 0.875rem" }}>
                {siblings.map((item) => (
                  <Link
                    key={item.id}
                    to={`/products/${category}/${item.id}`}
                    className="boq-cat-row"
                    style={
                      item.id === productId
                        ? {
                            background: "var(--boq-accent-muted)",
                            borderRadius: "var(--boq-radius-sm)",
                          }
                        : undefined
                    }
                  >
                    {item.id === productId ? (
                      <span
                        style={{
                          width: "0.5rem",
                          height: "0.5rem",
                          borderRadius: "50%",
                          background: "var(--boq-accent)",
                          flexShrink: 0,
                        }}
                      />
                    ) : (
                      <span />
                    )}
                    <span
                      className="boq-cat-name"
                      style={
                        item.id === productId
                          ? { color: "var(--boq-accent)" }
                          : undefined
                      }
                    >
                      {item.name}
                    </span>
                    <span className="boq-cat-meta">
                      {item.unitPrice === 0 ? "Free" : fmt(item.unitPrice)}
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Category meta */}
            <div
              style={{
                marginTop: "0.75rem",
                padding: "0.65rem 0.875rem",
                background: "var(--boq-paper-bright)",
                border: "1px solid var(--boq-rule)",
                borderRadius: "var(--boq-radius-sm)",
              }}
            >
              <div
                style={{
                  fontFamily: "var(--boq-mono)",
                  fontSize: "0.5rem",
                  fontWeight: 700,
                  letterSpacing: "0.09em",
                  textTransform: "uppercase",
                  color: "var(--boq-ink-muted)",
                  marginBottom: "0.35rem",
                }}
              >
                Category info
              </div>
              <div style={{ fontSize: "0.6875rem", color: "var(--boq-ink-soft)" }}>
                <strong style={{ color: "var(--boq-ink)", fontWeight: 600 }}>
                  {cat?.label}
                </strong>
                <br />
                {siblings.length} products in this category
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
