const API = "https://animated-space-chainsaw-5gpq7w9g5gqj2vjwq-3000.app.github.dev";

async function call(ep, opts = {}) {
  const r = await fetch(`${API}${ep}`, {
    headers: { "Content-Type": "application/json", ...opts.headers },
    ...opts,
  });
  if (!r.ok) throw new Error(`API ${r.status}`);
  return r.json();
}

function mapProduct(r) {
  return {
    id: r.id,
    name: r.name || "Unknown",
    sku: r.sku || "",
    category: r.category || "General",
    stock: r.stock ?? 0,
    avg: r.avgDailySales ?? 0,
    lead: r.leadTimeDays ?? 5,
    safety: r.safetyStock ?? 10,
    moq: r.moq ?? 20,
    price: r.price ?? 0,
    option: r.option || "",
    status: r.status || null,
    oos: r.expectedOutOfStockDays ?? null,
  };
}

function mapDetail(r) {
  const b = mapProduct(r);
  return {
    ...b,
    s7: r.salesLast7Days ?? b.avg * 7,
    s30: r.salesLast30Days ?? b.avg * 30,
    recQty: r.recommendedOrderQty ?? null,
  };
}

const api = {
  async metrics() {
    const r = await call("/dashboard/metrics");
    return {
      total: r.totalProducts ?? 0,
      low: r.lowStockProducts ?? 0,
      critical: r.criticalProducts ?? 0,
      sales: r.todaySales ?? 0,
      avgSales: r.avgDailySales ?? 0,
      stock: r.totalStock ?? 0,
    };
  },

  async products() {
    const r = await call("/products");
    return (r.products || r || []).map(mapProduct);
  },

  async product(id) {
    return mapDetail(await call(`/products/${id}`));
  },

  async alerts() {
    const r = await call("/alerts");
    return (r.alerts || r || []).map((a) => ({
      id: a.productId,
      name: a.name,
      stock: a.stock,
      avg: a.avgDailySales,
      severity: a.level === "critical" ? "critical" : "warning",
      oos: a.expectedOutOfStockDays,
      recQty: a.recommendedOrderQty,
      message: a.message,
    }));
  },

  async approve(pid, qty) {
    return call("/orders/approve", {
      method: "POST",
      body: JSON.stringify({ product_id: pid, quantity: qty }),
    });
  },

  async syncStore(id) {
    return call(`/store/${id}/sync`, { method: "POST" });
  },

  async registerStore(data) {
    return call("/stores/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
};

export default api;
