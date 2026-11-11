const STORAGE_KEYS = {
  products: "stockflow-products-v1",
  movements: "stockflow-movements-v1",
  categories: "stockflow-categories-v1",
  settings: "stockflow-settings-v1"
};

const initialProducts = [
  { id: "p-1", name: "Studio Headphones", sku: "AUD-1024", category: "Electronics", quantity: 48, price: 89, emoji: "🎧", color: "#e9edff", sold: 142, supplier: "NexGen Supply" },
  { id: "p-2", name: "Minimal Desk Lamp", sku: "HOM-2041", category: "Home & Living", quantity: 32, price: 64, emoji: "💡", color: "#fff2d9", sold: 118, supplier: "Northstar Goods" },
  { id: "p-3", name: "Everyday Backpack", sku: "ACC-3088", category: "Accessories", quantity: 7, price: 55, emoji: "🎒", color: "#e7f5ed", sold: 96, supplier: "Urban Supply Co." },
  { id: "p-4", name: "Ceramic Pour-over Set", sku: "KIT-4102", category: "Kitchen", quantity: 21, price: 42, emoji: "☕", color: "#f7e9e4", sold: 87, supplier: "Northstar Goods" },
  { id: "p-5", name: "Wireless Mouse", sku: "TEC-5026", category: "Electronics", quantity: 0, price: 38, emoji: "🖱️", color: "#e9edff", sold: 76, supplier: "NexGen Supply" },
  { id: "p-6", name: "Linen Throw Blanket", sku: "HOM-6073", category: "Home & Living", quantity: 16, price: 78, emoji: "🧶", color: "#fff2d9", sold: 64, supplier: "Northstar Goods" },
  { id: "p-7", name: "Stainless Water Bottle", sku: "ACC-7044", category: "Accessories", quantity: 5, price: 28, emoji: "🥤", color: "#e7f5ed", sold: 59, supplier: "Urban Supply Co." },
  { id: "p-8", name: "Notebook Set", sku: "OFF-8081", category: "Office", quantity: 63, price: 18, emoji: "📒", color: "#f2eafb", sold: 51, supplier: "Paper & Co." }
];
const initialCategories = [
  { name: "Electronics", description: "Devices, accessories & tech", emoji: "⌘", color: "#eef0ff" },
  { name: "Home & Living", description: "Thoughtful things for your home", emoji: "⌂", color: "#fff4e2" },
  { name: "Accessories", description: "Everyday essentials & more", emoji: "✧", color: "#e8f6ee" },
  { name: "Kitchen", description: "Tools for the heart of your home", emoji: "♨", color: "#f9ece8" },
  { name: "Office", description: "Make your workspace work for you", emoji: "▤", color: "#f2ebfa" }
];
const suppliers = [
  { name: "NexGen Supply", initials: "NG", color: "#e9edff", email: "hello@nexgensupply.example", phone: "+1 (415) 555-0182", products: ["Studio Headphones", "Wireless Mouse"], orders: 18, status: "Active" },
  { name: "Northstar Goods", initials: "NS", color: "#fff1df", email: "orders@northstargoods.example", phone: "+1 (212) 555-0147", products: ["Minimal Desk Lamp", "Ceramic Pour-over Set", "Linen Throw Blanket"], orders: 24, status: "Active" },
  { name: "Urban Supply Co.", initials: "US", color: "#e7f5ed", email: "team@urbansupply.example", phone: "+1 (312) 555-0193", products: ["Everyday Backpack", "Stainless Water Bottle"], orders: 12, status: "Active" },
  { name: "Paper & Co.", initials: "P", color: "#f2eafb", email: "studio@paperandco.example", phone: "+1 (503) 555-0170", products: ["Notebook Set"], orders: 9, status: "Active" }
];
const names = { dashboard: "Dashboard", products: "Products", categories: "Categories", stock: "Stock management", suppliers: "Suppliers", reports: "Reports", settings: "Settings" };
const currencySymbols = { USD: "$", EUR: "€", GBP: "£", CAD: "CA$", AUD: "A$" };

function readStore(key, fallback) {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : structuredClone(fallback);
  } catch (error) {
    console.error(`Unable to read ${key} from localStorage.`, error);
    return structuredClone(fallback);
  }
}
let products = readStore(STORAGE_KEYS.products, initialProducts);
let movements = readStore(STORAGE_KEYS.movements, [
  { id: "m-1", type: "in", productId: "p-1", productName: "Studio Headphones", quantity: 24, date: new Date(Date.now() - 1000 * 60 * 38).toISOString(), note: "Purchase order received" },
  { id: "m-2", type: "out", productId: "p-4", productName: "Ceramic Pour-over Set", quantity: -6, date: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), note: "Online order fulfillment" },
  { id: "m-3", type: "adjustment", productId: "p-3", productName: "Everyday Backpack", quantity: -2, date: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), note: "Damaged stock write-off" },
  { id: "m-4", type: "in", productId: "p-8", productName: "Notebook Set", quantity: 30, date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), note: "Purchase order received" }
]);
let categories = readStore(STORAGE_KEYS.categories, initialCategories);
let settings = readStore(STORAGE_KEYS.settings, { businessName: "Acme Studio", email: "jordan@acmestudio.example", currency: "USD", lowStockThreshold: 10, compactRows: false, emailAlerts: true });
let currentPage = "dashboard";
let productQuery = "";
let categoryFilter = "all";
let statusFilter = "all";
let movementFilter = "all";
let movementType = "in";
let chartPeriod = "6m";

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const escapeHTML = value => String(value ?? "").replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
const money = amount => `${currencySymbols[settings.currency] || "$"}${Number(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const stockStatus = quantity => quantity === 0 ? "Out of stock" : quantity <= Number(settings.lowStockThreshold || 10) ? "Low stock" : "In stock";
const productById = id => products.find(product => product.id === id);
const save = (key, value) => {
  try { localStorage.setItem(key, JSON.stringify(value)); }
  catch (error) { console.error(`Unable to save ${key} to localStorage.`, error); showToast("Your changes could not be saved in this browser.", true); }
};
const thumb = product => `<span class="product-thumb" style="background:${escapeHTML(product.color || "#eef1ff")}">${escapeHTML(product.emoji || "📦")}</span>`;
const statusBadge = quantity => {
  const status = stockStatus(Number(quantity));
  const className = status === "In stock" ? "status-in" : status === "Low stock" ? "status-low" : "status-out";
  return `<span class="status-badge ${className}">${status}</span>`;
};
const formatDate = date => new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(date));

function pageHeader(title, subtitle, actions = "") {
  return `<div class="page-heading"><div><p class="eyebrow">StockFlow workspace</p><h1>${title}</h1><p>${subtitle}</p></div><div class="heading-actions">${actions}</div></div>`;
}
function setPage(page) {
  if (!names[page]) return;
  currentPage = page;
  $$(".nav-item").forEach(button => button.classList.toggle("active", button.dataset.page === page));
  $("#breadcrumb-current").textContent = names[page];
  $("#sidebar").classList.remove("open");
  renderPage();
}
function renderPage() {
  const content = $("#page-content");
  if (!content) return;
  const renderers = { dashboard: renderDashboard, products: renderProducts, categories: renderCategories, stock: renderStock, suppliers: renderSuppliers, reports: renderReports, settings: renderSettings };
  content.innerHTML = renderers[currentPage]();
  $("#product-nav-count").textContent = products.length;
}
function renderDashboard() {
  const totalUnits = products.reduce((sum, product) => sum + Number(product.quantity), 0);
  const stockValue = products.reduce((sum, product) => sum + Number(product.quantity) * Number(product.price), 0);
  const lowCount = products.filter(product => product.quantity > 0 && product.quantity <= settings.lowStockThreshold).length;
  const outCount = products.filter(product => product.quantity === 0).length;
  return `${pageHeader("Good morning, Jordan <span aria-hidden=\"true\">☀️</span>", "Here's what's happening with your inventory today.", `<button class="button button-secondary" data-action="export">↧ &nbsp;Export</button><button class="button button-primary" data-action="open-product">＋ &nbsp;Add product</button>`)}
    <div class="stats-grid">
      ${statCard("Total products", products.length.toLocaleString(), "▦", `<span class="positive">↗ 12%</span> vs. last month`, "Across all categories")}
      ${statCard("Total stock value", money(stockValue), "◈", `<span class="positive">↗ 8.2%</span> vs. last month`, "At current unit prices")}
      ${statCard("Low-stock products", lowCount.toLocaleString(), "△", `${lowCount ? "Needs your attention" : "All stocked up"}`, `Below ${settings.lowStockThreshold} units`)}
      ${statCard("Out of stock", outCount.toLocaleString(), "⊘", `${outCount ? "Restock recommended" : "No stockouts"}`, "Products with zero units")}
    </div>
    <div class="dashboard-grid">
      <section class="panel"><div class="panel-heading"><div><h2>Inventory overview</h2><p class="panel-subtitle">Stock movement over time</p></div><select class="select-small" id="chart-period" aria-label="Chart period"><option value="6m" ${chartPeriod === "6m" ? "selected" : ""}>Last 6 months</option><option value="12m" ${chartPeriod === "12m" ? "selected" : ""}>Last 12 months</option></select></div>${inventoryChart()}</section>
      <section class="panel"><div class="panel-heading"><div><h2>Stock by category</h2><p class="panel-subtitle">Current inventory distribution</p></div><button class="text-link" data-page="categories">View all</button></div>${categoryDonut()}</section>
    </div>
    <div class="dashboard-lower">
      <section class="panel"><div class="panel-heading"><div><h2>Recent stock activity</h2><p class="panel-subtitle">The latest changes to your inventory</p></div><button class="text-link" data-page="stock">View activity</button></div>${activityList(movements.slice(0, 4))}</section>
      <section class="panel"><div class="panel-heading"><div><h2>Top-selling products</h2><p class="panel-subtitle">Best performers this month</p></div><button class="text-link" data-page="reports">View report</button></div>${topProducts()}</section>
    </div>`;
}
function statCard(title, value, icon, change, foot) {
  return `<article class="stat-card"><div class="stat-top"><span>${title}</span><span class="stat-icon">${icon}</span></div><div class="stat-value">${value}</div><div class="stat-foot">${change} <span style="color:#a1aaba">· ${foot}</span></div></article>`;
}
function inventoryChart() {
  const labels = chartPeriod === "6m" ? ["Jun", "Jul", "Aug", "Sep", "Oct", "Nov"] : ["Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov"];
  const values = chartPeriod === "6m" ? [40, 58, 49, 72, 64, 83, 69, 91, 77, 95, 82, 108] : [32, 45, 37, 54, 46, 61, 50, 67, 55, 74, 62, 78, 64, 84, 70, 90, 77, 101, 88, 112, 96, 123, 108, 136];
  const left = 39, right = 610, top = 14, bottom = 181, max = 150;
  const points = values.map((value, index) => `${left + index * (right - left) / (values.length - 1)},${bottom - value / max * (bottom - top)}`).join(" ");
  const fillPoints = `${left},${bottom} ${points} ${right},${bottom}`;
  const labelIndexes = labels.map((_, index) => Math.round(index * (values.length - 1) / (labels.length - 1)));
  return `<div class="chart-area"><svg viewBox="0 0 640 215" role="img" aria-label="Inventory trend line chart">
    <defs><linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#5574ed" stop-opacity=".20"/><stop offset="1" stop-color="#5574ed" stop-opacity="0"/></linearGradient></defs>
    ${[0, 1, 2, 3].map(i => { const y = top + i * (bottom - top) / 3; return `<line x1="${left}" y1="${y}" x2="${right}" y2="${y}" class="chart-gridline"/><text x="0" y="${y + 3}" class="chart-label">${150 - i * 50}</text>`; }).join("")}
    <polygon points="${fillPoints}" class="chart-fill"/><polyline points="${points}" class="chart-line"/>
    ${labelIndexes.map((index, i) => { const x = left + index * (right - left) / (values.length - 1); const y = bottom - values[index] / max * (bottom - top); return `<circle cx="${x}" cy="${y}" r="3.5" class="chart-point"/><text x="${x}" y="202" text-anchor="middle" class="chart-label">${labels[i]}</text>`; }).join("")}</svg></div>`;
}
function categoryDonut() {
  const palette = ["#5574ed", "#39ae83", "#f2ad4e", "#d780a1", "#8c78d9", "#48a9c5"];
  const totals = categories.map(category => ({ name: category.name, quantity: products.filter(product => product.category === category.name).reduce((sum, product) => sum + Number(product.quantity), 0) })).filter(item => item.quantity > 0);
  const total = totals.reduce((sum, item) => sum + item.quantity, 0);
  let offset = 0;
  const segments = totals.map((item, index) => {
    const length = item.quantity / (total || 1) * 100;
    const segment = `<circle class="donut-segment" cx="70" cy="70" r="52" stroke="${palette[index % palette.length]}" stroke-dasharray="${length * 3.267} ${326.7 - length * 3.267}" stroke-dashoffset="${-offset * 3.267}"/>`;
    offset += length; return segment;
  }).join("");
  return `<div class="donut-wrap"><svg class="donut" viewBox="0 0 140 140" aria-label="Inventory by category"><circle class="donut-bg" cx="70" cy="70" r="52"/>${segments}</svg><div class="donut-center"><strong>${total}</strong><small>total units</small></div></div><div class="legend">${totals.slice(0, 4).map((item, index) => `<div class="legend-item"><i class="legend-dot" style="background:${palette[index % palette.length]}"></i>${escapeHTML(item.name)}<strong>${Math.round(item.quantity / (total || 1) * 100)}%</strong></div>`).join("") || `<span class="panel-subtitle">No stock to display</span>`}</div>`;
}
function activityList(list) {
  if (!list.length) return `<div class="empty-state"><div class="empty-symbol">↔</div><strong>No stock activity yet</strong><p>Stock changes will show up here.</p></div>`;
  return `<div class="activity-list">${list.map(movement => {
    const type = movement.type === "adjustment" ? "adjustment" : movement.type;
    const sign = movement.quantity > 0 ? "+" : "";
    return `<div class="activity-row"><span class="activity-icon ${type}">${movement.type === "in" ? "↓" : movement.type === "out" ? "↑" : "↕"}</span><div class="activity-copy"><strong>${escapeHTML(movement.type === "in" ? "Stock received" : movement.type === "out" ? "Stock removed" : "Stock adjusted")} · ${escapeHTML(movement.productName)}</strong><small>${escapeHTML(movement.note || "Inventory update")} · ${formatDate(movement.date)}</small></div><span class="activity-qty ${movement.type === "out" ? "out" : ""}">${sign}${movement.quantity}</span></div>`;
  }).join("")}</div>`;
}
function topProducts() {
  const top = [...products].sort((a, b) => Number(b.sold || 0) - Number(a.sold || 0)).slice(0, 4);
  return top.length ? `<div class="top-products">${top.map(product => `<div class="top-product">${thumb(product)}<div class="product-info"><strong>${escapeHTML(product.name)}</strong><small>${escapeHTML(product.category)}</small></div><div class="top-sales">${Number(product.sold || 0)} sold<small>${money(Number(product.sold || 0) * Number(product.price))}</small></div></div>`).join("")}</div>` : `<div class="empty-state"><strong>No products yet</strong><p>Add products to see your best sellers.</p></div>`;
}
function renderProducts() {
  const filtered = products.filter(product => {
    const queryMatch = `${product.name} ${product.sku} ${product.category}`.toLowerCase().includes(productQuery.toLowerCase());
    const categoryMatch = categoryFilter === "all" || product.category === categoryFilter;
    const status = stockStatus(Number(product.quantity));
    const statusMatch = statusFilter === "all" || status.toLowerCase().replaceAll(" ", "-") === statusFilter;
    return queryMatch && categoryMatch && statusMatch;
  });
  return `${pageHeader("Products", "Manage your products, stock levels, and pricing.", `<button class="button button-secondary" data-action="export">↧ &nbsp;Export</button><button class="button button-primary" data-action="open-product">＋ &nbsp;Add product</button>`)}
    <section class="table-card"><div class="toolbar"><div class="toolbar-left"><label class="search-box"><span>⌕</span><input id="product-search" type="search" placeholder="Search products..." value="${escapeHTML(productQuery)}" aria-label="Search products"></label></div><div class="toolbar-right"><select class="filter-select" id="category-filter" aria-label="Filter by category"><option value="all">All categories</option>${categories.map(category => `<option value="${escapeHTML(category.name)}" ${categoryFilter === category.name ? "selected" : ""}>${escapeHTML(category.name)}</option>`).join("")}</select><select class="filter-select" id="status-filter" aria-label="Filter by stock status"><option value="all">All statuses</option><option value="in-stock" ${statusFilter === "in-stock" ? "selected" : ""}>In stock</option><option value="low-stock" ${statusFilter === "low-stock" ? "selected" : ""}>Low stock</option><option value="out-of-stock" ${statusFilter === "out-of-stock" ? "selected" : ""}>Out of stock</option></select></div></div>
    <div class="table-wrap"><table class="data-table"><thead><tr><th>Product</th><th>Category</th><th>Stock</th><th>Unit price</th><th>Status</th><th>Actions</th></tr></thead><tbody>${filtered.length ? filtered.map(productRow).join("") : `<tr><td colspan="6"><div class="empty-state"><div class="empty-symbol">⌕</div><strong>No products found</strong><p>Try adjusting your search or filters.</p></div></td></tr>`}</tbody></table></div><div class="table-footer"><span>Showing ${filtered.length} of ${products.length} products</span><span>Inventory updates are saved on this device</span></div></section>`;
}
function productRow(product) {
  return `<tr><td><div class="product-cell">${thumb(product)}<div><div class="product-name">${escapeHTML(product.name)}</div><div class="product-sku">${escapeHTML(product.sku)}</div></div></div></td><td>${escapeHTML(product.category)}</td><td>${Number(product.quantity)} units</td><td>${money(product.price)}</td><td>${statusBadge(Number(product.quantity))}</td><td><div class="row-actions"><button class="action-button" data-action="edit-product" data-id="${escapeHTML(product.id)}" aria-label="Edit ${escapeHTML(product.name)}">✎</button><button class="action-button delete" data-action="delete-product" data-id="${escapeHTML(product.id)}" aria-label="Delete ${escapeHTML(product.name)}">⌫</button></div></td></tr>`;
}
function renderCategories() {
  const palette = ["#eef0ff", "#fff4e2", "#e8f6ee", "#f9ece8", "#f2ebfa", "#e6f4f8"];
  return `${pageHeader("Categories", "Organize your products into clear, easy-to-manage groups.", `<button class="button button-primary" data-action="open-category">＋ &nbsp;Add category</button>`)}
    <div class="category-grid">${categories.map((category, index) => {
      const count = products.filter(product => product.category === category.name).length;
      return `<article class="category-card"><div class="category-card-top"><span class="category-icon" style="background:${escapeHTML(category.color || palette[index % palette.length])};color:#586fd0">${escapeHTML(category.emoji || "◫")}</span><button class="action-button" data-action="edit-category" data-name="${escapeHTML(category.name)}" aria-label="Edit ${escapeHTML(category.name)}">✎</button></div><h3>${escapeHTML(category.name)}</h3><p>${escapeHTML(category.description || "Product collection")}</p><div class="category-card-foot"><span>Products</span><strong>${count} ${count === 1 ? "item" : "items"}</strong></div></article>`;
    }).join("") || `<section class="panel empty-state"><div class="empty-symbol">◫</div><strong>No categories yet</strong><p>Create your first category to organize products.</p></section>`}</div>`;
}
function renderStock() {
  return `${pageHeader("Stock management", "Track stock coming in, going out, and adjustments.", `<button class="button button-secondary" data-action="export">↧ &nbsp;Export history</button>`)}
    <div class="stock-layout"><section class="panel stock-form"><h2>Record a stock movement</h2><p>Updates your inventory immediately and records the change.</p><div class="movement-toggle" role="group" aria-label="Movement type"><button class="${movementType === "in" ? "active" : ""}" data-movement-type="in">↓ &nbsp;Stock in</button><button class="${movementType === "out" ? "active" : ""}" data-movement-type="out">↑ &nbsp;Stock out</button><button class="${movementType === "adjustment" ? "active" : ""}" data-movement-type="adjustment">↕ &nbsp;Adjust</button></div>
      <form id="movement-form"><div class="field"><label for="movement-product">Product</label><select id="movement-product" name="productId" required><option value="">Select a product</option>${products.map(product => `<option value="${escapeHTML(product.id)}">${escapeHTML(product.name)} · ${Number(product.quantity)} in stock</option>`).join("")}</select></div><div class="field-row"><div class="field"><label for="movement-quantity">${movementType === "adjustment" ? "New quantity" : "Quantity"}</label><input id="movement-quantity" name="quantity" type="number" min="${movementType === "adjustment" ? "0" : "1"}" step="1" required placeholder="${movementType === "adjustment" ? "e.g. 25" : "e.g. 10"}"></div><div class="field"><label for="movement-reference">Reference</label><input id="movement-reference" name="reference" placeholder="e.g. PO-1042"></div></div><div class="field"><label for="movement-note">Notes</label><textarea id="movement-note" name="note" placeholder="${movementType === "in" ? "Purchase order, delivery details..." : movementType === "out" ? "Sales order, reason for removal..." : "Reason for this adjustment..."}"></textarea></div><button class="button button-primary" type="submit">Record ${movementType === "in" ? "stock in" : movementType === "out" ? "stock out" : "adjustment"}</button></form></section>
      <section class="table-card"><div class="toolbar"><div><h2 class="panel-title">Movement history</h2><p class="panel-subtitle">A log of recent inventory changes</p></div><select class="filter-select" id="movement-filter" aria-label="Filter movement history"><option value="all">All movements</option><option value="in" ${movementFilter === "in" ? "selected" : ""}>Stock in</option><option value="out" ${movementFilter === "out" ? "selected" : ""}>Stock out</option><option value="adjustment" ${movementFilter === "adjustment" ? "selected" : ""}>Adjustments</option></select></div><div class="table-wrap"><table class="data-table"><thead><tr><th>Product</th><th>Movement</th><th>Quantity</th><th>Reference / note</th><th>Date</th></tr></thead><tbody>${movementRows()}</tbody></table></div><div class="table-footer"><span>${movements.filter(item => movementFilter === "all" || item.type === movementFilter).length} movements</span><span>Newest first</span></div></section></div>`;
}
function movementRows() {
  const list = movements.filter(item => movementFilter === "all" || item.type === movementFilter);
  return list.length ? list.map(movement => `<tr><td><div class="product-name">${escapeHTML(movement.productName)}</div><div class="product-sku">${escapeHTML(movement.productId || "—")}</div></td><td>${movement.type === "in" ? "Stock in" : movement.type === "out" ? "Stock out" : "Adjustment"}</td><td style="font-weight:600;color:${movement.quantity < 0 ? "#cb7650" : "#388c68"}">${movement.quantity > 0 ? "+" : ""}${movement.quantity}</td><td>${escapeHTML(movement.note || "—")}</td><td>${formatDate(movement.date)}</td></tr>`).join("") : `<tr><td colspan="5"><div class="empty-state"><strong>No movements to show</strong><p>Try a different filter or record your first movement.</p></div></td></tr>`;
}
function renderSuppliers() {
  return `${pageHeader("Suppliers", "Keep track of your partners and the products they supply.", `<button class="button button-primary" data-action="supplier-info">＋ &nbsp;Supplier details</button>`)}
    <div class="supplier-grid">${suppliers.map(supplier => `<article class="supplier-card"><div class="supplier-top"><span class="supplier-logo" style="background:${supplier.color};color:#596ed0">${supplier.initials}</span><div><h3>${escapeHTML(supplier.name)}</h3><small>${supplier.status} supplier</small></div></div><div class="supplier-details"><div class="supplier-detail"><span>Email</span><strong>${escapeHTML(supplier.email)}</strong></div><div class="supplier-detail"><span>Phone</span><strong>${escapeHTML(supplier.phone)}</strong></div><div class="supplier-detail"><span>Orders this year</span><strong>${supplier.orders}</strong></div></div><p class="supplier-products"><span>Supplies</span><br>${supplier.products.map(escapeHTML).join(" · ")}</p></article>`).join("")}</div>`;
}
function renderReports() {
  const valuation = products.reduce((sum, product) => sum + product.quantity * product.price, 0);
  const low = products.filter(product => product.quantity > 0 && product.quantity <= settings.lowStockThreshold);
  const totalSold = products.reduce((sum, product) => sum + Number(product.sold || 0), 0);
  const movementTotals = categories.map(category => ({ name: category.name, count: products.filter(product => product.category === category.name).reduce((sum, product) => sum + Number(product.sold || 0), 0) })).sort((a, b) => b.count - a.count);
  const max = Math.max(1, ...movementTotals.map(item => item.count));
  return `${pageHeader("Reports", "A clear picture of your inventory performance.", `<button class="button button-secondary" data-action="export">↧ &nbsp;Export report</button>`)}
    <div class="report-kpis"><article class="panel report-kpi"><small>Total stock valuation</small><strong>${money(valuation)}</strong></article><article class="panel report-kpi"><small>Units in inventory</small><strong>${products.reduce((sum, product) => sum + product.quantity, 0).toLocaleString()}</strong></article><article class="panel report-kpi"><small>Units sold this month</small><strong>${totalSold.toLocaleString()}</strong></article></div>
    <div class="reports-grid"><section class="panel"><div class="panel-heading"><div><h2>Product movement overview</h2><p class="panel-subtitle">Sales units by category · this month</p></div></div><div class="bar-list">${movementTotals.map((item, index) => `<div><div class="bar-item-head"><span>${escapeHTML(item.name)}</span><strong>${item.count} units</strong></div><div class="bar-track"><div class="bar-fill" style="width:${Math.round(item.count / max * 100)}%;opacity:${1 - index * .09}"></div></div></div>`).join("")}</div></section>
    <section class="table-card"><div class="toolbar"><div><h2 class="panel-title">Low-stock report</h2><p class="panel-subtitle">Products at or below ${settings.lowStockThreshold} units</p></div></div><div class="table-wrap"><table class="data-table" style="min-width:380px"><thead><tr><th>Product</th><th>Stock</th><th>Status</th></tr></thead><tbody>${low.length ? low.map(product => `<tr><td><div class="product-name">${escapeHTML(product.name)}</div><div class="product-sku">${escapeHTML(product.sku)}</div></td><td>${product.quantity}</td><td>${statusBadge(product.quantity)}</td></tr>`).join("") : `<tr><td colspan="3"><div class="empty-state"><strong>All stocked up</strong><p>No low-stock products to report.</p></div></td></tr>`}</tbody></table></div></section></div>`;
}
function renderSettings() {
  return `${pageHeader("Settings", "Manage your business preferences and workspace experience.", `<button class="button button-primary" data-action="save-settings">Save changes</button>`)}
    <div class="settings-layout"><section><div class="panel settings-panel"><h2>Business information</h2><p>Update the details associated with your workspace.</p><div class="field"><label for="business-name">Business name</label><input id="business-name" value="${escapeHTML(settings.businessName)}"></div><div class="field"><label for="business-email">Business email</label><input id="business-email" type="email" value="${escapeHTML(settings.email)}"></div></div><div class="panel settings-panel"><h2>Inventory preferences</h2><p>Set the defaults used in your inventory views and alerts.</p><div class="field"><label for="currency">Display currency</label><select id="currency">${Object.entries(currencySymbols).map(([code, symbol]) => `<option value="${code}" ${settings.currency === code ? "selected" : ""}>${code} (${symbol})</option>`).join("")}</select></div><div class="field"><label for="low-stock-threshold">Low-stock threshold</label><input id="low-stock-threshold" type="number" min="1" value="${Number(settings.lowStockThreshold)}"><span class="field-help">Products at or below this quantity are marked low stock.</span></div></div></section>
    <aside class="settings-aside"><div class="panel settings-panel"><h2>Interface</h2><p>Make StockFlow work the way you do.</p><div class="setting-row"><div><strong>Compact table rows</strong><small>Fit more products on screen</small></div><input class="toggle" type="checkbox" id="compact-rows" ${settings.compactRows ? "checked" : ""} aria-label="Compact table rows"></div><div class="setting-row"><div><strong>Low-stock reminders</strong><small>Highlight items to reorder</small></div><input class="toggle" type="checkbox" id="email-alerts" ${settings.emailAlerts ? "checked" : ""} aria-label="Low-stock reminders"></div></div><div class="panel settings-panel"><h2>About StockFlow</h2><p>Your inventory, in good hands.</p><div class="setting-row"><div><strong>Plan</strong><small>StockFlow for small business</small></div></div><div class="setting-row"><div><strong>Version</strong><small>1.0.0 · Frontend demo</small></div></div></div></aside></div>`;
}

function showModal(title, subtitle, body) {
  $("#modal-root").innerHTML = `<div class="modal-backdrop" data-action="backdrop-close"><section class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><header class="modal-header"><div><h2 id="modal-title">${title}</h2><p>${subtitle}</p></div><button class="modal-close" data-action="close-modal" aria-label="Close dialog">×</button></header><div class="modal-body">${body}</div></section></div>`;
  const firstInput = $("input, select, textarea, button", $("#modal-root"));
  if (firstInput) firstInput.focus();
}
function closeModal() { $("#modal-root").innerHTML = ""; }
function productModal(product = null) {
  const editing = Boolean(product);
  const emojiChoices = ["📦", "🎧", "💡", "🎒", "☕", "🖱️", "🧶", "🥤", "📒", "🪴", "⌚", "🧴"];
  const body = `<form id="product-form" data-id="${editing ? escapeHTML(product.id) : ""}"><div class="modal-grid">
    <div class="field field-full"><label for="product-name">Product name</label><input id="product-name" name="name" required value="${escapeHTML(product?.name || "")}" placeholder="e.g. Wireless Keyboard"></div>
    <div class="field"><label for="product-sku">SKU</label><input id="product-sku" name="sku" required value="${escapeHTML(product?.sku || "")}" placeholder="e.g. TEC-1020"></div>
    <div class="field"><label for="product-category">Category</label><select id="product-category" name="category" required><option value="">Choose category</option>${categories.map(category => `<option value="${escapeHTML(category.name)}" ${product?.category === category.name ? "selected" : ""}>${escapeHTML(category.name)}</option>`).join("")}<option value="__new">＋ Add new category...</option></select></div>
    <div class="field"><label for="product-quantity">Quantity in stock</label><input id="product-quantity" name="quantity" type="number" min="0" step="1" required value="${product ? Number(product.quantity) : 0}"></div>
    <div class="field"><label for="product-price">Unit price (${currencySymbols[settings.currency] || "$"})</label><input id="product-price" name="price" type="number" min="0" step="0.01" required value="${product ? Number(product.price) : ""}" placeholder="0.00"></div>
    <div class="field"><label for="product-emoji">Product image</label><select id="product-emoji" name="emoji">${emojiChoices.map(emoji => `<option value="${emoji}" ${(product?.emoji || "📦") === emoji ? "selected" : ""}>${emoji} &nbsp; Product thumbnail</option>`).join("")}</select></div>
    <div class="field"><label for="product-supplier">Supplier</label><select id="product-supplier" name="supplier"><option value="">No supplier</option>${suppliers.map(supplier => `<option value="${escapeHTML(supplier.name)}" ${product?.supplier === supplier.name ? "selected" : ""}>${escapeHTML(supplier.name)}</option>`).join("")}</select></div>
    </div><div class="modal-footer"><button type="button" class="button button-secondary" data-action="close-modal">Cancel</button><button class="button button-primary" type="submit">${editing ? "Save changes" : "Add product"}</button></div></form>`;
  showModal(editing ? "Edit product" : "Add a product", editing ? "Update product details and inventory." : "Add a new item to your inventory.", body);
}
function categoryModal(category = null) {
  const editing = Boolean(category);
  showModal(editing ? "Edit category" : "Add a category", "Keep your products organized and easy to find.", `<form id="category-form" data-original="${editing ? escapeHTML(category.name) : ""}"><div class="field"><label for="category-name">Category name</label><input id="category-name" name="name" required value="${escapeHTML(category?.name || "")}" placeholder="e.g. Outdoor"></div><div class="field"><label for="category-description">Description</label><input id="category-description" name="description" value="${escapeHTML(category?.description || "")}" placeholder="A short description"></div><div class="field"><label for="category-emoji">Category icon</label><select id="category-emoji" name="emoji">${["◫", "⌘", "⌂", "✧", "♨", "▤", "♧", "◈"].map(emoji => `<option ${category?.emoji === emoji ? "selected" : ""}>${emoji}</option>`).join("")}</select></div><div class="modal-footer"><button type="button" class="button button-secondary" data-action="close-modal">Cancel</button><button class="button button-primary" type="submit">${editing ? "Save changes" : "Add category"}</button></div></form>`);
}
function confirmDelete(product) {
  showModal("Delete product?", "This action cannot be undone.", `<p class="confirm-copy">Are you sure you want to delete <strong>${escapeHTML(product.name)}</strong>? This product will be removed from your inventory.</p><div class="modal-footer"><button class="button button-secondary" data-action="close-modal">Cancel</button><button class="button button-danger" data-action="confirm-delete" data-id="${escapeHTML(product.id)}">Delete product</button></div>`);
}
function showToast(message, error = false) {
  const toast = document.createElement("div");
  toast.className = `toast${error ? " error" : ""}`;
  toast.textContent = message;
  $("#toast-region").append(toast);
  window.setTimeout(() => toast.remove(), 3200);
}
function exportProducts() {
  const headers = ["Name", "SKU", "Category", "Quantity", "Unit price", "Status", "Supplier"];
  const rows = products.map(product => [product.name, product.sku, product.category, product.quantity, product.price, stockStatus(product.quantity), product.supplier || ""]);
  const csv = [headers, ...rows].map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\n");
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  link.download = "stockflow-inventory.csv";
  link.click();
  URL.revokeObjectURL(link.href);
  showToast("Inventory export downloaded.");
}
function saveSettings() {
  const threshold = Number($("#low-stock-threshold").value);
  if (!Number.isInteger(threshold) || threshold < 1) { showToast("Low-stock threshold must be a whole number above zero.", true); return; }
  settings = { ...settings, businessName: $("#business-name").value.trim() || "My Business", email: $("#business-email").value.trim(), currency: $("#currency").value, lowStockThreshold: threshold, compactRows: $("#compact-rows").checked, emailAlerts: $("#email-alerts").checked };
  save(STORAGE_KEYS.settings, settings);
  renderPage();
  showToast("Your settings have been saved.");
}

document.addEventListener("click", event => {
  const pageButton = event.target.closest("[data-page]");
  if (pageButton) { event.preventDefault(); setPage(pageButton.dataset.page); return; }
  const movementButton = event.target.closest("[data-movement-type]");
  if (movementButton) { movementType = movementButton.dataset.movementType; renderPage(); return; }
  const actionButton = event.target.closest("[data-action]");
  if (!actionButton) return;
  const { action, id, name } = actionButton.dataset;
  if (action === "open-product") productModal();
  else if (action === "edit-product") { const product = productById(id); if (product) productModal(product); }
  else if (action === "delete-product") { const product = productById(id); if (product) confirmDelete(product); }
  else if (action === "confirm-delete") { products = products.filter(product => product.id !== id); save(STORAGE_KEYS.products, products); closeModal(); renderPage(); showToast("Product deleted."); }
  else if (action === "open-category") categoryModal();
  else if (action === "edit-category") { const category = categories.find(item => item.name === name); if (category) categoryModal(category); }
  else if (action === "close-modal") closeModal();
  else if (action === "backdrop-close" && event.target === actionButton) closeModal();
  else if (action === "export") exportProducts();
  else if (action === "save-settings") saveSettings();
  else if (action === "supplier-info") showModal("Supplier directory", "Supplier management is ready for your supplier details.", `<p class="confirm-copy">Your sample supplier directory is available below. Add supplier records here as you customize your workspace.</p><div class="modal-footer"><button class="button button-primary" data-action="close-modal">Got it</button></div>`);
  else if (actionButton.dataset.movementType) { movementType = actionButton.dataset.movementType; renderPage(); }
});
document.addEventListener("submit", event => {
  if (event.target.id === "product-form") {
    event.preventDefault();
    const form = event.target;
    const data = new FormData(form);
    let category = data.get("category");
    if (category === "__new") {
      const name = window.prompt("Enter a name for the new category:");
      if (!name?.trim()) return;
      category = name.trim();
      if (!categories.some(item => item.name.toLowerCase() === category.toLowerCase())) {
        categories.push({ name: category, description: "Product collection", emoji: "◫", color: "#eef0ff" });
        save(STORAGE_KEYS.categories, categories);
      }
    }
    const id = form.dataset.id;
    const existing = id ? productById(id) : null;
    const product = { id: id || `p-${Date.now()}`, name: String(data.get("name")).trim(), sku: String(data.get("sku")).trim(), category, quantity: Number(data.get("quantity")), price: Number(data.get("price")), emoji: data.get("emoji"), color: existing?.color || "#eef0ff", sold: existing?.sold || 0, supplier: data.get("supplier") };
    if (existing) products = products.map(item => item.id === id ? product : item);
    else products.unshift(product);
    save(STORAGE_KEYS.products, products);
    closeModal(); renderPage(); showToast(existing ? "Product updated." : "Product added to your inventory.");
  }
  if (event.target.id === "category-form") {
    event.preventDefault();
    const data = new FormData(event.target);
    const name = String(data.get("name")).trim();
    const original = event.target.dataset.original;
    if (categories.some(category => category.name.toLowerCase() === name.toLowerCase() && category.name !== original)) { showToast("A category with this name already exists.", true); return; }
    const category = { name, description: String(data.get("description")).trim(), emoji: data.get("emoji"), color: categories.find(item => item.name === original)?.color || "#eef0ff" };
    if (original) {
      categories = categories.map(item => item.name === original ? category : item);
      products = products.map(product => product.category === original ? { ...product, category: name } : product);
      save(STORAGE_KEYS.products, products);
    } else categories.push(category);
    save(STORAGE_KEYS.categories, categories);
    closeModal(); renderPage(); showToast(original ? "Category updated." : "Category added.");
  }
  if (event.target.id === "movement-form") {
    event.preventDefault();
    const data = new FormData(event.target);
    const product = productById(data.get("productId"));
    if (!product) { showToast("Select a product to update.", true); return; }
    const entered = Number(data.get("quantity"));
    const change = movementType === "adjustment" ? entered - Number(product.quantity) : movementType === "out" ? -entered : entered;
    if (!Number.isInteger(entered) || entered < (movementType === "adjustment" ? 0 : 1)) { showToast("Enter a valid whole-number quantity.", true); return; }
    if (Number(product.quantity) + change < 0) { showToast("Stock out quantity cannot exceed the available stock.", true); return; }
    products = products.map(item => item.id === product.id ? { ...item, quantity: Number(item.quantity) + change } : item);
    movements.unshift({ id: `m-${Date.now()}`, type: movementType, productId: product.id, productName: product.name, quantity: change, date: new Date().toISOString(), note: [data.get("reference"), data.get("note")].filter(Boolean).join(" · ") || (movementType === "in" ? "Stock received" : movementType === "out" ? "Stock removed" : "Manual adjustment") });
    save(STORAGE_KEYS.products, products); save(STORAGE_KEYS.movements, movements);
    renderPage(); showToast("Stock movement recorded.");
  }
});
document.addEventListener("input", event => {
  if (event.target.id === "product-search") { productQuery = event.target.value; const cursor = event.target.selectionStart; renderPage(); const input = $("#product-search"); input.focus(); input.setSelectionRange(cursor, cursor); }
});
document.addEventListener("change", event => {
  if (event.target.id === "category-filter") { categoryFilter = event.target.value; renderPage(); }
  if (event.target.id === "status-filter") { statusFilter = event.target.value; renderPage(); }
  if (event.target.id === "movement-filter") { movementFilter = event.target.value; renderPage(); }
  if (event.target.id === "chart-period") { chartPeriod = event.target.value; renderPage(); }
});
$("#mobile-menu").addEventListener("click", () => $("#sidebar").classList.toggle("open"));
document.addEventListener("keydown", event => { if (event.key === "Escape") closeModal(); });
$("#today-label").textContent = new Intl.DateTimeFormat(undefined, { weekday: "short", month: "short", day: "numeric" }).format(new Date());
renderPage();
