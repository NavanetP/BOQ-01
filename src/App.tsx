import { useEffect, useState } from "react";
import { Link, Navigate, Route, Routes, useNavigate, useParams } from "react-router-dom";
import { BRAND_COLORS, BRAND_LABELS, INFRA_CATEGORY_ORDER } from "./data/catalogue";
import { Icon } from "./components/Icons";
import { SEGMENTS } from "./data/segments";
import { useAppData, type ServerBrandsData, type ServerOptionsData } from "./hooks/useAppData";
import { useCatalogue } from "./hooks/useCatalogue";
import { useQuoteMoney } from "./hooks/useQuoteMoney";
import HomePage from "./pages/HomePage";
import ProductPage from "./pages/ProductPage";
import { downloadBoqPdf, type BoqPdfPayload } from "./utils/boqPdf";
import {
  computeTaxTotals,
  formatMoney,
  normalizeQuoteSettings,
  taxLineLabel,
  totalInclTaxLabel,
} from "./utils/currency";

const computeServerPrice = (cfg, serverBrands: ServerBrandsData | null, serverOptions: ServerOptionsData | null) => {
  if (!serverBrands || !serverOptions) return 0;
  const brand = serverBrands[cfg.brand]; if (!brand) return 0;
  const sd = brand.series[cfg.series]; if (!sd) return 0;
  const model = sd.models.find(m => m.id === cfg.modelId); if (!model) return 0;
  const cpuList = serverOptions.cpuOptions[cfg.cpuType] || serverOptions.cpuOptions.intel;
  const cpu = cpuList.find(c => c.id === cfg.cpuId) || cpuList[0];
  const ram = serverOptions.ramOptions.find(r => r.id === cfg.ramId) || serverOptions.ramOptions[0];
  const sto = serverOptions.storageOptions.find(s => s.id === cfg.storageId) || serverOptions.storageOptions[0];
  const nic = serverOptions.nicOptions.find(n => n.id === cfg.nicId) || serverOptions.nicOptions[0];
  const gpu = serverOptions.gpuOptions.find(g => g.id === cfg.gpuId) || serverOptions.gpuOptions[0];
  const os = serverOptions.osOptions.find(o => o.id === cfg.osId) || serverOptions.osOptions[0];
  const sup = serverOptions.supportOptions.find(s => s.id === cfg.supportId) || serverOptions.supportOptions[0];
  const psu = serverOptions.psuOptions.find(p => p.id === cfg.psuId) || serverOptions.psuOptions[0];
  return (model.basePrice + cpu.priceAdder * cfg.cpuCount + ram.priceAdder + sto.priceAdder + nic.priceAdder + gpu.priceAdder + os.priceAdder + sup.priceAdder + psu.priceAdder) * cfg.qty;
};

function buildBoqReportData({ projectInfo, serverConfigs, infraSelections, grandTotal, serverTotal, infraTotal, seg, rec, catalogue, serverBrands, serverOptions }) {
  const quote = normalizeQuoteSettings(projectInfo);
  const fx = quote.fxRate;
  const { subtotal, tax, total } = computeTaxTotals(grandTotal, quote);
  const refNo = `BOQ-${Date.now().toString(36).toUpperCase()}`;
  const today = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
  const serverLines = serverConfigs.map((cfg) => {
    const brand = serverBrands?.[cfg.brand];
    const model = brand?.series[cfg.series]?.models.find(m => m.id === cfg.modelId);
    const cpuList = cfg.cpuType === "amd" ? serverOptions?.cpuOptions.amd : serverOptions?.cpuOptions.intel;
    const cpu = cpuList?.find(c => c.id === cfg.cpuId);
    const ram = serverOptions?.ramOptions.find(r => r.id === cfg.ramId);
    const sto = serverOptions?.storageOptions.find(s => s.id === cfg.storageId);
    const nic = serverOptions?.nicOptions.find(n => n.id === cfg.nicId);
    const gpu = serverOptions?.gpuOptions.find(g => g.id === cfg.gpuId);
    const os = serverOptions?.osOptions.find(o => o.id === cfg.osId);
    const sup = serverOptions?.supportOptions.find(s => s.id === cfg.supportId);
    const psu = serverOptions?.psuOptions.find(p => p.id === cfg.psuId);
    const up = computeServerPrice({ ...cfg, qty: 1 }, serverBrands, serverOptions);
    const spec = [cpu ? `${cfg.cpuCount}x ${cpu.label}` : null, ram?.label, sto?.label, nic?.label, gpu?.id !== "gpu-none" ? gpu?.label : null, os?.id !== "os-none" ? os?.label : null, psu?.label, sup?.label].filter(Boolean).join(" | ");
    return { category: brand?.label || "Server", color: brand?.color || "#1e40af", icon: "server", name: model?.name || "-", spec, unitPrice: up * fx, qty: cfg.qty, total: up * cfg.qty * fx };
  });
  const infraLines = [];
  INFRA_CATEGORY_ORDER.forEach((layer) => {
    const items = infraSelections[layer];
    if (!items) return;
    const cat = catalogue?.categories[layer];
    if (!cat) return;
    Object.entries(items).forEach(([id, qty]) => { if (qty > 0) { const item = cat.items.find(i => i.id === id); if (item) infraLines.push({ category: cat.label, color: cat.color, icon: cat.icon, name: item.name, spec: item.spec, unitPrice: item.unitPrice * fx, qty, total: item.unitPrice * qty * fx }); } });
  });
  const allLines = [...serverLines, ...infraLines];
  const payload: BoqPdfPayload = {
    projectInfo,
    refNo,
    today,
    segmentLabel: seg?.label,
    rationale: rec?.rationale,
    allLines,
    serverTotal: serverTotal * fx,
    infraTotal: infraTotal * fx,
    grandTotal: subtotal,
    tax,
    total,
  };
  return { payload, allLines, refNo, today, tax, total, quote };
}

function BrandBadge({ brand }) {
  if (!brand) return null;
  return <span className="boq-brand-badge" style={{ background: BRAND_COLORS[brand] || "var(--boq-accent)" }}>{BRAND_LABELS[brand] || brand.toUpperCase()}</span>;
}

function Configurator() {
  const { segmentId, tab } = useParams();
  const navigate = useNavigate();
  const [segKey, setSegKey] = useState(null);
  const { projectInfo } = useProject();
  const { fmt, totalsFromUsd } = useQuoteMoney();
  const { catalogue, loading: catLoading, error: catError } = useCatalogue();
  const {
    segmentRecommendations,
    serverBrands,
    serverOptions,
    loading: appDataLoading,
    error: appDataError,
  } = useAppData();
  const [serverConfigs, setServerConfigs] = useState([]);
  const [infraSelections, setInfraSelections] = useState({});
  const [aiBoqResult, setAiBoqResult] = useState(null);

  const activeTab = tab === "report" ? "servers" : (tab || "servers");
  const validTabs = ["servers", "database", ...INFRA_CATEGORY_ORDER, "ai-result"];

  useEffect(() => {
    if (!segmentId || !SEGMENTS[segmentId]) return;
    if (segKey === segmentId) return;
    if (!segmentRecommendations) return;
    const rec = segmentRecommendations[segmentId];
    if (!rec) return;
    setServerConfigs([{ ...rec.servers }]);
    const ni = {};
    Object.entries(rec).forEach(([l, d]) => { if (l === "servers" || l === "rationale") return; ni[l] = {}; (d as any).items.forEach(id => { ni[l][id] = 1; }); });
    setInfraSelections(ni);
    setSegKey(segmentId);
  }, [segmentId, segKey, segmentRecommendations]);

  useEffect(() => {
    const stored = sessionStorage.getItem("aiBoqResult");
    if (stored) {
      try { setAiBoqResult(JSON.parse(stored)); sessionStorage.removeItem("aiBoqResult"); } catch { }
    }
  }, []);

  if (!segmentId || !SEGMENTS[segmentId]) return <Navigate to="/segments" replace />;
  if (tab && tab !== "report" && !validTabs.includes(tab)) return <Navigate to={`/segments/${segmentId}/servers`} replace />;

  // Show loading state while catalogue or app data is being fetched
  if (catLoading || appDataLoading) {
    return (
      <div className="boq-app">
        <header className="boq-header">
          <div className="boq-header-left">
            <div className="boq-mark">
              <img src="/logo.png" alt="Sniper Presales Logo" className="boq-logo" />
            </div>
          </div>
        </header>
        <main className="boq-container" style={{ padding: "3rem", textAlign: "center" }}>
          <p style={{ color: "var(--boq-ink-muted)", fontFamily: "var(--boq-mono)", fontSize: "0.75rem" }}>Loading catalogue...</p>
        </main>
      </div>
    );
  }

  // Show error state if catalogue or app data failed to load
  if (catError || appDataError || !catalogue || !serverBrands || !serverOptions) {
    return (
      <div className="boq-app">
        <header className="boq-header">
          <div className="boq-header-left">
            <Link to="/" className="boq-btn boq-btn-ghost boq-btn-sm">← Home</Link>
          </div>
        </header>
        <main className="boq-container" style={{ padding: "3rem" }}>
          <div className="boq-form-card">
            <div className="boq-form-card-header">
              <div className="boq-form-card-header-icon" style={{ border: "none", background: "transparent" }}>
                <Icon name="warning" size={20} style={{ color: "var(--boq-danger)" }} />
              </div>
              <div>
                <h2>Catalogue Unavailable</h2>
                <p>Cannot load product catalogue from server.</p>
              </div>
            </div>
            {(catError || appDataError) && (
              <div className="boq-form-body">
                <p style={{ color: "var(--boq-ink-soft)", fontSize: "0.875rem" }}>{catError || appDataError}</p>
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  const addServer = () => { const rec = segmentRecommendations?.[segKey]?.servers || {}; const brand = serverBrands?.[rec.brand || "dell"]; const sk = rec.series || Object.keys(brand?.series || {})[0]; setServerConfigs(p => [...p, { ...rec, brand: rec.brand || "dell", series: sk, modelId: rec.modelId || brand?.series[sk]?.models[0]?.id, qty: 1 }]); };
  const removeServer = (i) => setServerConfigs(p => p.filter((_, idx) => idx !== i));
  const updateServer = (i, f, v) => setServerConfigs(p => p.map((c, idx) => { if (idx !== i) return c; const u = { ...c, [f]: v }; if (f === "brand") { const b = serverBrands?.[v]; const s = Object.keys(b?.series || {})[0]; u.series = s; u.modelId = b?.series[s]?.models[0]?.id; u.cpuType = "intel"; u.cpuId = serverOptions?.cpuOptions.intel[0]?.id; } if (f === "series") u.modelId = serverBrands?.[c.brand]?.series[v]?.models[0]?.id || c.modelId; return u; }));
  const updateInfraQty = (layer, id, delta) => setInfraSelections(prev => { const cat = { ...(prev[layer] || {}) }; const n = Math.max(0, (cat[id] || 0) + delta); if (n === 0) delete cat[id]; else cat[id] = n; return { ...prev, [layer]: cat }; });

  const serverTotal = serverConfigs.reduce((a, c) => a + computeServerPrice(c, serverBrands, serverOptions), 0);
  const infraTotal = Object.entries(infraSelections).reduce((t, [layer, items]) => t + Object.entries(items).reduce((s, [id, qty]) => { const item = catalogue?.categories[layer]?.items.find(i => i.id === id); return s + (item ? item.unitPrice * qty : 0); }, 0), 0);
  const grandTotalUsd = serverTotal + infraTotal;
  const quoteTotals = totalsFromUsd(grandTotalUsd);
  const seg = segmentId ? SEGMENTS[segmentId] : null;
  const rec = segmentId ? segmentRecommendations?.[segmentId] : null;

  const handleGenerateBoq = () => {
    if (grandTotalUsd <= 0) return;
    const { payload } = buildBoqReportData({ projectInfo, serverConfigs, infraSelections, grandTotal: grandTotalUsd, serverTotal, infraTotal, seg, rec, catalogue, serverBrands, serverOptions });
    try {
      downloadBoqPdf(payload);
      navigate(`/segments/${segmentId}/report`);
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert(err instanceof Error ? err.message : "Could not generate PDF. Try Download PDF on the report page.");
      navigate(`/segments/${segmentId}/report`);
    }
  };

  if (tab === "report") {
    const report = buildBoqReportData({ projectInfo, serverConfigs, infraSelections, grandTotal: grandTotalUsd, serverTotal, infraTotal, seg, rec, catalogue, serverBrands, serverOptions });
    return <ReportView report={report} projectInfo={projectInfo} serverConfigs={serverConfigs} infraSelections={infraSelections} grandTotalUsd={grandTotalUsd} serverTotal={serverTotal} infraTotal={infraTotal} seg={seg} rec={rec} fmt={fmt} quote={report.quote} quoteTotals={quoteTotals} onBack={() => navigate(`/segments/${segmentId}/servers`)} catalogue={catalogue} />;
  }

  const tabCode = (key: string) => {
    if (key === "vmware") return "HV";
    if (key === "servers") return "SRV";
    if (key === "rack") return "RCK";
    if (key === "power") return "PWR";
    if (key === "network") return "NET";
    if (key === "database") return "DB";
    if (key === "storage") return "STG";
    if (key === "backup") return "BKP";
    if (key === "licenses") return "LIC";
    if (key === "monitoring") return "MON";
    if (key === "ai-result") return "AI";
    return key.slice(0, 3).toUpperCase();
  };
  const LAYER_TABS = [
    { key: "vmware", label: catalogue?.categories.vmware?.label ?? "Hypervisor" },
    { key: "servers", label: "Servers" },
    { key: "rack", label: catalogue?.categories.rack?.label ?? "Rack & Stack" },
    { key: "power", label: catalogue?.categories.power?.label ?? "Power" },
    { key: "network", label: catalogue?.categories.network?.label ?? "Network" },
    { key: "database", label: "Database" },
    { key: "storage", label: catalogue?.categories.storage?.label ?? "Storage" },
    { key: "backup", label: catalogue?.categories.backup?.label ?? "Backup" },
    { key: "licenses", label: catalogue?.categories.licenses?.label ?? "Licenses" },
    { key: "monitoring", label: catalogue?.categories.monitoring?.label ?? "Monitoring" },
  ] as const;

  return (
    <div className="boq-app">
      <header className="boq-header">
        <div className="boq-header-left">
          <div className="boq-mark">
            <img src="/logo.png" alt="Sniper Presales Logo" className="boq-logo" />
          </div>
          <div className="boq-header-brand-text">
            <div className="boq-brand-title">Sniper datacenter Presales</div>
            <div className="boq-brand-sub">BOQ Configurator · v9</div>
          </div>
          {seg && <span className="boq-badge" style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}><Icon name={seg.icon} size={11} /> {seg.label}</span>}
        </div>
        <div className="boq-header-actions">
          <Link to="/" className="boq-btn boq-btn-ghost boq-btn-sm" style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
            <Icon name="home" size={13} />
            <span className="boq-header-nav-label">Home</span>
          </Link>
          <button type="button" onClick={() => navigate("/ai")} className="boq-btn boq-btn-ghost boq-btn-sm" style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
            <Icon name="sparkles" size={13} />
            <span className="boq-header-nav-label">AI BOQ</span>
          </button>
          <button type="button" onClick={() => navigate("/segments")} className="boq-btn boq-btn-ghost boq-btn-sm" style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
            <Icon name="menu" size={13} />
            <span className="boq-header-nav-label">Segments</span>
          </button>
          {grandTotalUsd > 0 && (
            <div
              className="boq-header-nav-label"
              style={{
                display: "flex",
                gap: "0.3rem",
                fontFamily: "var(--boq-mono)",
                fontSize: "0.5rem",
                color: "var(--boq-ink-muted)",
                letterSpacing: "0.04em",
              }}
            >
              <span style={{ color: "var(--boq-ink-soft)" }}>SRV</span>
              <span style={{ color: "var(--boq-accent)", fontWeight: 700 }}>{fmt(serverTotal)}</span>
              <span>·</span>
              <span style={{ color: "var(--boq-ink-soft)" }}>INFRA</span>
              <span style={{ color: "var(--boq-teal)", fontWeight: 700 }}>{fmt(infraTotal)}</span>
            </div>
          )}
          <div className="boq-total-pill">
            <span>TOTAL</span>
            <span>{fmt(grandTotalUsd)}</span>
          </div>
          <button type="button" onClick={handleGenerateBoq} disabled={grandTotalUsd === 0} className="boq-btn boq-btn-primary boq-btn-sm" style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
            <Icon name="arrow_right" size={13} />
            <span className="boq-header-nav-label">Generate BOQ</span>
          </button>
        </div>
      </header>
      <HypervisorSelector infraSelections={infraSelections} updateInfraQty={updateInfraQty} rec={rec} seg={seg} />
      <div className="boq-layout">
        <aside className="boq-sidebar">
          {/* Grand total summary strip */}
          {grandTotalUsd > 0 && (
            <div
              style={{
                margin: "0 0 0.75rem",
                padding: "0.6rem 0.75rem",
                background: "var(--boq-accent-muted)",
                border: "1px solid var(--boq-accent-light)",
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
                  color: "var(--boq-accent)",
                  marginBottom: "0.35rem",
                }}
              >
                Quote summary
              </div>
              {[
                { label: "Servers", value: fmt(serverTotal), color: "var(--boq-ink)" },
                { label: "Infrastructure", value: fmt(infraTotal), color: "var(--boq-teal)" },
              ].map(row => (
                <div
                  key={row.label}
                  style={{ display: "flex", justifyContent: "space-between", fontSize: "0.6875rem", marginBottom: "0.15rem" }}
                >
                  <span style={{ color: "var(--boq-ink-muted)" }}>{row.label}</span>
                  <span style={{ fontFamily: "var(--boq-mono)", fontWeight: 700, color: row.color }}>{row.value}</span>
                </div>
              ))}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: "0.35rem",
                  paddingTop: "0.35rem",
                  borderTop: "1px solid var(--boq-accent-light)",
                  fontSize: "0.75rem",
                }}
              >
                <span style={{ fontWeight: 700, color: "var(--boq-ink)" }}>Total</span>
                <span style={{ fontFamily: "var(--boq-mono)", fontWeight: 700, color: "var(--boq-accent)" }}>{fmt(grandTotalUsd)}</span>
              </div>
            </div>
          )}
          <p className="boq-label" style={{ marginBottom: "0.5rem" }}>Infrastructure Layers</p>
          <nav className="boq-nav-tabs">
            {LAYER_TABS.map(t => {
              const hasRec = t.key === "servers"
                ? (serverConfigs.length > 0)
                : t.key === "database"
                  ? (Object.keys(infraSelections.sql_database || {}).length > 0 || Object.keys(infraSelections.nosql_database || {}).length > 0)
                  : (infraSelections[t.key] && Object.keys(infraSelections[t.key]).length > 0);
              const isActive = (tab || "servers") === t.key;

              // Per-layer subtotal
              const layerTotal = (() => {
                if (t.key === "servers") return serverTotal;
                if (t.key === "database") {
                  const sqlT = Object.entries(infraSelections.sql_database || {}).reduce((s, [id, q]) => s + (catalogue?.categories.sql_database?.items.find(i => i.id === id)?.unitPrice || 0) * (q as number), 0);
                  const nosqlT = Object.entries(infraSelections.nosql_database || {}).reduce((s, [id, q]) => s + (catalogue?.categories.nosql_database?.items.find(i => i.id === id)?.unitPrice || 0) * (q as number), 0);
                  return sqlT + nosqlT;
                }
                return Object.entries(infraSelections[t.key] || {}).reduce((s, [id, q]) => s + (catalogue?.categories[t.key]?.items.find(i => i.id === id)?.unitPrice || 0) * (q as number), 0);
              })();

              return (
                <button key={t.key} type="button" onClick={() => navigate(`/segments/${segmentId}/${t.key}`)} className={`boq-nav-tab${isActive ? " boq-nav-tab-active" : ""}`} >
                  <span className="boq-nav-tab-code">{tabCode(t.key)}</span>
                  <span className="boq-nav-tab-label">{t.label}</span>
                  {layerTotal > 0 ? (
                    <span
                      style={{
                        fontFamily: "var(--boq-mono)",
                        fontSize: "0.5rem",
                        fontWeight: 700,
                        color: isActive ? "rgba(255,255,255,0.8)" : "var(--boq-accent)",
                        marginLeft: "auto",
                        flexShrink: 0,
                        letterSpacing: "0.02em",
                      }}
                    >
                      {fmt(layerTotal)}
                    </span>
                  ) : hasRec ? (
                    <span className="boq-nav-dot" />
                  ) : null}
                </button>
              );
            })}
          </nav>

          <div className="boq-nav-cutout">
            <div className="boq-nav-cutout-label">AI BOQ</div>
            <button
              type="button"
              onClick={() => navigate(`/segments/${segmentId}/ai-result`)}
              className={`boq-nav-tab boq-nav-tab-ai${(tab || "servers") === "ai-result" ? " boq-nav-tab-active" : ""}`}
            >
              <span className="boq-nav-tab-code">{tabCode("ai-result")}</span>
              <span className="boq-nav-tab-label">Generated BOQ</span>
              {!!aiBoqResult && <span className="boq-nav-dot" />}
            </button>
            <button
              type="button"
              onClick={() => navigate("/ai")}
              className="boq-btn boq-btn-primary boq-btn-lg"
              style={{ marginTop: "0.65rem" }}
            >
              Run requirements engine
            </button>
          </div>
        </aside>
        <main className="boq-main boq-fade" key={activeTab}>
          {activeTab === "ai-result"
            ? <AIResultPanel result={aiBoqResult} fmt={fmt} onRerun={() => navigate("/ai")} />
            : activeTab === "servers"
              ? <ServerPanel configs={serverConfigs} updateConfig={updateServer} addConfig={addServer} removeConfig={removeServer} seg={seg} rec={rec} fmt={fmt} serverBrands={serverBrands} serverOptions={serverOptions} />
              : activeTab === "database"
                ? <>
                    <InfraPanel
                      cat={catalogue?.categories.sql_database}
                      categoryKey="sql_database"
                      selections={infraSelections.sql_database || {}}
                      updateQty={(id, d) => updateInfraQty("sql_database", id, d)}
                      rec={rec?.sql_database}
                      seg={seg}
                      fmt={fmt}
                    />
                    <div style={{ height: "20px" }} />
                    <InfraPanel
                      cat={catalogue?.categories.nosql_database}
                      categoryKey="nosql_database"
                      selections={infraSelections.nosql_database || {}}
                      updateQty={(id, d) => updateInfraQty("nosql_database", id, d)}
                      rec={rec?.nosql_database}
                      seg={seg}
                      fmt={fmt}
                    />
                  </>
                : <InfraPanel cat={catalogue?.categories[activeTab]} categoryKey={activeTab} selections={infraSelections[activeTab] || {}} updateQty={(id, d) => updateInfraQty(activeTab, id, d)} rec={rec?.[activeTab]} seg={seg} fmt={fmt} />
          }
        </main>
      </div>
    </div>
  );
}

const HV_VENDORS = [
  { key: "vmware", label: "VMware", color: "#607078", icon: "vmware_brand", ids: ["vm-vsphere", "vm-vcenter", "vm-vsan", "vm-nsx", "vm-horizon", "vm-vrops"] },
  { key: "microsoft", label: "Microsoft", color: "#0078d4", icon: "microsoft_brand", ids: ["hv-hyperv", "hv-scvmm", "hv-azstack"] },
  { key: "redhat", label: "Red Hat", color: "#cc0000", icon: "redhat_brand", ids: ["hv-ocp", "hv-oshift-virt", "hv-ocp-storage"] },
  { key: "oracle", label: "Oracle", color: "#f80000", icon: "oracle_brand", ids: ["hv-oracle-vm", "hv-oracle-olvm", "hv-oracle-oci-hci"] },
  { key: "nutanix", label: "Nutanix", color: "#024da1", icon: "nutanix_brand", ids: ["hv-nutanix-aos", "hv-nutanix-prism", "hv-nutanix-nc2", "hv-nutanix-files"] },
  { key: "hpe", label: "HPE", color: "#01a982", icon: "hpe_brand", ids: ["hv-hpe-morpheus", "hv-hpe-simplivity", "hv-hpe-synergy-cm"] },
];

function HypervisorSelector({ infraSelections, updateInfraQty, rec, seg, catalogue }) {
  const { fmt } = useQuoteMoney();
  const hvItems = catalogue?.categories.vmware?.items || [];
  const selectedIds = Object.keys(infraSelections.vmware || {});
  const [expanded, setExpanded] = useState(false);

  const toggleHv = (id) => {
    const cur = (infraSelections.vmware || {})[id] || 0;
    if (cur > 0) { updateInfraQty("vmware", id, -cur); }
    else { updateInfraQty("vmware", id, 1); }
  };

  const recIds = rec?.vmware?.items || [];
  const totalSelected = selectedIds.length;

  return (
    <div className="boq-hypervisor-selector">
      <div className="boq-hv-header" onClick={() => setExpanded(e => !e)}>
        <div className="boq-hv-icon">HV</div>
        <div style={{ flex: 1 }}>
          <div className="boq-hv-title">Hypervisor / Virtualisation Stack</div>
          <div className="boq-hv-sub">
            {totalSelected > 0
              ? <span>{totalSelected} selected — <span className="boq-text-accent">{selectedIds.map(id => hvItems.find(i => i.id === id)?.name.split(" ").slice(0, 2).join(" ")).join(", ")}</span></span>
              : "Expand to select hypervisors for this project"
            }
          </div>
        </div>
        {totalSelected > 0 && <span className="boq-pill-accent">{totalSelected} selected</span>}
        <span className={`boq-hv-chevron${expanded ? " boq-hv-chevron-open" : ""}`} style={{ display: "inline-flex", alignItems: "center" }}>
          <Icon name={expanded ? "chevron_up" : "chevron_down"} size={14} />
        </span>
      </div>
      {expanded && (
        <div>
          {recIds.length > 0 && (
            <div className="boq-hv-recommendations">
              <span className="boq-text-accent">Recommended for {seg?.label}:</span>{" "}
              {recIds.map(id => { const it = hvItems.find(i => i.id === id); const active = (infraSelections.vmware || {})[id] > 0; return it ? <button key={id} type="button" onClick={() => { if (!active) updateInfraQty("vmware", id, 1); }} className={`boq-hv-rec-btn${active ? " boq-hv-rec-btn-active" : ""}`}>{it.name.split(" ").slice(0, 3).join(" ")}</button> : null; })}
            </div>
          )}
          {HV_VENDORS.map(vendor => {
            const vendorItems = vendor.ids.map(id => hvItems.find(i => i.id === id)).filter(Boolean);
            if (!vendorItems.length) return null;
            const vendorSelected = vendorItems.filter(i => (infraSelections.vmware || {})[i.id] > 0).length;
            return (
              <div key={vendor.key} className="boq-hv-vendor-group">
                <div className="boq-hv-vendor-label" style={{ color: vendor.color }}>
                  {vendor.label}
                  {vendorSelected > 0 && <span className="boq-pill-accent">{vendorSelected}/{vendorItems.length}</span>}
                </div>
                <div className="boq-hv-chip-grid">
                  {vendorItems.map(item => {
                    const isSelected = (infraSelections.vmware || {})[item.id] > 0;
                    return (
                      <button key={item.id} type="button" onClick={() => toggleHv(item.id)}
                        className={`boq-hv-chip${isSelected ? " boq-hv-chip-selected" : ""}`}
                        style={isSelected ? { borderColor: vendor.color } : undefined}>
                        {isSelected && <Icon name="check" size={12} style={{ color: vendor.color, marginRight: 4 }} />}
                        <span>
                          <div style={{ lineHeight: 1.2 }}>{item.name}</div>
                          <div className="boq-hv-chip-price">{item.unitPrice === 0 ? "Free" : fmt(item.unitPrice)}</div>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
          <div className="boq-hv-footer">
            <span style={{ fontSize: "0.6875rem", color: "var(--boq-ink-muted)" }}>{hvItems.length} hypervisor products</span>
            <button type="button" onClick={() => setExpanded(false)} className="boq-btn boq-btn-ghost boq-btn-sm">Done</button>
          </div>
        </div>
      )}
    </div>
  );
}

// Complexity tier derived from recommended item count
function segmentTier(itemCount: number): { label: string; color: string } {
  if (itemCount >= 35) return { label: "Enterprise", color: "var(--boq-danger)" };
  if (itemCount >= 25) return { label: "High", color: "var(--boq-accent)" };
  if (itemCount >= 15) return { label: "Mid", color: "var(--boq-teal)" };
  return { label: "Standard", color: "var(--boq-ink-muted)" };
}

// Per-layer item count breakdown for a segment
function segmentLayerBreakdown(key: string, segmentRecommendations: Record<string, any> | null) {
  const rec = segmentRecommendations?.[key];
  if (!rec) return [];
  return [
    { code: "SRV", count: 1 },
    { code: "NET", count: rec.network?.items.length ?? 0 },
    { code: "STG", count: rec.storage?.items.length ?? 0 },
    { code: "BKP", count: rec.backup?.items.length ?? 0 },
    { code: "MON", count: rec.monitoring?.items.length ?? 0 },
    { code: "DB",  count: (rec.sql_database?.items.length ?? 0) + (rec.nosql_database?.items.length ?? 0) },
    { code: "HV",  count: rec.vmware?.items.length ?? 0 },
  ].filter(l => l.count > 0);
}

function SegmentScreen({ onSelect, onAI }) {
  const [hov, setHov] = useState<string | null>(null);
  const { catalogue, loading: catLoading } = useCatalogue();
  const { segmentRecommendations } = useAppData();
  const totalSkus = catalogue
    ? Object.values(catalogue.categories).reduce((a, c) => a + c.items.length, 0)
    : null;
  return (
    <div className="boq-app">
      {/* Proper masthead */}
      <header className="boq-masthead">
        <div className="boq-header-left">
          <Link to="/" className="boq-btn boq-btn-ghost boq-btn-sm">← Home</Link>
          <div className="boq-header-divider" />
          <div className="boq-header-brand-text">
            <div className="boq-brand-title">Sniper Datacenter Presales</div>
            <div className="boq-brand-sub">Segment Index · BOQ Platform</div>
          </div>
        </div>
        <div className="boq-header-right">
          <button
            type="button"
            onClick={onAI}
            className="boq-btn boq-btn-accent boq-btn-sm"
            style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
          >
            <Icon name="sparkles" size={13} />
            <span className="boq-header-nav-label">Requirements → BOQ</span>
          </button>
        </div>
      </header>

      <div className="boq-segment-page" style={{ position: "relative" }}>
        {/* Hero */}
        <div className="boq-segment-hero">
          <p className="boq-eyebrow">Segment index</p>
          <h1 className="boq-page-title">Select industry vertical</h1>
          <p className="boq-page-lead">
            Each vertical loads a pre-configured full-stack — compute, network, storage,
            hypervisor, backup, monitoring, database — all tuned to that sector's
            requirements and compliance needs.
          </p>
          {/* Quick stat row */}
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.75rem" }}>
            {[
              { label: "Verticals", value: Object.keys(SEGMENTS).length },
              { label: "Catalogue layers", value: INFRA_CATEGORY_ORDER.length },
              { label: "Total SKUs", value: catLoading ? "…" : (totalSkus ?? "—") },
            ].map(s => (
              <div
                key={s.label}
                style={{
                  padding: "0.35rem 0.75rem",
                  background: "var(--boq-paper-bright)",
                  border: "1px solid var(--boq-rule)",
                  borderRadius: "var(--boq-radius-sm)",
                  display: "flex",
                  alignItems: "baseline",
                  gap: "0.4rem",
                }}
              >
                <span style={{ fontFamily: "var(--boq-mono)", fontWeight: 700, fontSize: "0.875rem", color: "var(--boq-accent)" }}>
                  {s.value}
                </span>
                <span style={{ fontFamily: "var(--boq-mono)", fontSize: "0.5rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--boq-ink-muted)" }}>
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Segment cards */}
        <div className="boq-segment-grid">
          {Object.entries(SEGMENTS).map(([key, seg], i) => {
            const rec = segmentRecommendations?.[key];
            const totalItems = rec ? Object.values(rec).reduce<number>((a, v) =>
              typeof v === "object" && v !== null && "items" in v ? a + (v as { items: unknown[] }).items.length : a, 0) : 0;
            const tier = segmentTier(totalItems);
            const layers = segmentLayerBreakdown(key, segmentRecommendations);
            const active = hov === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => onSelect(key)}
                onMouseEnter={() => setHov(key)}
                onMouseLeave={() => setHov(null)}
                className={`boq-segment-card${active ? " boq-segment-card-active" : ""}`}
                style={{ paddingTop: "0.875rem", paddingBottom: "0.875rem", alignItems: "flex-start", gridTemplateColumns: "2.5rem 1fr" }}
              >
                {/* Index number */}
                <span className="boq-seg-code" style={{ paddingTop: "0.1rem" }}>
                  {String(i + 1).padStart(2, "0")}
                </span>

                {/* Main content */}
                <span style={{ display: "flex", flexDirection: "column", gap: "0.4rem", minWidth: 0 }}>
                  {/* Title row */}
                  <span style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                    <span className="boq-index-label">{seg.label}</span>
                    {/* Complexity tier badge */}
                    <span style={{
                      fontFamily: "var(--boq-mono)",
                      fontSize: "0.45rem",
                      fontWeight: 700,
                      letterSpacing: "0.07em",
                      textTransform: "uppercase",
                      color: tier.color,
                      border: `1px solid ${tier.color}`,
                      borderRadius: "var(--boq-radius-sm)",
                      padding: "0.1rem 0.35rem",
                      opacity: 0.85,
                    }}>
                      {tier.label}
                    </span>
                  </span>

                  {/* Description */}
                  <span className="boq-index-desc">{seg.description}</span>

                  {/* Layer breakdown chips */}
                  <span style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap", marginTop: "0.1rem" }}>
                    {layers.map(l => (
                      <span
                        key={l.code}
                        style={{
                          fontFamily: "var(--boq-mono)",
                          fontSize: "0.45rem",
                          fontWeight: 700,
                          letterSpacing: "0.06em",
                          background: active ? "rgba(26,77,124,0.12)" : "var(--boq-paper-elevated)",
                          border: "1px solid var(--boq-rule-dark)",
                          borderRadius: "3px",
                          padding: "0.1rem 0.3rem",
                          color: "var(--boq-ink-muted)",
                        }}
                      >
                        {l.code} {l.count}
                      </span>
                    ))}
                    <span style={{
                      fontFamily: "var(--boq-mono)",
                      fontSize: "0.45rem",
                      fontWeight: 700,
                      letterSpacing: "0.06em",
                      background: active ? "rgba(26,77,124,0.12)" : "var(--boq-accent-muted)",
                      border: "1px solid var(--boq-accent-light)",
                      borderRadius: "3px",
                      padding: "0.1rem 0.3rem",
                      color: "var(--boq-accent)",
                    }}>
                      {totalItems} items →
                    </span>
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ServerPanel({ configs, updateConfig, addConfig, removeConfig, seg, rec, fmt, serverBrands, serverOptions }) {
  const Sel = ({ value, onChange, children, mono }) => (<select value={value} onChange={e => onChange(e.target.value)} className={`boq-select${mono ? " boq-input-mono" : ""}`}>{children}</select>);
  const F = ({ label, children }) => (<div className="boq-form-field"><label className="boq-label">{label}</label>{children}</div>);
  const TB = ({ active, color, onClick, children }) => (<button type="button" onClick={onClick} className="boq-toggle-btn" style={{ flex: 1, borderColor: active ? color : undefined, background: active ? `${color}18` : undefined, color: active ? color : undefined, fontWeight: active ? 700 : 500 }}>{children}</button>);
  return (
    <div>
      {seg && rec && (
        <div className="boq-callout" style={{ marginBottom: "1.125rem" }}>
          <div className="boq-callout-title">{seg.label} — recommended server</div>
          <div style={{ fontSize: "0.8125rem", color: "var(--boq-ink-soft)", lineHeight: 1.65 }}>{(rec.servers as any).reason}</div>
        </div>
      )}
      <div className="boq-panel-toolbar">
        <h2 className="boq-panel-title">Server configuration</h2>
        <button type="button" onClick={addConfig} className="boq-btn boq-btn-ghost">+ Add Server Row</button>
      </div>
      {configs.map((cfg, idx) => {
        const brand = serverBrands?.[cfg.brand];
        const seriesData = brand?.series[cfg.series];
        const model = seriesData?.models.find(m => m.id === cfg.modelId);
        const cpuList = cfg.cpuType === "amd" ? serverOptions?.cpuOptions.amd : serverOptions?.cpuOptions.intel;
        const unitPrice = computeServerPrice({ ...cfg, qty: 1 }, serverBrands, serverOptions);
        const tierColor = { "Entry": "var(--boq-ink-muted)", "Mid-range": "var(--boq-teal)", "High-end": "var(--boq-accent)", "Mission Critical": "var(--boq-danger)" }[model?.tier] || "var(--boq-ink-muted)";
        return (
          <div key={idx} className="boq-server-card" style={{ borderLeft: `3px solid ${brand?.color || "var(--boq-accent)"}` }}>
            <div className="boq-server-card-header">
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span className="boq-brand-badge" style={{ background: brand?.color }}>{brand?.logo}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "0.8125rem", color: "var(--boq-ink)" }}>{model?.name || "Select Model"}</div>
                  <div style={{ fontSize: "0.6875rem", color: "var(--boq-ink-muted)" }}>Server {idx + 1} · {model?.formFactor || "—"} · <span style={{ color: tierColor, fontWeight: 600 }}>{model?.tier}</span></div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--boq-ink)", fontFamily: "var(--boq-mono)" }}>{fmt(unitPrice * cfg.qty)}</div>
                  <div style={{ fontSize: "0.5625rem", color: "var(--boq-ink-muted)" }}>{cfg.qty}x @ {fmt(unitPrice)}</div>
                </div>
                 {configs.length > 1 && <button type="button" onClick={() => removeConfig(idx)} className="boq-remove-btn" aria-label="Remove server" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}><Icon name="close" size={12} /></button>}
              </div>
            </div>
            <div className="boq-server-card-body">
              <div className="boq-server-grid">
                <F label="Brand"><div style={{ display: "flex", gap: 5 }}>{Object.entries(serverBrands || {}).map(([k, b]) => <TB key={k} active={cfg.brand === k} color={(b as any).color} onClick={() => updateConfig(idx, "brand", k)}>{(b as any).logo}</TB>)}</div></F>
                <F label="Series"><Sel value={cfg.series} onChange={v => updateConfig(idx, "series", v)}>{Object.keys(brand?.series || {}).map(s => <option key={s} value={s}>{s}</option>)}</Sel></F>
                <F label="Model"><Sel value={cfg.modelId} onChange={v => updateConfig(idx, "modelId", v)} mono>{seriesData?.models.map(m => <option key={m.id} value={m.id}>{m.name} · {m.tier}</option>)}</Sel></F>
                <F label="CPU Arch"><div style={{ display: "flex", gap: 5 }}><TB active={cfg.cpuType === "intel"} color="#3b82f6" onClick={() => updateConfig(idx, "cpuType", "intel")}>Intel Xeon</TB><TB active={cfg.cpuType === "amd"} color="#ef4444" onClick={() => updateConfig(idx, "cpuType", "amd")}>AMD EPYC</TB></div></F>
                <F label="Processor"><Sel value={cfg.cpuId} onChange={v => updateConfig(idx, "cpuId", v)} mono>{cpuList?.map(c => <option key={c.id} value={c.id}>{c.label} (+{fmt(c.priceAdder)})</option>)}</Sel></F>
                <F label="CPU Count"><div style={{ display: "flex", gap: 5 }}>{[1, 2, 4, 8].map(n => <TB key={n} active={cfg.cpuCount === n} color="#0369a1" onClick={() => updateConfig(idx, "cpuCount", n)}>{n}×</TB>)}</div></F>
                <F label="Memory"><Sel value={cfg.ramId} onChange={v => updateConfig(idx, "ramId", v)}>{serverOptions?.ramOptions.map(r => <option key={r.id} value={r.id}>{r.label} (+{fmt(r.priceAdder)})</option>)}</Sel></F>
                <F label="Local Storage"><Sel value={cfg.storageId} onChange={v => updateConfig(idx, "storageId", v)}>{serverOptions?.storageOptions.map(s => <option key={s.id} value={s.id}>{s.label} (+{fmt(s.priceAdder)})</option>)}</Sel></F>
                <F label="NIC"><Sel value={cfg.nicId} onChange={v => updateConfig(idx, "nicId", v)}>{serverOptions?.nicOptions.map(n => <option key={n.id} value={n.id}>{n.label} (+{fmt(n.priceAdder)})</option>)}</Sel></F>
                <F label="GPU"><Sel value={cfg.gpuId} onChange={v => updateConfig(idx, "gpuId", v)}>{serverOptions?.gpuOptions.map(g => <option key={g.id} value={g.id}>{g.label}{g.priceAdder > 0 ? ` (+${fmt(g.priceAdder)})` : ""}</option>)}</Sel></F>
                <F label="OS"><Sel value={cfg.osId} onChange={v => updateConfig(idx, "osId", v)}>{serverOptions?.osOptions.map(o => <option key={o.id} value={o.id}>{o.label}{o.priceAdder > 0 ? ` (+${fmt(o.priceAdder)})` : ""}</option>)}</Sel></F>
                <F label="PSU"><Sel value={cfg.psuId} onChange={v => updateConfig(idx, "psuId", v)}>{serverOptions?.psuOptions.map(p => <option key={p.id} value={p.id}>{p.label} (+{fmt(p.priceAdder)})</option>)}</Sel></F>
                <F label="Support"><Sel value={cfg.supportId} onChange={v => updateConfig(idx, "supportId", v)}>{serverOptions?.supportOptions.map(s => <option key={s.id} value={s.id}>{s.label} (+{fmt(s.priceAdder)})</option>)}</Sel></F>
                <F label="Quantity"><div className="boq-qty-control">
                  <button type="button" onClick={() => updateConfig(idx, "qty", Math.max(1, cfg.qty - 1))} className="boq-qty-btn" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}><Icon name="minus" size={10} /></button>
                  <input type="number" min={1} value={cfg.qty} onChange={e => updateConfig(idx, "qty", Math.max(1, parseInt(e.target.value) || 1))} className="boq-qty-input" />
                  <button type="button" onClick={() => updateConfig(idx, "qty", cfg.qty + 1)} className="boq-qty-btn" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}><Icon name="plus" size={10} /></button>
                </div></F>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function InfraPanel({ cat, categoryKey, selections, updateQty, rec, seg, fmt }) {
  // Guard: return null if cat is undefined (shouldn't happen if Configurator guards properly)
  if (!cat) {
    return (
      <div style={{ padding: "2rem", textAlign: "center", color: "var(--boq-ink-muted)" }}>
        <p>Category not found: {categoryKey}</p>
      </div>
    );
  }

  const isHypervisor = cat.label === "Hypervisor / Virtualisation";
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [brandFilter, setBrandFilter] = useState("all");

  useEffect(() => {
    setBrandFilter("all");
    setSelectedVendor(null);
  }, [categoryKey]);

  // For hypervisor tab: vendor-grouped view
  if (isHypervisor) {
    const recIds = rec?.items || [];
    const visibleItems = selectedVendor
      ? HV_VENDORS.find(v => v.key === selectedVendor)?.ids.map(id => cat.items.find(i => i.id === id)).filter(Boolean) || []
      : [];

    return (
      <div>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <div style={{ width: 44, height: 44, background: `${cat.color}18`, border: `2px solid ${cat.color}35`, borderRadius: 11, display: "flex", alignItems: "center", justifyContent: "center", color: cat.color }}>
            <Icon name={cat.icon} size={20} />
          </div>
          <div>
            <h2 style={{ fontWeight: 700, fontSize: 17, color: "#0f2644" }}>{cat.label}</h2>
            <div style={{ fontSize: 10, color: "#7aa3c0" }}>{cat.items.length} products across {HV_VENDORS.length} vendors{rec ? ` · ${recIds.length} recommended for ${seg?.label}` : ""}</div>
          </div>
        </div>

        {/* Recommended banner */}
        {rec && seg && (
          <div style={{ background: `${seg.color}08`, border: `1.5px solid ${seg.color}30`, borderRadius: 10, padding: "12px 16px", marginBottom: 16 }}>
            <div style={{ fontSize: 10, color: seg.color, fontWeight: 700, marginBottom: 8, display: "flex", alignItems: "center", gap: "0.3rem" }}>
              <Icon name="sparkles" size={11} /> Recommended for {seg.label}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {recIds.map(id => {
                const item = cat.items.find(i => i.id === id); if (!item) return null;
                const qty = selections[id] || 0;
                return (
                  <button key={id} onClick={() => updateQty(id, qty > 0 ? -qty : 1)}
                    style={{ display: "inline-flex", alignItems: "center", gap: 5, background: qty > 0 ? `${seg.color}20` : `${seg.color}08`, border: `1.5px solid ${qty > 0 ? seg.color : seg.color + "40"}`, borderRadius: 6, padding: "5px 10px", fontSize: 10, color: seg.color, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all 0.12s" }}>
                    {qty > 0 && <Icon name="check" size={11} style={{ marginRight: 3 }} />}{item.name.split("(")[0].trim()}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Vendor selector cards */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#1e3a5f", letterSpacing: 1, textTransform: "uppercase", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
            <Icon name="server" size={12} /> Select Hypervisor Vendor
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(155px,1fr))", gap: 10 }}>
            {HV_VENDORS.map(vendor => {
              const vendorItems = vendor.ids.map(id => cat.items.find(i => i.id === id)).filter(Boolean);
              const selectedCount = vendorItems.filter(i => (selections[i.id] || 0) > 0).length;
              const hasRec = vendorItems.some(i => recIds.includes(i.id));
              const isActive = selectedVendor === vendor.key;
              return (
                <button key={vendor.key} onClick={() => setSelectedVendor(isActive ? null : vendor.key)}
                  style={{ padding: "14px 12px", borderRadius: 12, border: `2px solid ${isActive ? vendor.color : selectedCount > 0 ? vendor.color + "60" : "#e0e7ff"}`, background: isActive ? `${vendor.color}12` : selectedCount > 0 ? `${vendor.color}06` : "#fff", cursor: "pointer", textAlign: "left", fontFamily: "inherit", transition: "all 0.15s", boxShadow: isActive ? `0 4px 16px ${vendor.color}25` : "0 1px 4px #1e40af06", position: "relative" }}>
                  {hasRec && <span style={{ position: "absolute", top: 8, right: 8, width: 7, height: 7, borderRadius: "50%", background: seg?.color || "#8b5cf6", border: "1.5px solid #fff" }} />}
                  <div style={{ marginBottom: 7, color: vendor.color }}><Icon name={vendor.icon} size={24} /></div>
                  <div style={{ fontWeight: 700, fontSize: 12, color: isActive ? vendor.color : "#0f2644", marginBottom: 3 }}>{vendor.label}</div>
                  <div style={{ fontSize: 9, color: "#7aa3c0", marginBottom: 8 }}>{vendorItems.length} products</div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    {selectedCount > 0
                      ? <span style={{ fontSize: 9, fontWeight: 700, color: vendor.color, background: `${vendor.color}15`, borderRadius: 10, padding: "2px 7px" }}>{selectedCount} added</span>
                      : <span style={{ fontSize: 9, color: "#c0d4e8" }}>none selected</span>
                    }
                    <span style={{ display: "inline-flex", color: isActive ? vendor.color : "#bfdbfe" }}>
                      <Icon name={isActive ? "chevron_up" : "chevron_down"} size={12} />
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Products for selected vendor */}
        {selectedVendor && (
          <div style={{ animation: "fadeIn 0.2s ease" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, paddingBottom: 10, borderBottom: "1.5px solid #e0e7ff" }}>
              {(() => {
                const v = HV_VENDORS.find(v => v.key === selectedVendor); return (<>
                  <span style={{ display: "inline-flex", color: v.color }}><Icon name={v.icon} size={18} /></span>
                  <span style={{ fontWeight: 700, fontSize: 14, color: v.color }}>{v.label} Products</span>
                  <span style={{ fontSize: 10, color: "#7aa3c0", marginLeft: "auto" }}>{visibleItems.length} items</span>
                </>);
              })()}
            </div>
            {visibleItems.map(item => {
              const qty = selections[item.id] || 0;
              const isRec = recIds.includes(item.id);
              const reason = rec?.reasons?.[item.id];
              const vColor = HV_VENDORS.find(v => v.key === selectedVendor)?.color || cat.color;
              return (
                <div key={item.id} style={{ background: qty > 0 ? `${vColor}06` : "#fff", border: `2px solid ${qty > 0 ? vColor : isRec ? vColor + "45" : "#dbeafe"}`, borderRadius: 11, padding: "13px 16px", marginBottom: 9, transition: "all 0.15s", boxShadow: qty > 0 ? `0 2px 12px ${vColor}18` : "0 1px 3px #1e40af05" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5, flexWrap: "wrap" }}>
                        {isRec && <span style={{ background: `${seg?.color}25`, border: `1px solid ${seg?.color}50`, borderRadius: 4, padding: "2px 7px", fontSize: 9, color: seg?.color, fontWeight: 700, flexShrink: 0, display: "inline-flex", alignItems: "center", gap: "0.2rem" }}><Icon name="sparkles" size={8} /> RECOMMENDED</span>}
                        <span style={{ fontWeight: 700, fontSize: 13, color: "#0f2644" }}>{item.name}</span>
                        {categoryKey && <Link to={`/products/${categoryKey}/${item.id}`} style={{ fontSize: 9, color: vColor, textDecoration: "none", fontWeight: 600 }}>View →</Link>}
                      </div>
                      <div style={{ fontSize: 11, color: "#7aa3c0", marginBottom: reason ? 6 : 0, lineHeight: 1.5 }}>{item.spec}</div>
                      {reason && <div style={{ fontSize: 10, color: "#1e3a5f", background: "#e8f2fb", borderRadius: 6, padding: "6px 10px", borderLeft: `3px solid ${seg?.color || vColor}`, lineHeight: 1.6, fontWeight: 500, display: "flex", alignItems: "flex-start", gap: "0.4rem" }}><Icon name="tip" size={14} style={{ color: seg?.color || vColor, marginTop: 1, flexShrink: 0 }} /><span>{reason}</span></div>}
                    </div>
                    <div style={{ textAlign: "right", minWidth: 90, flexShrink: 0 }}>
                      <div style={{ fontSize: 15, color: vColor, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace" }}>{item.unitPrice === 0 ? "Free" : fmt(item.unitPrice)}</div>
                      <div style={{ fontSize: 9, color: "#bfdbfe", marginTop: 1 }}>per unit</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
                      <button onClick={() => updateQty(item.id, -1)} disabled={qty === 0} style={{ width: 30, height: 30, borderRadius: 6, border: `1.5px solid ${qty > 0 ? vColor : "#bfdbfe"}`, background: qty > 0 ? `${vColor}15` : "#f0f7ff", color: qty === 0 ? "#bfdbfe" : vColor, cursor: qty === 0 ? "not-allowed" : "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}><Icon name="minus" size={12} /></button>
                      <span style={{ width: 30, textAlign: "center", fontSize: 15, fontWeight: 700, color: qty > 0 ? vColor : "#bfdbfe", fontFamily: "'JetBrains Mono',monospace" }}>{qty}</span>
                      <button onClick={() => updateQty(item.id, 1)} style={{ width: 30, height: 30, borderRadius: 6, border: `1.5px solid ${vColor}`, background: `${vColor}15`, color: vColor, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}><Icon name="plus" size={12} /></button>
                    </div>
                    {qty > 0 && <div style={{ minWidth: 88, textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#0f2644", fontFamily: "'JetBrains Mono',monospace" }}>{fmt(item.unitPrice * qty)}</div>
                      <div style={{ fontSize: 9, color: "#7aa3c0" }}>subtotal</div>
                    </div>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {!selectedVendor && (
          <div style={{ textAlign: "center", padding: "32px 20px", color: "#93c5fd", fontSize: 12, display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
            <Icon name="info" size={32} style={{ color: "#93c5fd" }} />
            <span>Select a vendor above to browse and add hypervisor products</span>
          </div>
        )}
      </div>
    );
  }

  // Default view for all other tabs
  const uniqueBrands = [...new Set(cat.items.map(i => i.brand).filter(Boolean))];
  const hasBrands = uniqueBrands.length > 0;
  const filteredItems = brandFilter === "all" ? cat.items : cat.items.filter(i => i.brand === brandFilter);
  return (
    <div>
      <div className="boq-layer-header">
        <div className="boq-layer-icon" style={{ color: cat.color, background: `${cat.color}15` }}>
          <Icon name={cat.icon} size={20} />
        </div>
        <div>
          <h2 className="boq-layer-title">{cat.label}</h2>
          <div className="boq-layer-meta">{cat.items.length} products{rec ? ` · ${rec.items.length} recommended for ${seg?.label}` : ""}</div>
        </div>
      </div>

      {hasBrands && (
        <div className="boq-filter-bar">
          <div className="boq-filter-label">Filter by OEM brand</div>
          <div className="boq-filter-chips">
            <button type="button" onClick={() => setBrandFilter("all")} className={`boq-filter-chip${brandFilter === "all" ? " boq-filter-chip-active" : ""}`}>All brands</button>
            {uniqueBrands.map(b => (
              <button key={b} type="button" onClick={() => setBrandFilter(b)} className={`boq-filter-chip${brandFilter === b ? " boq-filter-chip-active" : ""}`} style={brandFilter === b ? { background: BRAND_COLORS[b], borderColor: BRAND_COLORS[b] } : { color: BRAND_COLORS[b], borderColor: BRAND_COLORS[b] }}>
                {BRAND_LABELS[b] || b.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      )}

      {rec && (
        <div className="boq-rec-banner">
          <div className="boq-rec-banner-label">Recommended for {seg.label}</div>
          <div className="boq-filter-chips">
            {rec.items.map(id => {
              const item = cat.items.find(i => i.id === id); if (!item) return null;
              return (
                <span key={id} className="boq-rec-chip">
                  {item.brand && <BrandBadge brand={item.brand} />}
                  {item.name}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {filteredItems.map(item => {
        const qty = selections[item.id] || 0;
        const isRec = rec?.items.includes(item.id);
        const reason = rec?.reasons?.[item.id];
        return (
          <div key={item.id} className={`boq-product-row${qty > 0 ? " boq-product-row-selected" : ""}${isRec ? " boq-product-row-rec" : ""}`}>
            <div className="boq-product-row-inner">
              <div className="boq-product-main">
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5, flexWrap: "wrap" }}>
                  {isRec && (
                    <span className="boq-tag-rec" style={{ display: "inline-flex", alignItems: "center", gap: "0.2rem" }}>
                      <Icon name="sparkles" size={9} /> Recommended
                    </span>
                  )}
                  <BrandBadge brand={item.brand} />
                  <span className="boq-product-name">{item.name}</span>
                  {categoryKey && <Link to={`/products/${categoryKey}/${item.id}`} style={{ fontSize: "0.625rem", color: "var(--boq-accent)", textDecoration: "none", fontWeight: 600 }}>View →</Link>}
                </div>
                <div className="boq-product-spec">{item.spec}</div>
                {reason && <div className="boq-product-reason">{reason}</div>}
              </div>
              <div className="boq-price-block">
                <div className="boq-price-value">{fmt(item.unitPrice)}</div>
                <div className="boq-price-unit">per unit</div>
              </div>
              <div className="boq-qty-group">
                <button type="button" onClick={() => updateQty(item.id, -1)} disabled={qty === 0} className="boq-qty-btn" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}><Icon name="minus" size={10} /></button>
                <span style={{ width: 28, textAlign: "center", fontSize: "0.875rem", fontWeight: 700, fontFamily: "var(--boq-mono)", color: qty > 0 ? "var(--boq-accent)" : "var(--boq-ink-muted)" }}>{qty}</span>
                <button type="button" onClick={() => updateQty(item.id, 1)} className="boq-qty-btn" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}><Icon name="plus" size={10} /></button>
              </div>
              {qty > 0 && (
                <div className="boq-price-block">
                  <div className="boq-price-value" style={{ color: "var(--boq-ink)" }}>{fmt(item.unitPrice * qty)}</div>
                  <div className="boq-price-unit">subtotal</div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ReportView({ report, projectInfo, serverConfigs, infraSelections, grandTotalUsd, serverTotal, infraTotal, seg, rec, fmt, quote, quoteTotals, onBack, catalogue }) {
  const { allLines, refNo, today, tax, total, payload } = report;
  const { subtotal, tax: taxAmt, total: totalAmt } = quoteTotals;
  const taxLbl = taxLineLabel(quote.taxLabel, quote.taxRate);
  const totalLbl = totalInclTaxLabel(quote.taxLabel, quote.taxRate);
  const exclLbl = quote.taxRate > 0 ? `Total (excl. ${quote.taxLabel})` : "Total";
  const [pdfError, setPdfError] = useState("");
  const [copied, setCopied] = useState(false);

  // Validity: 30 days from quote date or today
  const issueDate = projectInfo.date ? new Date(projectInfo.date) : new Date();
  const expiryDate = new Date(issueDate);
  expiryDate.setDate(expiryDate.getDate() + 30);
  const daysLeft = Math.max(0, Math.ceil((expiryDate.getTime() - Date.now()) / 86400000));
  const validityExpired = daysLeft === 0;
  const validityUrgent = daysLeft > 0 && daysLeft <= 7;

  const handleCopyRef = () => {
    navigator.clipboard.writeText(refNo).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDownloadPdf = () => {
    setPdfError("");
    try {
      downloadBoqPdf(payload);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not generate PDF";
      setPdfError(msg);
      console.error("PDF download failed:", err);
    }
  };

  return (
    <div className="boq-report-page">
      {/* Action bar */}
      <div className="boq-report-actions boq-no-print" style={{ alignItems: "center" }}>
        <button type="button" onClick={onBack} className="boq-btn boq-btn-ghost">← Back</button>
        <button type="button" onClick={handleDownloadPdf} className="boq-btn boq-btn-success">Download PDF</button>
        <button type="button" onClick={() => window.print()} className="boq-btn boq-btn-ghost">Print</button>

        {/* Ref number + copy */}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
          {/* Validity badge */}
          <div style={{
            display: "flex", alignItems: "center", gap: "0.35rem",
            padding: "0.3rem 0.65rem",
            background: validityExpired ? "var(--boq-danger-muted)" : validityUrgent ? "var(--boq-warning-muted)" : "var(--boq-teal-muted)",
            border: `1px solid ${validityExpired ? "var(--boq-danger)" : validityUrgent ? "var(--boq-warning)" : "var(--boq-teal)"}`,
            borderRadius: "var(--boq-radius-sm)",
          }}>
            <span style={{
              fontFamily: "var(--boq-mono)", fontSize: "0.5rem", fontWeight: 700,
              letterSpacing: "0.08em", textTransform: "uppercase",
              color: validityExpired ? "var(--boq-danger)" : validityUrgent ? "var(--boq-warning)" : "var(--boq-teal)",
            }}>
              {validityExpired ? "EXPIRED" : `VALID ${daysLeft}d left`}
            </span>
          </div>

          {/* Ref number pill + copy */}
          <div style={{
            display: "flex", alignItems: "center", gap: "0.35rem",
            background: "var(--boq-paper-elevated)", border: "1px solid var(--boq-rule-dark)",
            borderRadius: "var(--boq-radius-sm)", padding: "0.3rem 0.5rem 0.3rem 0.75rem",
          }}>
            <span style={{ fontFamily: "var(--boq-mono)", fontSize: "0.625rem", fontWeight: 600, color: "var(--boq-ink-soft)", letterSpacing: "0.04em" }}>
              {refNo}
            </span>
            <button
              type="button"
              onClick={handleCopyRef}
              title="Copy reference number"
              style={{
                border: "1px solid var(--boq-rule-dark)", borderRadius: "3px",
                background: copied ? "var(--boq-teal)" : "var(--boq-paper-bright)",
                color: copied ? "#fff" : "var(--boq-ink-muted)",
                padding: "0.15rem 0.4rem", cursor: "pointer",
                fontFamily: "var(--boq-mono)", fontSize: "0.5rem", fontWeight: 700,
                letterSpacing: "0.04em", transition: "all 0.15s",
                display: "inline-flex", alignItems: "center", gap: "0.2rem"
              }}
            >
              {copied ? <><Icon name="check" size={10} /> COPIED</> : "COPY"}
            </button>
          </div>
        </div>
      </div>
      {pdfError && <div style={{ marginBottom: 16, padding: "12px 16px", background: "#fff1f2", border: "1.5px solid #fecdd3", borderRadius: 8, fontSize: 12, color: "#be123c" }}>{pdfError}</div>}
      <div style={{ background: "#fff", color: "#111", borderRadius: 16, overflow: "hidden", boxShadow: "0 20px 60px rgba(30,64,175,0.15)" }}>
        <div style={{ background: "linear-gradient(135deg,#1e3a8a 0%,#0369a1 100%)", padding: "36px 44px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <div style={{ width: 42, height: 42, background: "rgba(255,255,255,0.2)", borderRadius: 11, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(255,255,255,0.3)", color: "#fff" }}>
                  <Icon name="power" size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 18, color: "#ffffff" }}>Sniper Presales v9</div>
                  <div style={{ fontSize: 9, color: "#93c5fd", letterSpacing: 3, textTransform: "uppercase", fontFamily: "'JetBrains Mono',monospace" }}>BILL OF QUANTITY · FULL STACK · OEM NETWORK</div>
                </div>
              </div>
              <h1 style={{ fontWeight: 800, fontSize: 24, color: "#ffffff", marginBottom: 6 }}>{projectInfo.name || "Datacenter Project"}</h1>
              <div style={{ fontSize: 12, color: "#93c5fd" }}>Client: <span style={{ color: "#fff", fontWeight: 600 }}>{projectInfo.client || "—"}</span> · Engineer: <span style={{ color: "#fff", fontWeight: 600 }}>{projectInfo.engineer || "—"}</span> · Date: <span style={{ color: "#fff" }}>{projectInfo.date || today}</span></div>
              {seg && <div style={{ marginTop: 12, display: "inline-flex", alignItems: "center", gap: 7, background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 6, padding: "6px 14px" }}><Icon name={seg.icon} size={14} style={{ color: "#fff" }} /><span style={{ fontSize: 12, color: "#ffffff", fontWeight: 700 }}>{seg.label} Segment</span></div>}
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ background: "rgba(255,255,255,0.2)", color: "#ffffff", fontWeight: 700, fontSize: 11, padding: "5px 14px", borderRadius: 5, marginBottom: 10, display: "inline-block", fontFamily: "'JetBrains Mono',monospace", border: "1px solid rgba(255,255,255,0.3)" }}>{refNo}</div>
              <div style={{ padding: "14px 18px", background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)", borderRadius: 10 }}>
                <div style={{ fontSize: 9, color: "#93c5fd", textTransform: "uppercase", letterSpacing: 1.5, fontFamily: "'JetBrains Mono',monospace", marginBottom: 4 }}>{totalLbl}</div>
                <div style={{ fontSize: 26, fontWeight: 800, color: "#ffffff", fontFamily: "'JetBrains Mono',monospace" }}>{formatMoney(totalAmt, quote.currency)}</div>
                <div style={{ fontSize: 10, color: "#93c5fd", marginTop: 2 }}>{allLines.length} line items</div>
              </div>
            </div>
          </div>
        </div>

        {rec && <div style={{ padding: "14px 44px", background: "#eff6ff", borderBottom: "1px solid #bfdbfe" }}>
          <div style={{ fontSize: 11, color: "#1e40af", fontWeight: 700, marginBottom: 4, display: "flex", alignItems: "center", gap: "0.3rem" }}>
            <Icon name="info" size={12} /> Solution Rationale — {seg?.label}
          </div>
          <div style={{ fontSize: 11, color: "#3b82f6", lineHeight: 1.7 }}>{rec.rationale}</div>
        </div>}

        <div style={{ padding: "18px 44px", background: "#f8faff", borderBottom: "1px solid #e0e7ff", display: "flex", gap: 10, flexWrap: "wrap" }}>
          <div style={{ padding: "10px 16px", background: "#fff", border: "1px solid #e0e7ff", borderTop: `3px solid ${seg?.color || "#1e40af"}`, borderRadius: 8, minWidth: 110 }}>
            <div style={{ fontSize: 10, color: "#7aa3c0", display: "flex", alignItems: "center", gap: "0.3rem" }}><Icon name="server" size={12} /> Servers</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#1e3a5f", fontFamily: "'JetBrains Mono',monospace" }}>{fmt(serverTotal)}</div>
          </div>
          {catalogue && Object.entries(catalogue.categories).map(([k, cat]) => {
            const items = infraSelections[k]; if (!items || !Object.keys(items).length) return null;
            const t = Object.entries(items).reduce((a, [id, q]) => a + (cat.items.find(i => i.id === id)?.unitPrice || 0) * q, 0);
            return <div key={k} style={{ padding: "10px 16px", background: "#fff", border: "1px solid #e0e7ff", borderTop: `3px solid ${cat.color}`, borderRadius: 8, minWidth: 100 }}><div style={{ fontSize: 10, color: "#7aa3c0", display: "flex", alignItems: "center", gap: "0.3rem" }}><Icon name={cat.icon} size={12} /> {cat.label}</div><div style={{ fontSize: 15, fontWeight: 700, color: "#1e3a5f", fontFamily: "'JetBrains Mono',monospace" }}>{fmt(t)}</div></div>;
          })}
        </div>

        <div style={{ padding: "28px 44px" }}>
          <h2 style={{ fontWeight: 800, fontSize: 14, marginBottom: 14, color: "#1e3a5f", borderBottom: "2px solid #1e40af", paddingBottom: 7 }}>Detailed Bill of Quantity</h2>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
            <thead><tr style={{ background: "linear-gradient(135deg,#1e3a8a,#0369a1)", color: "#fff" }}>{["#", "Category", "Product / Model", "Specifications", "Unit Price", "Qty", "Total"].map(h => (<th key={h} style={{ padding: "10px 12px", textAlign: ["Unit Price", "Total", "Qty"].includes(h) ? "right" : h === "#" ? "center" : "left", fontSize: 10, fontWeight: 700, letterSpacing: 0.5 }}>{h}</th>))}</tr></thead>
            <tbody>{allLines.map((li, i) => (<tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#f8faff", borderBottom: "1px solid #e0e7ff" }}>
              <td style={{ padding: "8px 12px", textAlign: "center", color: "#93c5fd", fontSize: 10, fontFamily: "'JetBrains Mono',monospace" }}>{i + 1}</td>
              <td style={{ padding: "8px 12px" }}><span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: `${li.color}12`, border: `1px solid ${li.color}30`, borderRadius: 4, padding: "2px 8px", fontSize: 9, color: li.color, fontWeight: 700 }}><Icon name={li.icon} size={10} /> {li.category}</span></td>
              <td style={{ padding: "8px 12px", fontWeight: 600, color: "#1e3a5f", maxWidth: 160 }}>{li.name}</td>
              <td style={{ padding: "8px 12px", color: "#7aa3c0", fontSize: 10, maxWidth: 260, lineHeight: 1.4 }}>{li.spec}</td>
              <td style={{ padding: "8px 12px", textAlign: "right", color: "#1e3a5f", fontFamily: "'JetBrains Mono',monospace" }}>{formatMoney(li.unitPrice, quote.currency)}</td>
              <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: 700, fontFamily: "'JetBrains Mono',monospace", color: "#1e3a5f" }}>{li.qty}</td>
              <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: 700, color: "#1e40af", fontFamily: "'JetBrains Mono',monospace" }}>{formatMoney(li.total, quote.currency)}</td>
            </tr>))}</tbody>
          </table>

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 24 }}>
            <div style={{ minWidth: 320 }}>
              {[
                ["Servers Subtotal", fmt(serverTotal)],
                ["Infrastructure Subtotal", fmt(infraTotal)],
                [exclLbl, formatMoney(subtotal, quote.currency)],
                ...(quote.taxRate > 0 ? [[taxLbl, formatMoney(taxAmt, quote.currency)]] : []),
              ].map(([l, v]) => (
                <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid #e0e7ff" }}>
                  <span style={{ color: "#7aa3c0", fontSize: 12 }}>{l}</span>
                  <span style={{ fontWeight: 600, color: "#1e3a5f", fontSize: 12, fontFamily: "'JetBrains Mono',monospace" }}>{v}</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px", background: "linear-gradient(135deg,#1e40af,#0369a1)", borderRadius: 10, marginTop: 10 }}>
                <div>
                  <div style={{ color: "#93c5fd", fontWeight: 700, fontSize: 11, letterSpacing: 1 }}>GRAND TOTAL</div>
                  <div style={{ color: "#bfdbfe", fontSize: 10, marginTop: 2 }}>{quote.currency}{quote.taxRate > 0 ? ` · ${quote.taxLabel} ${quote.taxRate}%` : ""}</div>
                </div>
                <span style={{ color: "#ffffff", fontWeight: 800, fontSize: 22, fontFamily: "'JetBrains Mono',monospace" }}>{formatMoney(totalAmt, quote.currency)}</span>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 22, padding: 14, background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#1e40af", marginBottom: 6 }}>Terms & Conditions</div>
            {[`Prices in ${quote.currency} (USD catalogue × FX ${quote.fxRate}); confirmed upon Purchase Order issuance.`, "Lead time: 4–10 weeks based on model and component availability.", "OEM warranty applies as specified; extended support per selected option.", "Payment: 30% advance, 60% on delivery, 10% on acceptance.", "BOQ validity: 30 days from date of issue.", "OEM network recommendations are best-practice guidance; final selection subject to site survey."].map((t, i) => (<div key={i} style={{ fontSize: 10, color: "#3b82f6", marginBottom: 3, display: "flex", gap: 6 }}><span>•</span>{t}</div>))}
          </div>
          <div style={{ marginTop: 28, paddingTop: 16, borderTop: "2px solid #e0e7ff", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div style={{ fontSize: 10, color: "#93c5fd", fontFamily: "'JetBrains Mono',monospace" }}><div>Sniper Presales v9 · {refNo}</div><div>{today}</div></div>
            <div style={{ textAlign: "center" }}><div style={{ borderTop: "2px solid #1e40af", width: 220, paddingTop: 6, fontSize: 10, color: "#7aa3c0" }}>Authorized Signature & Stamp</div></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AIScreen({ onBack, onResult }) {
  const [req, setReq] = useState("");
  const [scale, setScale] = useState("Medium (50-500 users)");
  const [budget, setBudget] = useState("$500K - $2M");
  const [compliance, setCompliance] = useState("None specific");
  const [redundancy, setRedundancy] = useState("N+1 (standard HA)");
  const [chip, setChip] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const chips = [{ label: "Retail", v: "Retail" }, { label: "Healthcare", v: "Healthcare" }, { label: "BFSI", v: "BFSI / Banking" }, { label: "Education", v: "Education" }, { label: "Manufacturing", v: "Manufacturing" }, { label: "HPC / AI", v: "Research / HPC / AI" }, { label: "Gaming", v: "Gaming" }, { label: "Transport", v: "Transport" }, { label: "SMB", v: "SMB" }, { label: "Design / VFX", v: "Design / VFX" }];
  const generate = async () => {
    if (!req.trim()) { setError("Please describe your requirements."); return; }
    setError(""); setLoading(true);
    try {
      const res = await fetch("https://boq-production.up.railway.app/api/generate-boq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requirements: req, scale, budget, compliance, redundancy, segment: chip || undefined }),
      });

      // Check if response has content before parsing
      const text = await res.text();
      console.log("Raw response:", text);
      console.log("Status:", res.status);

      if (!text) {
        throw new Error(`Server returned empty response (HTTP ${res.status}). Check Railway logs.`);
      }

      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(`Invalid JSON from server: ${text.slice(0, 200)}`);
      }

      if (!res.ok) throw new Error(data.error || "Failed to generate BOQ");
      onResult(data.boq);
    } catch (e) {
      setError(e.message || "Failed to generate BOQ. Please try again.");
    }
    setLoading(false);
  };
  const MIN_CHARS = 80;
  const charCount = req.trim().length;
  const charOk = charCount >= MIN_CHARS;

  return (
    <div className="boq-app">
      <header className="boq-header">
        <div className="boq-header-left">
          <button type="button" onClick={onBack} className="boq-btn boq-btn-ghost boq-btn-sm">← Back</button>
          <div className="boq-header-divider" />
          <div
            style={{
              width: 30, height: 30, background: "var(--boq-accent)",
              borderRadius: "var(--boq-radius-sm)", display: "flex",
              alignItems: "center", justifyContent: "center",
              fontFamily: "var(--boq-mono)", fontSize: "0.5625rem",
              fontWeight: 700, color: "#fff", flexShrink: 0,
            }}
          >AI</div>
          <div className="boq-header-brand-text">
            <div className="boq-brand-title">Requirements Engine</div>
            <div className="boq-brand-sub">Automated BOQ generation</div>
          </div>
          <span className="boq-badge boq-badge-ai">AI</span>
        </div>
        <div className="boq-header-right">
          <button
            type="button"
            onClick={generate}
            disabled={loading || !charOk}
            className="boq-btn boq-btn-primary boq-btn-sm"
          >
            {loading
              ? <><span className="boq-spinner" />Generating…</>
              : <span style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
                  <Icon name="arrow_right" size={13} />
                  <span className="boq-header-nav-label">Generate BOQ</span>
                </span>
            }
          </button>
        </div>
      </header>
      <div className="boq-ai-container">
        <div className="boq-hero" style={{ marginBottom: "1.5rem" }}>
          <p className="boq-eyebrow">AI-assisted quoting</p>
          <h1 className="boq-page-title">Describe Your Infrastructure Needs</h1>
          <p className="boq-page-lead">
            Describe your requirements in plain language. The engine will produce a
            full-stack BOQ covering compute, network, storage, backup, monitoring,
            and database — ready to load into the configurator.
          </p>
        </div>
        <div className="boq-form-card">
          <div className="boq-form-card-header">
            <div className="boq-form-card-header-icon">REQ</div>
            <div>
              <h2>Requirements Brief</h2>
              <p>Be specific: mention workload type, user count, compliance needs, and growth plans</p>
            </div>
          </div>
          <div className="boq-form-body">
            <div className="boq-form-grid">
              <div className="boq-form-section">
                <div className="boq-form-field">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <label className="boq-label boq-label-required" htmlFor="ai-req">Requirements brief</label>
                    <span style={{
                      fontFamily: "var(--boq-mono)",
                      fontSize: "0.5rem",
                      color: charOk ? "var(--boq-teal)" : charCount > 0 ? "var(--boq-warning)" : "var(--boq-ink-muted)",
                      fontWeight: 700,
                      letterSpacing: "0.04em",
                      transition: "color 0.2s",
                    }}>
                      {charCount} / {MIN_CHARS} min chars{charOk ? <span style={{ display: "inline-flex", alignItems: "center", gap: "0.2rem", marginLeft: "0.2rem" }}><Icon name="check" size={10} /></span> : ""}
                    </span>
                  </div>
                  <textarea
                    id="ai-req"
                    className="boq-textarea"
                    rows={10}
                    value={req}
                    onChange={e => setReq(e.target.value)}
                    placeholder={"Describe your infrastructure in plain language…\n\nExample: We are a 500-bed hospital running Epic EHR and PACS imaging with 200 TB of patient data. We need HA storage, HIPAA-compliant immutable backup, 24×7 uptime SLA, and a DR site with RTO < 2 hours."}
                    style={charCount > 0 && !charOk ? { borderColor: "var(--boq-warning)" } : undefined}
                  />
                  {charCount > 0 && !charOk && (
                    <span className="boq-field-hint" style={{ color: "var(--boq-warning)" }}>
                      Add {MIN_CHARS - charCount} more characters for a quality BOQ
                    </span>
                  )}
                </div>
                <div className="boq-form-field">
                  <span className="boq-label">Quick Segment</span>
                  <div className="boq-chips">
                    {chips.map(c => (<button key={c.v} type="button" onClick={() => setChip(chip === c.v ? "" : c.v)} className={`boq-chip${chip === c.v ? " boq-chip-active" : ""}`}>{c.label}</button>))}
                  </div>
                </div>
              </div>
              <div className="boq-form-section boq-form-section-accent">
                {[["Scale", scale, setScale, ["Small (up to 50 users)", "Medium (50-500 users)", "Large (500-2000 users)", "Enterprise (2000+ users)"]], ["Budget Range (USD)", budget, setBudget, ["Under $100K", "$100K - $500K", "$500K - $2M", "$2M+"]], ["Compliance", compliance, setCompliance, ["None specific", "HIPAA", "PCI-DSS", "RBI / SEBI", "ISO 27001", "GDPR"]], ["Redundancy", redundancy, setRedundancy, ["N (basic)", "N+1 (standard HA)", "2N (full redundancy)", "2N+1 (mission critical)"]]].map(([lbl, val, setter, opts]) => (
                  <div key={lbl} className="boq-form-field">
                    <label className="boq-label" htmlFor={`ai-${lbl}`}>{lbl}</label>
                    <select id={`ai-${lbl}`} className="boq-select" value={val} onChange={e => setter(e.target.value)}>{opts.map(o => <option key={o} value={o}>{o}</option>)}</select>
                  </div>
                ))}
                {error && <div className="boq-alert boq-alert-error" role="alert">{error}</div>}
                <button type="button" onClick={generate} disabled={loading || !charOk} className="boq-btn boq-btn-primary boq-btn-lg" style={{ marginTop: "0.5rem" }}>
                  {loading ? <><span className="boq-spinner" />Generating BOQ…</> : "Generate BOQ →"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AIResultPanel({ result, fmt, onRerun }) {
  const { settings, totalsFromUsd } = useQuoteMoney();

  if (!result) return (
    <div style={{ maxWidth: 560, margin: "3rem auto", padding: "0 1rem" }}>
      {/* Icon */}
      <div style={{ textAlign: "center", marginBottom: "1.75rem" }}>
        <div style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          width: 56, height: 56, borderRadius: "var(--boq-radius)",
          background: "var(--boq-accent-muted)", border: "1px solid var(--boq-accent-light)",
        }}>
          <span style={{ fontFamily: "var(--boq-mono)", fontWeight: 800, fontSize: "1rem", color: "var(--boq-accent)" }}>AI</span>
        </div>
        <h2 style={{ fontWeight: 700, fontSize: "1.125rem", color: "var(--boq-ink)", margin: "0.75rem 0 0.35rem", letterSpacing: "-0.02em" }}>
          No generated BOQ yet
        </h2>
        <p style={{ fontSize: "0.8125rem", color: "var(--boq-ink-muted)", margin: 0, lineHeight: 1.6 }}>
          Run the requirements engine to get a full-stack bill in seconds.
        </p>
      </div>

      {/* How it works steps */}
      <div className="boq-form-card" style={{ marginBottom: "1rem" }}>
        <div className="boq-form-card-header">
          <div className="boq-form-card-header-icon">HOW</div>
          <div>
            <h2>How it works</h2>
            <p>Three steps from requirements to a downloadable BOQ</p>
          </div>
        </div>
        <div style={{ padding: "0.875rem 1rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {[
            { n: "01", title: "Describe your project", body: "Write your workload type, user scale, compliance needs, and growth plans in plain language." },
            { n: "02", title: "Set scope parameters", body: "Pick a budget range, redundancy level, compliance framework, and optional vertical segment." },
            { n: "03", title: "Review & load", body: "The AI returns a categorised BOQ. Review it here, then switch tabs to refine individual items." },
          ].map(step => (
            <div key={step.n} style={{ display: "flex", gap: "0.875rem", alignItems: "flex-start" }}>
              <span style={{
                fontFamily: "var(--boq-mono)", fontSize: "0.5rem", fontWeight: 800,
                color: "var(--boq-accent)", background: "var(--boq-accent-muted)",
                border: "1px solid var(--boq-accent-light)", borderRadius: "var(--boq-radius-sm)",
                padding: "0.2rem 0.45rem", flexShrink: 0, letterSpacing: "0.06em",
              }}>{step.n}</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: "0.8125rem", color: "var(--boq-ink)", marginBottom: "0.15rem" }}>{step.title}</div>
                <div style={{ fontSize: "0.6875rem", color: "var(--boq-ink-muted)", lineHeight: 1.5 }}>{step.body}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <button type="button" onClick={onRerun} className="boq-btn boq-btn-primary boq-btn-lg">
        Open Requirements Engine →
      </button>
      <p style={{ textAlign: "center", marginTop: "0.75rem", fontSize: "0.6875rem", color: "var(--boq-ink-muted)" }}>
        Results typically take 8–15 seconds · Powered by GPT-4o
      </p>
    </div>
  );
  const cats = [
    { key: "compute", label: "Compute", code: "CMP" },
    { key: "storage", label: "Storage", code: "STG" },
    { key: "network", label: "Network", code: "NET" },
    { key: "backup", label: "Backup", code: "BKP" },
    { key: "monitoring", label: "Monitoring", code: "MON" },
    { key: "sql_database", label: "SQL Database", code: "SQL" },
    { key: "nosql_database", label: "NoSQL Database", code: "NSQL" },
  ];
  let grandTotalUsd = 0;
  cats.forEach(c => { (result[c.key] || []).forEach(i => { grandTotalUsd += i.unitPrice * i.qty; }); });
  const { subtotal, tax, total } = totalsFromUsd(grandTotalUsd);
  const taxLbl = taxLineLabel(settings.taxLabel, settings.taxRate);
  return (
    <div>
      <div className="boq-panel-toolbar">
        <div>
          <h2 className="boq-panel-title">Generated BOQ</h2>
          {result.segment && <span className="boq-badge boq-badge-ai" style={{ marginTop: "0.35rem" }}>{result.segment}</span>}
        </div>
        <button type="button" onClick={onRerun} className="boq-btn boq-btn-ghost">Regenerate</button>
      </div>
      {result.summary && <div className="boq-callout" style={{ marginBottom: "1.125rem" }}>{result.summary}</div>}
      {cats.map(cat => {
        const items = result[cat.key] || []; if (!items.length) return null;
        const catTotal = items.reduce((s, i) => s + i.unitPrice * i.qty, 0);
        return (
          <div key={cat.key} className="boq-ai-table-wrap">
            <div className="boq-ai-table-head">
              <span className="boq-layer-icon" style={{ background: "rgba(26,77,124,0.12)", color: "var(--boq-accent)" }}>
                <Icon name={cat.key === "compute" ? "server" : cat.key} size={16} />
              </span>
              <span className="boq-layer-title" style={{ flex: 1, fontSize: "0.875rem" }}>{cat.label}</span>
              <span className="boq-price-value">{fmt(catTotal)}</span>
            </div>
            <table className="boq-ai-table">
              <thead>
                <tr>{["Item", "Spec", "Qty", "Unit Price", "Total"].map(h => (
                  <th key={h} className={["Qty", "Unit Price", "Total"].includes(h) ? "num" : ""}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={i}>
                    <td>
                      <div className="boq-product-name">{item.item}</div>
                      <div className="boq-product-reason">{item.reason}</div>
                    </td>
                    <td className="boq-product-spec">{item.spec}</td>
                    <td className="num">{item.qty}</td>
                    <td className="num">{fmt(item.unitPrice)}</td>
                    <td className="num boq-price-value" style={{ fontSize: "0.8125rem" }}>{fmt(item.unitPrice * item.qty)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
      <div className="boq-ai-total-bar">
        <div>
          {settings.taxRate > 0 && (
            <div className="boq-ai-total-label">{taxLbl}: {formatMoney(tax, settings.currency)}</div>
          )}
          <div className="boq-ai-total-label">{totalInclTaxLabel(settings.taxLabel, settings.taxRate)}: {formatMoney(total, settings.currency)}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div className="boq-ai-total-label">{settings.taxRate > 0 ? `Subtotal (excl. ${settings.taxLabel})` : "Subtotal"}</div>
          <div className="boq-ai-total-value">{formatMoney(subtotal, settings.currency)}</div>
        </div>
      </div>
    </div>
  );
}

function SegmentRoute() {
  const navigate = useNavigate();
  return <SegmentScreen onSelect={(key) => navigate(`/segments/${key}/servers`)} onAI={() => navigate("/ai")} />;
}

function SegmentRedirect() {
  const { segmentId } = useParams();
  return <Navigate to={`/segments/${segmentId}/servers`} replace />;
}

function AIRoute() {
  const navigate = useNavigate();
  return <AIScreen onBack={() => navigate("/")} onResult={(res) => { sessionStorage.setItem("aiBoqResult", JSON.stringify(res)); navigate("/segments/retail/ai-result"); }} />;
}

import { useAuth } from "./context/AuthContext";
import { useProject } from "./context/ProjectContext";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

export default function App()
{
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/segments" element={<ProtectedRoute><SegmentRoute /></ProtectedRoute>} />
      <Route path="/segments/:segmentId" element={<ProtectedRoute><SegmentRedirect /></ProtectedRoute>} />
      <Route path="/segments/:segmentId/report" element={<ProtectedRoute><Configurator /></ProtectedRoute>} />
      <Route path="/segments/:segmentId/:tab" element={<ProtectedRoute><Configurator /></ProtectedRoute>} />
      <Route path="/ai" element={<ProtectedRoute><AIRoute /></ProtectedRoute>} />
      <Route path="/products/:category/:productId" element={<ProtectedRoute><ProductPage /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
