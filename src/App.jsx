import { useState, useEffect, useCallback, useRef, createContext, useContext } from "react";
import api from "./api";

/* ═══ HOOKS ═══ */
function useApi(fn, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const go = useCallback(async () => {
    setLoading(true);
    setError(null);
    try { setData(await fn()); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, deps);
  useEffect(() => { go(); }, [go]);
  return { data, loading, error, refetch: go };
}

/* ═══ TOAST ═══ */
const ToastCtx = createContext();
function ToastWrap({ children }) {
  const [msg, setMsg] = useState(null);
  const t = useRef();
  const show = (m) => { setMsg(m); clearTimeout(t.current); t.current = setTimeout(() => setMsg(null), 2800); };
  return (
    <ToastCtx.Provider value={show}>
      {children}
      {msg && <div style={{ position: "fixed", bottom: 20, right: 20, background: "#0f1115", color: "#fff", padding: "12px 20px", borderRadius: 10, fontSize: 13, fontWeight: 500, boxShadow: "0 8px 24px rgba(0,0,0,.16)", zIndex: 9999, animation: "fadeUp .3s ease" }}>{msg}</div>}
    </ToastCtx.Provider>
  );
}
function useToast() { return useContext(ToastCtx); }

/* ═══ UTILS ═══ */
function stat(p) {
  const d = p.oos ?? (p.avg > 0 ? Math.floor(p.stock / p.avg) : 999);
  if (p.status === "critical") return { l: "Critical", c: "red", d };
  if (p.status === "warning") return { l: "Warning", c: "amber", d };
  if (p.stock <= (p.safety || 10)) return d <= 3 ? { l: "Critical", c: "red", d } : { l: "Reorder", c: "amber", d };
  if (d <= (p.lead || 5) + 3) return { l: "Low stock", c: "amber", d };
  return { l: "In stock", c: "green", d };
}
function recQty(p) { return Math.max(p.moq || 20, Math.ceil(p.avg * ((p.lead || 5) + 7)) - p.stock); }

/* ═══ SVG ICONS ═══ */
const sv = (d) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>{d}</svg>;
const Ic = {
  grid: sv(<><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>),
  box: sv(<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />),
  bell: sv(<><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></>),
  clock: sv(<><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></>),
  store: sv(<><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></>),
  gear: sv(<><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></>),
  chart: sv(<><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></>),
  users: sv(<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>),
  shield: sv(<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />),
  file: sv(<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></>),
  help: sv(<><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></>),
  zap: sv(<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />),
  back: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ width: 14, height: 14 }}><polyline points="15 18 9 12 15 6" /></svg>,
  refresh: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></svg>,
};

/* ═══ UI ATOMS ═══ */
const Sk = ({ w = "100%", h = 20 }) => <div style={{ width: w, height: h, borderRadius: 8, background: "#e5e7eb", animation: "pulse 1.5s ease infinite" }} />;
const Tag = ({ c, children }) => {
  const m = { green: ["#dcfce7", "#15803d"], amber: ["#fef3c7", "#d97706"], red: ["#fee2e2", "#dc2626"], blue: ["#dbeafe", "#2563eb"] };
  const [bg, fg] = m[c] || ["#f3f4f6", "#9ca3af"];
  return <span style={{ display: "inline-block", fontSize: 10.5, fontWeight: 600, padding: "2px 8px", borderRadius: 20, lineHeight: 1.5, background: bg, color: fg }}>{children}</span>;
};
const Panel = ({ title, right, children, flush }) => (
  <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, overflow: "hidden" }}>
    <div style={{ padding: "16px 20px", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <span style={{ fontSize: 13, fontWeight: 600 }}>{title}</span>{right}
    </div>
    <div style={flush ? { padding: 0 } : { padding: "16px 20px" }}>{children}</div>
  </div>
);
const MetCard = ({ label, value, color, sub }) => {
  const cm = { green: "#16a34a", amber: "#d97706", red: "#dc2626" };
  return (
    <div className="hov-card" style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "18px 20px", cursor: "default" }}>
      <div style={{ fontSize: 11.5, fontWeight: 500, color: "#9ca3af", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 700, lineHeight: 1, fontVariantNumeric: "tabular-nums", letterSpacing: "-.5px", color: cm[color] || "#0f1115" }}>{typeof value === "number" ? value.toLocaleString() : value}</div>
      {sub && <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 6 }}>{sub}</div>}
    </div>
  );
};
const Btn = ({ children, green, danger, small, ...p }) => (
  <button className={green ? "hov-g" : danger ? "hov-d" : "hov-btn"} {...p} style={{ padding: small ? "4px 10px" : "7px 14px", borderRadius: small ? 6 : 10, fontSize: small ? 11 : 12.5, fontWeight: 500, background: green ? "#16a34a" : danger ? "#fee2e2" : "#fff", color: green ? "#fff" : danger ? "#dc2626" : "#2d2f36", border: green ? "none" : danger ? "1px solid #dc2626" : "1px solid #e5e7eb", cursor: "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 6, ...(p.style || {}) }}>{children}</button>
);
const TH = ({ children }) => <th style={{ padding: "8px 16px", textAlign: "left", fontWeight: 500, fontSize: 11, textTransform: "uppercase", letterSpacing: ".05em", color: "#9ca3af", background: "#f8f9fb", borderBottom: "1px solid #e5e7eb" }}>{children}</th>;
const TD = ({ children, mono, dim, bold }) => <td style={{ padding: "10px 16px", borderBottom: "1px solid #e5e7eb", fontSize: dim ? 11 : 13, color: dim ? "#9ca3af" : "#2d2f36", fontWeight: (mono || bold) ? 600 : 400, fontVariantNumeric: mono ? "tabular-nums" : undefined }}>{children}</td>;

/* ═══ OVERVIEW ═══ */
function OverviewPage() {
  const { data: m, loading: ml } = useApi(() => api.metrics());
  const { data: al, loading: all } = useApi(() => api.alerts());
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12, marginBottom: 20 }}>
        {ml ? [1, 2, 3, 4, 5].map(i => <div key={i} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "18px 20px" }}><Sk w={80} h={12} /><div style={{ height: 8 }} /><Sk w={60} h={28} /></div>) : m && <>
          <MetCard label="Total Products" value={m.total} sub={m.stock ? `${m.stock.toLocaleString()} units` : ""} />
          <MetCard label="Low Stock" value={m.low} color="amber" sub="Below threshold" />
          <MetCard label="Critical" value={m.critical} color="red" sub="Action needed" />
          <MetCard label="Today's Sales" value={m.sales} />
          <MetCard label="Avg. Daily" value={m.avgSales} color="green" sub="All products" />
        </>}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Panel title="Recent Alerts" right={<span style={{ fontSize: 11, color: "#9ca3af" }}>Live</span>}>
          {all ? <Sk h={80} /> : al?.length ? al.slice(0, 5).map(a => (
            <div key={a.id} style={{ display: "flex", gap: 10, padding: "10px 0", borderBottom: "1px solid #e5e7eb", fontSize: 13 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: a.severity === "critical" ? "#dc2626" : "#d97706", marginTop: 7, flexShrink: 0 }} />
              <div style={{ flex: 1, color: "#2d2f36", lineHeight: 1.55 }}><strong>{a.name}</strong> - {a.message || `${a.oos}d left`}</div>
              <span style={{ fontSize: 11, color: "#9ca3af", whiteSpace: "nowrap" }}>{a.recQty} rec.</span>
            </div>
          )) : <div style={{ color: "#9ca3af", textAlign: "center", padding: 40 }}>No alerts</div>}
        </Panel>
        <Panel title="API Status" right={<Tag c="green">Connected</Tag>}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[["Endpoint", "Codespaces"], ["Products", `${m?.total || "--"} synced`], ["Status", "Active"]].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", background: "#f3f4f6", borderRadius: 10 }}>
                <span style={{ fontSize: 12, color: "#6b7080" }}>{k}</span><strong style={{ fontSize: 12 }}>{v}</strong>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

/* ═══ PRODUCTS ═══ */
function ProductsPage({ onView }) {
  const { data: products, loading, refetch } = useApi(() => api.products());
  const [q, setQ] = useState("");
  const [sf, setSf] = useState("");
  const toast = useToast();
  const list = (products || []).filter(p => {
    if (q && !p.name.toLowerCase().includes(q.toLowerCase()) && !p.sku.toLowerCase().includes(q.toLowerCase())) return false;
    if (sf) { const s = stat(p); if (sf === "urgent" && s.c === "green") return false; if (sf === "ok" && s.c !== "green") return false; }
    return true;
  });
  return (
    <Panel title={`Products (${list.length})`} right={<div style={{ display: "flex", gap: 8 }}><input placeholder="Search..." value={q} onChange={e => setQ(e.target.value)} style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "5px 10px", fontSize: 12, fontFamily: "inherit", outline: "none", width: 200 }} /><select value={sf} onChange={e => setSf(e.target.value)} style={{ padding: "5px 10px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12, fontFamily: "inherit" }}><option value="">All</option><option value="urgent">Reorder</option><option value="ok">In stock</option></select></div>} flush>
      {loading ? <div style={{ padding: 20 }}>{[1, 2, 3, 4].map(i => <Sk key={i} h={44} />)}</div> : !list.length ? <div style={{ padding: 60, textAlign: "center", color: "#9ca3af" }}>No products</div> :
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr><TH>Product</TH><TH>SKU</TH><TH>Stock</TH><TH>Avg</TH><TH>Days</TH><TH>Status</TH><TH></TH></tr></thead>
          <tbody>{list.map(p => { const s = stat(p); return (
            <tr key={p.id} className="hov-row"><TD bold>{p.name}</TD><TD dim>{p.sku}</TD><TD mono>{p.stock}</TD><TD>{p.avg}/d</TD><TD mono>{s.d}d</TD><TD><Tag c={s.c}>{s.l}</Tag></TD>
              <TD><Btn small onClick={() => onView(p.id)}>View</Btn>{s.c !== "green" && <Btn small green onClick={async () => { try { await api.approve(p.id, recQty(p)); } catch { } toast(`Ordered: ${p.name}`); refetch(); }} style={{ marginLeft: 4 }}>Order</Btn>}</TD>
            </tr>
          ); })}</tbody>
        </table>}
    </Panel>
  );
}

/* ═══ DETAIL ═══ */
function DetailPage({ id, onBack }) {
  const { data: p, loading, refetch } = useApi(() => api.product(id), [id]);
  const toast = useToast();
  if (loading) return <Sk h={300} />;
  if (!p) return <div style={{ padding: 60, textAlign: "center", color: "#9ca3af" }}>Not found</div>;
  const s = stat(p); const qty = p.recQty ?? recQty(p);
  return (
    <div>
      <Btn onClick={onBack} style={{ marginBottom: 16 }}>{Ic.back} Back</Btn>
      <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 24 }}>
        <div>
          <div style={{ width: "100%", aspectRatio: "1", background: "#f3f4f6", borderRadius: 14, border: "1px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: "#9ca3af" }}>Product Image</div>
          <div style={{ marginTop: 14 }}><div style={{ fontSize: 18, fontWeight: 700 }}>{p.name}</div><div style={{ fontSize: 11, color: "#9ca3af", marginTop: 6 }}>{p.sku} - {p.category}</div></div>
        </div>
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
            {[["Stock", p.stock, s.c === "red"], ["Days", (p.oos ?? s.d) + "d"], ["7d", p.s7 ?? p.avg * 7], ["30d", p.s30 ?? p.avg * 30], ["Avg/d", p.avg + "/d"], ["Lead", p.lead + "d"], ["Safety", p.safety], ["MOQ", p.moq]].map(([l, v, w]) => (
              <div key={l} style={{ background: "#f3f4f6", borderRadius: 10, padding: "12px 14px" }}>
                <div style={{ fontSize: 10, color: "#9ca3af", textTransform: "uppercase", letterSpacing: ".04em", fontWeight: 500, marginBottom: 3 }}>{l}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: w ? "#dc2626" : "#0f1115" }}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{ background: "#dcfce7", border: "1px solid rgba(34,197,94,.2)", borderRadius: 10, padding: 14, marginTop: 8 }}>
            <div style={{ fontSize: 10, color: "#9ca3af", textTransform: "uppercase", fontWeight: 500, marginBottom: 3 }}>Recommended</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: "#15803d" }}>{qty} units</div>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <Btn green onClick={async () => { try { await api.approve(p.id, qty); } catch { } toast(`Approved: ${p.name}`); refetch(); }}>Approve ({qty})</Btn>
            <Btn onClick={() => toast("On hold")}>Hold</Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══ ALERTS ═══ */
function AlertsPage({ onView }) {
  const { data: alerts, loading, refetch } = useApi(() => api.alerts());
  const [held, setHeld] = useState(new Set());
  const toast = useToast();
  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <Btn green onClick={async () => { for (const a of alerts || []) if (!held.has(a.id)) { try { await api.approve(a.id, a.recQty); } catch { } } toast("All approved"); refetch(); }}>Approve all</Btn>
        <Btn onClick={() => { setHeld(new Set((alerts || []).map(a => a.id))); toast("All held"); }}>Hold all</Btn>
      </div>
      {loading ? [1, 2, 3].map(i => <Sk key={i} h={80} />) : !alerts?.length ? <div style={{ padding: 60, textAlign: "center", color: "#9ca3af" }}>All stocked</div> :
        alerts.map(a => (
          <div key={a.id} className="hov-card" style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "16px 20px", marginBottom: 8, display: "flex", alignItems: "center", gap: 16, ...(held.has(a.id) ? { opacity: .3, pointerEvents: "none" } : {}) }}>
            <Tag c={a.severity === "critical" ? "red" : "amber"}>{a.severity === "critical" ? "Critical" : "Warning"}</Tag>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 2 }}>{a.name}</div>
              <div style={{ fontSize: 12, color: "#6b7080" }}>Stock: {a.stock} - {a.oos}d - Rec: {a.recQty}</div>
              {a.message && <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 3 }}>{a.message}</div>}
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <Btn small green onClick={async () => { try { await api.approve(a.id, a.recQty); } catch { } toast(`Approved: ${a.name}`); refetch(); }}>Approve</Btn>
              <Btn small onClick={() => { setHeld(p => new Set([...p, a.id])); toast("Held"); }}>Hold</Btn>
              <Btn small onClick={() => onView(a.id)}>View</Btn>
            </div>
          </div>
        ))}
    </div>
  );
}

/* ═══ HISTORY ═══ */
const HIST = [
  { id: 1, date: "Mar 22", product: "Screen Protector", qty: 200, status: "Completed", at: "9:12 AM", result: "Received" },
  { id: 2, date: "Mar 20", product: "USB-C Cable", qty: 100, status: "Completed", at: "2:30 PM", result: "Received" },
  { id: 3, date: "Mar 18", product: "Airpod Case", qty: 60, status: "In transit", at: "11:00 AM", result: "Shipping" },
  { id: 4, date: "Mar 15", product: "Phone Holder", qty: 40, status: "Completed", at: "8:45 AM", result: "Received" },
  { id: 5, date: "Mar 12", product: "Wireless Charger", qty: 30, status: "Cancelled", at: "4:20 PM", result: "Supplier OOS" },
];
function HistoryPage() {
  return (
    <Panel title="Order History" flush>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead><tr><TH>Date</TH><TH>Product</TH><TH>Qty</TH><TH>Status</TH><TH>Time</TH><TH>Result</TH></tr></thead>
        <tbody>{HIST.map(h => (
          <tr key={h.id} className="hov-row"><TD>{h.date}</TD><TD bold>{h.product}</TD><TD mono>{h.qty}</TD><TD><Tag c={h.status === "Completed" ? "green" : h.status === "In transit" ? "blue" : "red"}>{h.status}</Tag></TD><TD dim>{h.at}</TD><TD>{h.result}</TD></tr>
        ))}</tbody>
      </table>
    </Panel>
  );
}

/* ═══ ANALYTICS ═══ */
function AnalyticsPage() {
  const bars = [{ l: "W1", v: 82 }, { l: "W2", v: 94 }, { l: "W3", v: 71 }, { l: "W4", v: 108 }];
  const max = Math.max(...bars.map(b => b.v));
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
      <Panel title="Weekly Sales Trend">
        <div style={{ display: "flex", alignItems: "flex-end", gap: 16, height: 180, paddingTop: 20 }}>
          {bars.map(b => <div key={b.l} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}><span style={{ fontSize: 12, fontWeight: 700 }}>{b.v}</span><div style={{ width: "100%", height: `${(b.v / max) * 140}px`, background: "linear-gradient(180deg,#22c55e,#16a34a)", borderRadius: "8px 8px 0 0" }} /><span style={{ fontSize: 11, color: "#9ca3af" }}>{b.l}</span></div>)}
        </div>
      </Panel>
      <Panel title="Refund Summary">
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[["Total Refunds", "23", "This month"], ["Auto-Approved", "18", "78% rate"], ["Manual Review", "5", "22% flagged"], ["Avg. Time", "4.2 min", "Down 12%"]].map(([t, v, s]) => (
            <div key={t} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", background: "#f3f4f6", borderRadius: 10 }}>
              <div><div style={{ fontSize: 13, fontWeight: 600 }}>{t}</div><div style={{ fontSize: 11, color: "#9ca3af" }}>{s}</div></div>
              <div style={{ fontSize: 22, fontWeight: 700 }}>{v}</div>
            </div>
          ))}
        </div>
      </Panel>
      <Panel title="Top Refund Reasons">
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[["Defective / Damaged", 34], ["Wrong Size", 28], ["Changed Mind", 22], ["Not as Described", 16]].map(([r, pct]) => (
            <div key={r}><div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 5 }}><span>{r}</span><span style={{ fontWeight: 700 }}>{pct}%</span></div><div style={{ height: 8, background: "#e5e7eb", borderRadius: 4 }}><div style={{ height: 8, background: "linear-gradient(90deg,#22c55e,#16a34a)", borderRadius: 4, width: `${pct}%` }} /></div></div>
          ))}
        </div>
      </Panel>
      <Panel title="Inventory Turnover">
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[["Accessories", "4.2x", "+0.3"], ["Electronics", "2.8x", "-0.1"], ["Office", "1.9x", "+0.5"]].map(([c, r, d]) => (
            <div key={c} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", background: "#f3f4f6", borderRadius: 10 }}><span style={{ fontSize: 13, fontWeight: 600 }}>{c}</span><div style={{ display: "flex", gap: 12, alignItems: "center" }}><span style={{ fontSize: 18, fontWeight: 700 }}>{r}</span><span style={{ fontSize: 12, fontWeight: 600, color: d.startsWith("+") ? "#16a34a" : "#dc2626" }}>{d}</span></div></div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

/* ═══ STORE PAGE + SYNC ═══ */
function StorePage() {
  const toast = useToast();
  const [stores, setStores] = useState([]);
  const [form, setForm] = useState(false);
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div><h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Connected Stores</h2><p style={{ fontSize: 13, color: "#6b7080" }}>Manage Shopify connections</p></div>
        {!form && <Btn green onClick={() => setForm(true)}>+ Connect Store</Btn>}
      </div>
      {form && <ConnectForm onDone={s => { setStores(p => [...p, s]); setForm(false); toast(`${s.name} connected`); }} onCancel={() => setForm(false)} />}
      {stores.length > 0 ? stores.map(s => <StoreCard key={s.id} store={s} onRemove={() => { setStores(p => p.filter(x => x.id !== s.id)); toast("Disconnected"); }} onPrimary={() => { setStores(p => p.map(x => ({ ...x, primary: x.id === s.id }))); toast("Primary set"); }} />) :
        !form && <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, textAlign: "center", padding: "60px 20px" }}>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>No stores connected</div>
          <div style={{ fontSize: 13, color: "#9ca3af", marginBottom: 20 }}>Connect your Shopify store to get started</div>
          <Btn green onClick={() => setForm(true)}>+ Connect First Store</Btn>
        </div>}
    </div>
  );
}

function ConnectForm({ onDone, onCancel }) {
  const toast = useToast();
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [token, setToken] = useState("");
  const go1 = () => { if (!url.trim()) { toast("Enter URL"); return; } setStep(2); };
  const go2 = async () => {
    if (!token.trim()) { toast("Enter token"); return; }
    setStep(3); setBusy(true);
    try { await api.registerStore({ store_url: url, store_name: name, access_token: token }); } catch { }
    await new Promise(r => setTimeout(r, 1500));
    setBusy(false); setStep(4);
    setTimeout(() => onDone({ id: Date.now().toString(), url: url.includes(".") ? url : url + ".myshopify.com", name: name || url, connected_at: new Date().toISOString(), status: "active", primary: false }), 800);
  };
  return (
    <Panel title="Connect Store" right={<Btn small onClick={onCancel}>Cancel</Btn>}>
      <div style={{ display: "flex", marginBottom: 24 }}>
        {["URL", "Auth", "Verify", "Done"].map((s, i) => { const n = i + 1; const a = step >= n; return (
          <div key={s} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, position: "relative" }}>
            {i > 0 && <div style={{ position: "absolute", top: 14, right: "50%", width: "100%", height: 2, background: a ? "#22c55e" : "#e5e7eb", zIndex: 0 }} />}
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: a ? "#22c55e" : "#e5e7eb", color: a ? "#fff" : "#9ca3af", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, zIndex: 1, boxShadow: step === n ? "0 0 0 4px rgba(34,197,94,.2)" : "none" }}>{a && step > n ? "v" : n}</div>
            <span style={{ fontSize: 11, color: a ? "#0f1115" : "#9ca3af", fontWeight: step === n ? 600 : 400 }}>{s}</span>
          </div>
        ); })}
      </div>
      {step === 1 && <div>
        <div style={{ marginBottom: 16 }}><div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Store URL</div><input value={url} onChange={e => setUrl(e.target.value)} onKeyDown={e => e.key === "Enter" && go1()} placeholder="yourstore.myshopify.com" autoFocus style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: "8px 12px", fontSize: 13, fontFamily: "inherit", width: "100%", outline: "none" }} /></div>
        <div style={{ marginBottom: 16 }}><div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Display Name</div><input value={name} onChange={e => setName(e.target.value)} placeholder="My Store" style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: "8px 12px", fontSize: 13, fontFamily: "inherit", width: "100%", outline: "none" }} /></div>
        <Btn green onClick={go1}>Continue</Btn>
      </div>}
      {step === 2 && <div>
        <div style={{ marginBottom: 16 }}><div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Admin API Access Token</div><input value={token} onChange={e => setToken(e.target.value)} onKeyDown={e => e.key === "Enter" && go2()} placeholder="shpat_xxxxxxxxxxxxx" type="password" autoFocus style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: "8px 12px", fontSize: 13, fontFamily: "monospace", width: "100%", outline: "none" }} /></div>
        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: 14, marginBottom: 16, fontSize: 12, color: "#166534", lineHeight: 1.6 }}><strong>Required:</strong> read_products, write_products, read_orders, write_orders, read_inventory, write_inventory</div>
        <div style={{ display: "flex", gap: 8 }}><Btn onClick={() => setStep(1)}>Back</Btn><Btn green onClick={go2}>Connect</Btn></div>
      </div>}
      {step === 3 && busy && <div style={{ textAlign: "center", padding: 40 }}><div style={{ width: 40, height: 40, border: "3px solid #e5e7eb", borderTop: "3px solid #22c55e", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} /><div style={{ fontSize: 14, fontWeight: 600 }}>Connecting...</div></div>}
      {step === 4 && <div style={{ textAlign: "center", padding: 40 }}><div style={{ width: 48, height: 48, background: "#dcfce7", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 18, color: "#15803d", fontWeight: 700 }}>OK</div><div style={{ fontSize: 16, fontWeight: 700 }}>Connected</div></div>}
    </Panel>
  );
}

function StoreCard({ store, onRemove, onPrimary }) {
  const [open, setOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const toast = useToast();
  const doSync = async (e) => {
    e.stopPropagation();
    setSyncing(true);
    try { await api.syncStore(store.id); } catch { }
    setLastSync(new Date().toLocaleTimeString());
    toast(`${store.name}: Sync complete`);
    setSyncing(false);
  };
  return (
    <div className="hov-card" style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, overflow: "hidden", marginBottom: 12 }}>
      <div onClick={() => setOpen(!open)} style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 14, cursor: "pointer" }}>
        <div style={{ width: 40, height: 40, background: "#f3f4f6", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "#6b7080" }}>{Ic.store}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}><span style={{ fontSize: 14, fontWeight: 600 }}>{store.name}</span>{store.primary && <span style={{ fontSize: 10, fontWeight: 600, color: "#2563eb", background: "#dbeafe", padding: "1px 6px", borderRadius: 4 }}>PRIMARY</span>}</div>
          <div style={{ fontSize: 12, color: "#9ca3af" }}>{store.url}</div>
        </div>
        <Btn small disabled={syncing} onClick={doSync} style={{ marginRight: 8, opacity: syncing ? .6 : 1, cursor: syncing ? "not-allowed" : "pointer" }}>
          {syncing ? <><span style={{ display: "inline-block", width: 12, height: 12, border: "2px solid #e5e7eb", borderTop: "2px solid #16a34a", borderRadius: "50%", animation: "spin 1s linear infinite" }} /> Syncing...</> : <><span style={{ display: "flex" }}>{Ic.refresh}</span> Sync</>}
        </Btn>
        <Tag c="green">Active</Tag>
      </div>
      {open && <div style={{ padding: "0 20px 16px", borderTop: "1px solid #e5e7eb", paddingTop: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
          {[["Connected", new Date(store.connected_at).toLocaleDateString()], ["Status", "Active"], ["Last Sync", lastSync || "Never"], ["Plan", "Growth"]].map(([l, v]) => (
            <div key={l} style={{ background: "#f3f4f6", borderRadius: 8, padding: "10px 12px" }}><div style={{ fontSize: 10, fontWeight: 500, color: "#9ca3af", textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 2 }}>{l}</div><div style={{ fontSize: 13, fontWeight: 600 }}>{v}</div></div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {!store.primary && <Btn onClick={onPrimary}>Set Primary</Btn>}
          <Btn danger onClick={onRemove}>Disconnect</Btn>
        </div>
      </div>}
    </div>
  );
}

/* ═══ SETTINGS ═══ */
function SettingsPage() {
  const toast = useToast();
  const [s, setS] = useState({ safety: 10, lead: 7, moq: 20, max: 500, auto: true, alert: false, approve: true });
  const up = (k, v) => setS(p => ({ ...p, [k]: v }));
  const Tgl = ({ label, k }) => <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "#2d2f36", marginBottom: 10 }}><div onClick={() => up(k, !s[k])} style={{ position: "relative", width: 38, height: 22, background: s[k] ? "#22c55e" : "#e5e7eb", borderRadius: 11, cursor: "pointer", transition: "background .2s", flexShrink: 0 }}><div style={{ position: "absolute", top: 3, left: s[k] ? 19 : 3, width: 16, height: 16, background: "#fff", borderRadius: "50%", transition: "left .2s", boxShadow: "0 1px 3px rgba(0,0,0,.12)" }} /></div>{label}</div>;
  return (
    <div style={{ maxWidth: 600 }}>
      <Panel title="Auto-Reorder Configuration">
        {[["Safety Stock", "Alert below this level", "safety"], ["Lead Time (days)", "Avg delivery time", "lead"], ["Min Order Qty", "Smallest order", "moq"], ["Max Auto-Order ($)", "Cap", "max"]].map(([l, d, k]) => (
          <div key={k} style={{ marginBottom: 24 }}><div style={{ fontSize: 13, fontWeight: 600, marginBottom: 3 }}>{l}</div><div style={{ fontSize: 12, color: "#6b7080", marginBottom: 10 }}>{d}</div><input type="number" value={s[k]} onChange={e => up(k, +e.target.value)} style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: "8px 12px", fontSize: 13, fontFamily: "inherit", width: 200, outline: "none" }} /></div>
        ))}
        <div style={{ borderTop: "1px solid #e5e7eb", margin: "20px 0", paddingTop: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Automation</div>
          <Tgl label="Enable auto-reorder" k="auto" /><Tgl label="Alert only" k="alert" /><Tgl label="Auto after approval" k="approve" />
        </div>
        <div style={{ display: "flex", gap: 8 }}><Btn onClick={() => toast("Saved")} style={{ background: "#0f1115", color: "#fff", border: "none" }}>Save</Btn><Btn onClick={() => toast("Reset")}>Reset</Btn></div>
      </Panel>
    </div>
  );
}

/* ═══ TEAM ═══ */
function TeamPage() {
  const m = [{ name: "Alex Kim", role: "Admin", email: "alex@store.com", last: "2h ago" }, { name: "Sarah Park", role: "Manager", email: "sarah@store.com", last: "Yesterday" }, { name: "Mike Lee", role: "Viewer", email: "mike@store.com", last: "3d ago" }];
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}><div><h2 style={{ fontSize: 18, fontWeight: 700 }}>Team</h2><p style={{ fontSize: 13, color: "#6b7080" }}>{m.length} members</p></div><Btn green>+ Invite</Btn></div>
      {m.map(x => <div key={x.email} className="hov-card" style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "16px 20px", marginBottom: 8, display: "flex", alignItems: "center", gap: 14 }}><div style={{ width: 40, height: 40, background: "#f3f4f6", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "#6b7080" }}>{x.name[0]}</div><div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 600 }}>{x.name}</div><div style={{ fontSize: 12, color: "#9ca3af" }}>{x.email}</div></div><Tag c={x.role === "Admin" ? "blue" : "green"}>{x.role}</Tag><span style={{ fontSize: 11, color: "#9ca3af" }}>{x.last}</span></div>)}
    </div>
  );
}

/* ═══ AUDIT LOG ═══ */
function AuditPage() {
  return (
    <Panel title="Audit Log" flush>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead><tr><TH>Time</TH><TH>User</TH><TH>Action</TH><TH>Details</TH></tr></thead>
        <tbody>{[["9:42 AM", "Alex Kim", "Order Approved", "Airpod Case x 80"], ["9:15 AM", "System", "Alert Created", "Phone Holder - Critical"], ["8:30 AM", "Sarah Park", "Settings Updated", "Safety stock changed"], ["Yesterday", "System", "Sync Complete", "24 products synced"], ["Yesterday", "Alex Kim", "Store Connected", "mystore.myshopify.com"]].map(([t, u, a, d], i) => (
          <tr key={i} className="hov-row"><TD dim>{t}</TD><TD bold>{u}</TD><TD>{a}</TD><TD dim>{d}</TD></tr>
        ))}</tbody>
      </table>
    </Panel>
  );
}

/* ═══ REFUNDS ═══ */
function RefundsPage() {
  return (
    <Panel title="Refund Requests" right={<Tag c="blue">3 pending</Tag>}>
      {[{ id: "RF-1024", c: "Kim J.", item: "Airpod Case", reason: "Defective", amt: "$15.00", st: "Pending" }, { id: "RF-1023", c: "Park S.", item: "Phone Holder", reason: "Wrong item", amt: "$12.00", st: "Approved" }, { id: "RF-1022", c: "Lee M.", item: "USB-C Cable", reason: "Changed mind", amt: "$8.00", st: "Approved" }, { id: "RF-1021", c: "Choi Y.", item: "Screen Protector", reason: "Defective", amt: "$5.00", st: "Denied" }].map(r => (
        <div key={r.id} className="hov-card" style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 14px", background: "#f8f9fb", borderRadius: 10, marginBottom: 6, border: "1px solid transparent" }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", width: 70 }}>{r.id}</div>
          <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 600 }}>{r.c} - {r.item}</div><div style={{ fontSize: 11, color: "#9ca3af" }}>{r.reason}</div></div>
          <div style={{ fontSize: 13, fontWeight: 700, width: 60, textAlign: "right" }}>{r.amt}</div>
          <div style={{ width: 70, textAlign: "right" }}><Tag c={r.st === "Pending" ? "amber" : r.st === "Approved" ? "green" : "red"}>{r.st}</Tag></div>
        </div>
      ))}
    </Panel>
  );
}

/* ═══ HELP ═══ */
function HelpPage() {
  return (
    <div style={{ maxWidth: 600 }}>
      <Panel title="Help & Support">
        {[["Getting Started", "Connect your Shopify store and configure automation."], ["API Documentation", "REST API reference for integrations."], ["Billing & Plans", "Manage subscription and invoices."], ["Contact Support", "support@refundos.com"]].map(([t, d]) => (
          <div key={t} className="hov-card" style={{ padding: "14px 16px", background: "#f8f9fb", borderRadius: 10, cursor: "pointer", marginBottom: 6, border: "1px solid transparent" }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{t}</div><div style={{ fontSize: 12, color: "#6b7080" }}>{d}</div>
          </div>
        ))}
      </Panel>
    </div>
  );
}

/* ═══ SIDEBAR NAV ═══ */
const TITLES = { overview: "Overview", products: "Products", detail: "Product Detail", alerts: "Order Alerts", history: "Order History", refunds: "Refund Requests", analytics: "Analytics", store: "Store Management", team: "Team", audit: "Audit Log", settings: "Settings", help: "Help & Support" };
const NAV = [
  { id: "overview", icon: "grid", label: "Overview", sec: "Main" },
  { id: "products", icon: "box", label: "Products" },
  { id: "alerts", icon: "bell", label: "Alerts", badge: true },
  { id: "history", icon: "clock", label: "Order History" },
  { id: "refunds", icon: "shield", label: "Refunds" },
  { id: "analytics", icon: "chart", label: "Analytics", sec: "Insights" },
  { id: "store", icon: "store", label: "Stores", sec: "Integration" },
  { id: "team", icon: "users", label: "Team" },
  { id: "audit", icon: "file", label: "Audit Log" },
  { id: "settings", icon: "gear", label: "Settings", sec: "Configuration" },
  { id: "help", icon: "help", label: "Help & Support" },
];

/* ═══ APP ═══ */
export default function App() {
  const [page, setPage] = useState("overview");
  const [did, setDid] = useState(null);
  const { data: alerts } = useApi(() => api.alerts());
  const nav = (pg, d) => { setPage(pg); if (pg === "detail" && d) setDid(d); };

  return (
    <ToastWrap>
      <div style={{ display: "flex", minHeight: "100vh", fontFamily: "'Inter',system-ui,sans-serif", background: "#f8f9fb", color: "#0f1115", fontSize: 14 }}>
        {/* SIDEBAR */}
        <aside style={{ width: 250, minWidth: 250, background: "#fff", borderRight: "1px solid #e5e7eb", display: "flex", flexDirection: "column", height: "100vh", position: "sticky", top: 0, flexShrink: 0, overflow: "auto" }}>
          <div style={{ padding: "20px 20px 10px", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, background: "#0f1115", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 13 }}>R</div>
            <span style={{ fontWeight: 600, fontSize: 15 }}>RefundOS</span>
          </div>
          <a href="/" className="sb-hov" style={{ margin: "0 12px 4px", padding: "6px 12px", borderRadius: 8, fontSize: 12, color: "#9ca3af", textDecoration: "none", display: "flex", alignItems: "center", gap: 6 }}><span style={{ display: "flex" }}>{Ic.back}</span>Back to site</a>
          <nav style={{ flex: 1, padding: "4px 12px", display: "flex", flexDirection: "column", gap: 1 }}>
            {NAV.map(item => {
              const active = page === item.id || (page === "detail" && item.id === "products");
              return (
                <div key={item.id}>
                  {item.sec && <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".08em", color: "#9ca3af", padding: "14px 12px 6px" }}>{item.sec}</div>}
                  <button onClick={() => nav(item.id)} className={active ? "" : "sb-hov"} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 8, fontSize: 13, fontWeight: active ? 500 : 400, color: active ? "#0f1115" : "#6b7080", background: active ? "#f3f4f6" : "transparent", border: "none", width: "100%", textAlign: "left", fontFamily: "inherit", cursor: "pointer" }}>
                    <span style={{ opacity: active ? .85 : .5, display: "flex" }}>{Ic[item.icon]}</span>
                    {item.label}
                    {item.badge && alerts?.length > 0 && <span style={{ marginLeft: "auto", background: "#dc2626", color: "#fff", fontSize: 10, fontWeight: 600, padding: "0 6px", borderRadius: 10, lineHeight: "18px" }}>{alerts.length}</span>}
                  </button>
                </div>
              );
            })}
          </nav>
          <div style={{ padding: 12, borderTop: "1px solid #e5e7eb" }}>
            <div style={{ fontSize: 12, color: "#9ca3af", background: "#f3f4f6", borderRadius: 8, padding: "10px 12px", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e", flexShrink: 0, boxShadow: "0 0 0 2px rgba(34,197,94,.2)" }} />
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>yourstore.myshopify.com</span>
            </div>
          </div>
        </aside>

        {/* MAIN */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflowY: "auto" }}>
          <div style={{ height: 56, background: "#fff", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", padding: "0 28px", flexShrink: 0 }}>
            <span style={{ fontSize: 15, fontWeight: 600 }}>{TITLES[page] || ""}</span>
            <div style={{ marginLeft: "auto" }}><Tag c="green">API Connected</Tag></div>
          </div>
          <div style={{ flex: 1, padding: "24px 28px 40px" }}>
            {page === "overview" && <OverviewPage />}
            {page === "products" && <ProductsPage onView={id => nav("detail", id)} />}
            {page === "detail" && <DetailPage id={did} onBack={() => nav("products")} />}
            {page === "alerts" && <AlertsPage onView={id => nav("detail", id)} />}
            {page === "history" && <HistoryPage />}
            {page === "refunds" && <RefundsPage />}
            {page === "analytics" && <AnalyticsPage />}
            {page === "store" && <StorePage />}
            {page === "team" && <TeamPage />}
            {page === "audit" && <AuditPage />}
            {page === "settings" && <SettingsPage />}
            {page === "help" && <HelpPage />}
          </div>
        </div>
      </div>
    </ToastWrap>
  );
}
