import { Link } from "react-router-dom";
import { INFRA_CATALOGUE, INFRA_CATEGORY_ORDER, infraCatalogueEntries } from "../data/catalogue";
import { SEGMENTS } from "../data/segments";
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import ProjectDetailsCard from '../components/ProjectDetailsCard';

export default function HomePage() {
  const { isAuthenticated, login, logout, user } = useAuth();
  const segmentEntries = Object.entries(SEGMENTS);

  if (!isAuthenticated) {
    return (
      <div className="boq-app boq-auth-page">
        <div className="boq-form-card boq-auth-card">
          <div className="boq-auth-logo">
            <img src="/logo.png" alt="Sniper Presales Logo" />
          </div>
          <h1 className="boq-brand-title boq-auth-title">Sniper Presales</h1>
          <p className="boq-brand-sub" style={{ marginBottom: '2rem' }}>Sign in to access the BOQ Configuration Tool</p>

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <GoogleLogin
              onSuccess={(credentialResponse) => {
                if (credentialResponse.credential) {
                  login(credentialResponse.credential);
                }
              }}
              onError={() => {
                console.log('Login Failed');
              }}
              useOneTap
            />
          </div>

          <p className="boq-auth-note">
            Authorized personnel only. Please sign in with your corporate Gmail account.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="boq-app">
      <header className="boq-masthead">
        <div className="boq-header-left">
          <div className="boq-mark">
            <img
              src="/logo.png"
              alt="Sniper Presales Logo"
              className="boq-logo"
            />
          </div>
          <div>
            <div className="boq-brand-title">Sniper Presales Tool</div>
            <div className="boq-brand-sub">Bill of Quantity · Rev 9</div>
          </div>
        </div>
        <div className="boq-header-right">
          {user && (
            <div className="boq-user-block">
              <div className="boq-user-name">{user.name}</div>
              <div className="boq-user-email">{user.email}</div>
            </div>
          )}
          <button
            onClick={logout}
            className="boq-btn boq-btn-ghost boq-btn-sm"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="boq-home">
        <div className="boq-home-grid">
          <aside className="boq-home-intro">
            <p className="boq-eyebrow">Welcome back, {user?.name.split(' ')[0]}</p>
            <h1 className="boq-page-title">
              Configure infrastructure quotes with line-item precision.
            </h1>
            <p className="boq-page-lead">
              Build full-stack BOQs by vertical—compute, network, storage, hypervisor—or
              draft requirements and let the engine propose a bill.
            </p>
            <ProjectDetailsCard />
            <div className="boq-home-actions">
              <Link to="/segments" className="boq-btn boq-btn-primary boq-btn-lg">
                Open segment index
              </Link>
              <Link to="/ai" className="boq-btn boq-btn-accent boq-btn-lg">
                Requirements → BOQ
              </Link>
            </div>
            <div className="boq-home-meta">
              DOC-ID: BOQ-PLATFORM
              <br />
              {segmentEntries.length} verticals ·{" "}
              {INFRA_CATEGORY_ORDER.length} catalogue layers
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
                      <span className="boq-index-label">{seg.label}</span>
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
              {infraCatalogueEntries().map(([key, cat]) => {
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
