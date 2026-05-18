import { Link, useParams, Navigate } from "react-router-dom";
import { findProduct, fmt, BRAND_COLORS, BRAND_LABELS, INFRA_CATALOGUE } from "../data/catalogue";

export default function ProductPage() {
  const { category, productId } = useParams();
  if (!category || !productId) return <Navigate to="/" replace />;

  const product = findProduct(category, productId);
  if (!product) return <Navigate to="/" replace />;

  const cat = INFRA_CATALOGUE[category as keyof typeof INFRA_CATALOGUE];
  const siblings = cat?.items ?? [];
  const brand = "brand" in product ? product.brand : undefined;

  return (
    <div className="boq-app boq-shell">
      <header className="boq-masthead">
        <div className="boq-header-left">
          <Link to="/" className="boq-btn boq-btn-ghost">← Home</Link>
          <Link to="/segments" className="boq-btn boq-btn-ghost">Configure</Link>
        </div>
      </header>

      <main className="boq-container">
        <p className="boq-eyebrow" style={{ marginBottom: "0.5rem" }}>
          Catalogue / {category} / {productId}
        </p>

        <article className="boq-form-card" style={{ marginBottom: "1.5rem" }}>
          <div className="boq-form-card-header">
            <h2>{product.categoryLabel}</h2>
            <p>Unit price reference (USD)</p>
          </div>
          <div className="boq-form-body">
            <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", marginBottom: "1rem", flexWrap: "wrap" }}>
              <span style={{ fontSize: "1.5rem" }}>{product.categoryIcon}</span>
              {brand && (
                <span className="boq-badge" style={{ background: BRAND_COLORS[brand] || "#b84a1f", borderColor: "transparent", color: "#fff" }}>
                  {BRAND_LABELS[brand] || brand.toUpperCase()}
                </span>
              )}
            </div>

            <h1 className="boq-page-title" style={{ fontSize: "1.75rem", marginBottom: "0.75rem" }}>{product.name}</h1>
            <p className="boq-page-lead" style={{ margin: "0 0 1.25rem", textAlign: "left" }}>{product.spec}</p>

            <p style={{ fontFamily: "var(--boq-mono)", fontSize: "1.5rem", fontWeight: 600, color: "var(--boq-accent)", margin: 0 }}>
              {product.unitPrice === 0 ? "Free" : fmt(product.unitPrice)}
              <span style={{ fontSize: "0.75rem", color: "var(--boq-ink-muted)", fontWeight: 400, marginLeft: "0.5rem" }}>per unit</span>
            </p>
          </div>
        </article>

        <h2 className="boq-index-heading">
          <span>—</span> Related SKUs
        </h2>
        <div className="boq-form-card" style={{ padding: "0.5rem 1rem" }}>
          {siblings.map(item => (
            <Link
              key={item.id}
              to={`/products/${category}/${item.id}`}
              className="boq-cat-row"
              style={item.id === productId ? { background: "var(--boq-accent-muted)" } : undefined}
            >
              <span className="boq-cat-icon">{product.categoryIcon}</span>
              <span className="boq-cat-name">{item.name}</span>
              <span className="boq-cat-meta">{item.unitPrice === 0 ? "Free" : fmt(item.unitPrice)}</span>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
