import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Package,
  ShoppingCart,
  ClipboardList,
  Users,
  TrendingUp,
  TrendingDown,
  Wallet,
  BookOpen,
} from "lucide-react";
import {
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import { getDashboardData } from "../store/thunks/dashboardThunk";
import { fetchAllLedgers } from "../store/thunks/ledgerThunk";
import { useNavigate } from "react-router-dom";
import {
  SkeletonHeader,
  SkeletonStatCards,
  SkeletonTable,
} from "../components/Skeleton";
import theme from "../config/theme";

const PAGE_SIZE = 4;

const getActionText = (status) => {
  switch (status?.toLowerCase()) {
    case "approved": return "Listing approved";
    case "pending":  return "New listing submitted";
    case "rejected": return "Listing rejected";
    default:         return "Activity updated";
  }
};

const timeAgo = (date) => {
  if (!date) return "";
  const mins = Math.floor((Date.now() - new Date(date)) / 60000);
  if (mins < 60) return `${mins} min${mins !== 1 ? "s" : ""} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
  const days = Math.floor(mins / 1440);
  return `${days} day${days !== 1 ? "s" : ""} ago`;
};

const CARD_BG   = "#ffffff";
const HEADING   = "#1a2e22";
const BODY      = "#2d5040";
const MUTED     = "#4a7a62";
const BRAND     = "#3ECF8E";
const BRAND_DK  = "#2BB57A";
const SAGE      = "#2BB57A";
const BRAND_100 = "#C6EFD9";
const SAGE_100  = "#E8F8F1";

function StatCard({ title, value, icon: Icon, path, iconBg, iconColor, navigate }) {
  return (
    <div
      onClick={() => navigate(path)}
      className="p-6 cursor-pointer transition-all duration-150 hover:-translate-y-0.5"
      style={{ backgroundColor: CARD_BG, borderRadius: "20px", border: "1px solid rgba(0,0,0,0.06)" }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold" style={{ color: MUTED }}>{title}</p>
          <p className="mt-1 text-3xl" style={{ fontWeight: 800, color: HEADING }}>{value}</p>
        </div>
        <div className="p-3 rounded-2xl" style={{ backgroundColor: iconBg }}>
          <Icon className="w-6 h-6" style={{ color: iconColor }} />
        </div>
      </div>
    </div>
  );
}

function Dashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { stats, topCropsChart, recentActivity, allListings, loading,
    revenueOrdersChart, procVsSalesChart, memberGrowthChart, topProductsChart, inventoryStockChart } =
    useSelector((state) => state.dashboard);

  const { allEntries = [] } = useSelector((s) => s.ledger);
  const ledgerEntries = Array.isArray(allEntries) ? allEntries : [];

  const totalToPayCustomers = ledgerEntries.reduce((s, e) => {
    if (e.type === "CREDIT" && e.referenceType === "PROCUREMENT") return s + Number(e.amount || 0);
    if (e.type === "DEBIT" && (e.referenceType === "PROCUREMENT_PAYMENT" || e.referenceType === "PAYMENT")) return s - Number(e.amount || 0);
    return s;
  }, 0);

  const totalToCollect = ledgerEntries.reduce((s, e) => {
    if (e.type === "DEBIT" && e.referenceType === "SALE") return s + Number(e.amount || 0);
    if (e.type === "CREDIT" && e.referenceType === "PAYMENT") return s - Number(e.amount || 0);
    return s;
  }, 0);

  const customerBalanceMap = {};
  ledgerEntries.forEach((e) => {
    const id = e.user?._id;
    if (!id) return;
    if (!customerBalanceMap[id]) customerBalanceMap[id] = { user: e.user, net: 0 };
    customerBalanceMap[id].net += e.type === "CREDIT" ? Number(e.amount || 0) : -Number(e.amount || 0);
  });
  const topPendingCustomers = Object.values(customerBalanceMap)
    .filter((r) => r.net !== 0)
    .sort((a, b) => Math.abs(b.net) - Math.abs(a.net))
    .slice(0, 4);

  const recentTxns = [...ledgerEntries]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 4);

  const fmtClean = (v) => `₹${Number(v || 0).toLocaleString("en-IN")}`;

  const [view, setView] = useState("activity");
  const [page, setPage] = useState(1);

  useEffect(() => {
    dispatch(getDashboardData());
    dispatch(fetchAllLedgers());
  }, [dispatch]);

  const pendingListings = allListings?.filter((l) => l.status?.toLowerCase() === "pending") || [];
  const totalPages = Math.ceil((recentActivity?.length || 0) / PAGE_SIZE);
  const paginatedActivity = recentActivity?.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (loading) {
    return (
      <div className="space-y-6">
        <SkeletonHeader />
        <SkeletonStatCards count={4} />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <SkeletonTable rows={4} cols={2} />
          <SkeletonTable rows={4} cols={2} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl" style={{ fontWeight: 800, color: HEADING }}>Dashboard Overview</h1>
        <p className="text-sm" style={{ color: MUTED }}>Welcome back! Here's what's happening with your {theme.orgName} today.</p>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Revenue This Month" value={`₹${Number(revenueOrdersChart.at(-1)?.revenue ?? 0).toLocaleString("en-IN")}`} icon={TrendingUp}   path="/ledger"     iconBg="#C6EFD9"  iconColor="#2BB57A"  navigate={navigate} />
        <StatCard title="Pending Deliveries" value={stats.pendingDeliveries} icon={Package}      path="/procurement" iconBg="#E8F8F1"  iconColor="#3ECF8E"  navigate={navigate} />
        <StatCard title="Total Orders"       value={stats.totalOrders}       icon={ShoppingCart} path="/procurement" iconBg="#dbeafe"  iconColor="#3b82f6"  navigate={navigate} />
        <StatCard title="Total Members"      value={stats.totalMembers}      icon={Users}        path="/members"     iconBg="#fef3c7"  iconColor="#f59e0b"  navigate={navigate} />
      </div>

      {/* CHARTS ROW 1 — Revenue & Orders + Procurement vs Sales */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Monthly Revenue & Orders */}
        {(() => {
          const totalRev = revenueOrdersChart.reduce((s, d) => s + d.revenue, 0);
          const totalOrd = revenueOrdersChart.reduce((s, d) => s + d.orders, 0);
          const bestMonth = revenueOrdersChart.reduce((a, b) => b.revenue > a.revenue ? b : a, revenueOrdersChart[0] ?? {});
          const currentMonthData = revenueOrdersChart.at(-1);
          const lastActiveMonth = [...revenueOrdersChart].reverse().find(d => d.revenue > 0 || d.orders > 0) ?? currentMonthData;
          return (
            <div className="p-6 rounded-2xl" style={{ backgroundColor: CARD_BG, border: "1px solid rgba(0,0,0,0.06)" }}>
              <div className="mb-4">
                <h3 className="font-bold" style={{ color: HEADING }}>📈 Monthly Revenue Trend</h3>
                <p className="text-xs mt-0.5" style={{ color: MUTED }}>Revenue earned from orders over the last 6 months</p>
              </div>
              {/* Line Chart */}
              <ResponsiveContainer width="100%" height={144}>
                <AreaChart data={revenueOrdersChart} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={BRAND} stopOpacity={0.2} />
                      <stop offset="95%" stopColor={BRAND} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: MUTED, fontWeight: 600 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    cursor={{ stroke: BRAND, strokeWidth: 1, strokeDasharray: "4 4" }}
                    contentStyle={{ borderRadius: "12px", border: "1px solid rgba(0,0,0,0.06)", fontSize: 12, fontWeight: 600 }}
                    formatter={(val) => [`₹${Number(val).toLocaleString("en-IN")}`, "Revenue"]}
                    labelFormatter={label => {
                      const d = revenueOrdersChart.find(r => r.month === label);
                      return `${label} · ${d?.orders ?? 0} order${d?.orders !== 1 ? "s" : ""}`;
                    }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke={BRAND} strokeWidth={2.5} fill="url(#revGrad)" dot={{ r: 4, fill: BRAND, strokeWidth: 0 }} activeDot={{ r: 6, fill: BRAND_DK }} />
                </AreaChart>
              </ResponsiveContainer>

              {/* Bottom summary row */}
              <div className="flex gap-3 mt-4 pt-4" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
                <div className="flex-1 text-center">
                  <p className="text-[10px] font-semibold" style={{ color: MUTED }}>This Month</p>
                  <p className="text-sm font-bold" style={{ color: HEADING }}>₹{Number(lastActiveMonth?.revenue ?? 0).toLocaleString("en-IN")}</p>
                </div>
                <div style={{ width: 1, backgroundColor: "rgba(0,0,0,0.06)" }} />
                <div className="flex-1 text-center">
                  <p className="text-[10px] font-semibold" style={{ color: MUTED }}>Prev Month</p>
                  <p className="text-sm font-bold" style={{ color: HEADING }}>₹{Number(revenueOrdersChart[revenueOrdersChart.indexOf(lastActiveMonth) - 1]?.revenue ?? 0).toLocaleString("en-IN")}</p>
                </div>
                <div style={{ width: 1, backgroundColor: "rgba(0,0,0,0.06)" }} />
                <div className="flex-1 text-center">
                  <p className="text-[10px] font-semibold" style={{ color: MUTED }}>Total Orders</p>
                  <p className="text-sm font-bold" style={{ color: HEADING }}>{totalOrd}</p>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Procurement vs Sales */}
        {(() => {
          const totalProcurement = procVsSalesChart.reduce((s, d) => s + d.procurement, 0);
          const totalSales = procVsSalesChart.reduce((s, d) => s + d.sales, 0);
          const bestProcMonth = procVsSalesChart.reduce((a, b) => (b.sales - b.procurement) > (a.sales - a.procurement) ? b : a, procVsSalesChart[0] ?? {});
          const lastActiveProcMonth = [...procVsSalesChart].reverse().find(d => d.procurement > 0 || d.sales > 0) ?? procVsSalesChart.at(-1);
          return (
            <div className="p-6 rounded-2xl" style={{ backgroundColor: CARD_BG, border: "1px solid rgba(0,0,0,0.06)" }}>
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-xs font-semibold mb-0.5" style={{ color: MUTED }}>💸 Procurement vs Sales Value</p>
                  <div className="flex items-end gap-3">
                    <div>
                      <p className="text-[10px] font-semibold" style={{ color: MUTED }}>Spent (6 months)</p>
                      <p className="text-xl font-extrabold" style={{ color: HEADING }}>₹{Number(totalProcurement).toLocaleString("en-IN")}</p>
                    </div>
                    <div className="pb-0.5" style={{ color: MUTED }}>vs</div>
                    <div>
                      <p className="text-[10px] font-semibold" style={{ color: MUTED }}>Earned (6 months)</p>
                      <p className="text-xl font-extrabold" style={{ color: SAGE }}>₹{Number(totalSales).toLocaleString("en-IN")}</p>
                    </div>
                  </div>
                </div>

              </div>

              {/* Chart */}
              <ResponsiveContainer width="100%" height={144}>
                <BarChart data={procVsSalesChart} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barGap={4}>
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: MUTED, fontWeight: 600 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    cursor={{ fill: "rgba(0,0,0,0.03)" }}
                    contentStyle={{ borderRadius: "12px", border: "1px solid rgba(0,0,0,0.06)", fontSize: 12, fontWeight: 600 }}
                    formatter={(val, name) => [`₹${Number(val).toLocaleString("en-IN")}`, name === "procurement" ? "Procurement Cost" : "Sales Revenue"]}
                    labelStyle={{ color: HEADING, fontWeight: 700, marginBottom: 4 }}
                  />
                  <Bar dataKey="procurement" fill={BRAND} radius={[6, 6, 0, 0]} maxBarSize={28} name="procurement" />
                  <Bar dataKey="sales" fill="#60A5FA" radius={[6, 6, 0, 0]} maxBarSize={28} name="sales" />
                </BarChart>
              </ResponsiveContainer>

              {/* Legend + Summary */}
              <div className="flex gap-3 mt-4 pt-4" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
                <div className="flex-1 text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: BRAND }} />
                    <p className="text-[10px] font-semibold" style={{ color: MUTED }}>Total Spent</p>
                  </div>
                  <p className="text-sm font-bold" style={{ color: HEADING }}>₹{Number(totalProcurement).toLocaleString("en-IN")}</p>
                </div>
                <div style={{ width: 1, backgroundColor: "rgba(0,0,0,0.06)" }} />
                <div className="flex-1 text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: "#60A5FA" }} />
                    <p className="text-[10px] font-semibold" style={{ color: MUTED }}>Total Earned</p>
                  </div>
                  <p className="text-sm font-bold" style={{ color: HEADING }}>₹{Number(totalSales).toLocaleString("en-IN")}</p>
                </div>
                <div style={{ width: 1, backgroundColor: "rgba(0,0,0,0.06)" }} />
                <div className="flex-1 text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <p className="text-[10px] font-semibold" style={{ color: MUTED }}>Net Profit</p>
                  </div>
                  <p className="text-sm font-bold" style={{ color: totalSales - totalProcurement >= 0 ? SAGE : "#ef4444" }}>
                    {totalSales - totalProcurement >= 0 ? "+" : ""}₹{Number(Math.abs(totalSales - totalProcurement)).toLocaleString("en-IN")}
                  </p>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* CHARTS ROW 2 — Member Growth + Top Products */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Member Growth */}
        {(() => {
          const latest = memberGrowthChart.at(-1)?.total ?? 0;
          const prev = memberGrowthChart.at(-2)?.total ?? 0;
          const first = memberGrowthChart[0]?.total ?? 0;
          const added = latest - prev;
          const totalAdded = latest - first;
          const growthPct = prev > 0 ? (((latest - prev) / prev) * 100).toFixed(1) : null;
          const isGrowing = added >= 0;
          return (
            <div className="p-6 rounded-2xl" style={{ backgroundColor: CARD_BG, border: "1px solid rgba(0,0,0,0.06)" }}>
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-xs font-semibold mb-0.5" style={{ color: MUTED }}>👥 Customer Growth</p>
                  <p className="text-2xl font-extrabold" style={{ color: HEADING }}>{latest.toLocaleString("en-IN")}</p>
                  <p className="text-xs mt-0.5" style={{ color: MUTED }}>Total customers · {memberGrowthChart.at(-1)?.month}</p>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  {growthPct !== null && (
                    <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold"
                      style={{ backgroundColor: isGrowing ? SAGE_100 : "#FEE2E2", color: isGrowing ? SAGE : "#EF4444" }}>
                      {isGrowing ? "▲" : "▼"} {Math.abs(growthPct)}% vs last month
                    </div>
                  )}
                  <div className="px-2.5 py-1 rounded-xl text-xs font-semibold"
                    style={{ backgroundColor: "#F1F5F9", color: MUTED }}>
                    +{totalAdded} over 6 months
                  </div>
                </div>
              </div>

              {/* Chart */}
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={memberGrowthChart} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="memberGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={BRAND} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={BRAND} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: MUTED, fontWeight: 600 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: MUTED }} axisLine={false} tickLine={false} width={32} />
                  <Tooltip
                    cursor={{ stroke: BRAND, strokeWidth: 1, strokeDasharray: "4 4" }}
                    contentStyle={{ borderRadius: "12px", border: "1px solid rgba(0,0,0,0.06)", fontSize: 12, fontWeight: 600 }}
                    formatter={(val, name, props) => {
                      const idx = memberGrowthChart.findIndex(d => d.total === val && d.month === props.payload.month);
                      const diff = idx > 0 ? val - memberGrowthChart[idx - 1].total : 0;
                      return [`${val} members${diff > 0 ? ` (+${diff} new)` : ""}`, "Total"];
                    }}
                  />
                  <Area type="monotone" dataKey="total" stroke={BRAND} strokeWidth={2.5} fill="url(#memberGrad)"
                    dot={{ r: 4, fill: BRAND, strokeWidth: 2, stroke: "#fff" }}
                    activeDot={{ r: 6, fill: BRAND_DK, stroke: "#fff", strokeWidth: 2 }}
                    name="Total Members" />
                </AreaChart>
              </ResponsiveContainer>

              {/* Footer summary */}
              <div className="flex gap-3 mt-4 pt-4" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
                <div className="flex-1 text-center">
                  <p className="text-[10px] font-semibold" style={{ color: MUTED }}>This Month</p>
                  <p className="text-sm font-bold" style={{ color: HEADING }}>{latest}</p>
                </div>
                <div style={{ width: 1, backgroundColor: "rgba(0,0,0,0.06)" }} />
                <div className="flex-1 text-center">
                  <p className="text-[10px] font-semibold" style={{ color: MUTED }}>New This Month</p>
                  <p className="text-sm font-bold" style={{ color: isGrowing ? SAGE : "#EF4444" }}>{isGrowing ? "+" : ""}{added}</p>
                </div>
                <div style={{ width: 1, backgroundColor: "rgba(0,0,0,0.06)" }} />
                <div className="flex-1 text-center">
                  <p className="text-[10px] font-semibold" style={{ color: MUTED }}>6-Month Growth</p>
                  <p className="text-sm font-bold" style={{ color: SAGE }}>+{totalAdded}</p>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Inventory Stock Levels */}
        {(() => {
          const maxStock = inventoryStockChart.length ? Math.max(...inventoryStockChart.map(p => p.stock || 0)) : 1;
          const lowStockProducts = inventoryStockChart.filter(p => p.stock <= p.minStock);
          const adequateStock = inventoryStockChart.filter(p => p.stock > p.minStock);
          
          return (
            <div className="p-6 rounded-2xl" style={{ backgroundColor: CARD_BG, border: "1px solid rgba(0,0,0,0.06)" }}>
              <div className="mb-6">
                <h3 className="font-bold text-lg mb-1" style={{ color: HEADING }}>📦 Inventory Stock Levels</h3>
                <p className="text-xs" style={{ color: MUTED }}>Current stock status across products</p>
              </div>
              
              {inventoryStockChart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[220px]" style={{ color: MUTED }}>
                  <Package className="w-10 h-10 mb-2 opacity-30" />
                  <p className="text-sm">No inventory data</p>
                </div>
              ) : (
                <>
                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-3 mb-6">
                    <div className="p-3 rounded-lg" style={{ backgroundColor: "#F0FFF4" }}>
                      <p className="text-xs font-semibold" style={{ color: MUTED }}>Total Products</p>
                      <p className="text-xl font-bold mt-1" style={{ color: "#2BB57A" }}>{inventoryStockChart.length}</p>
                    </div>
                    <div className="p-3 rounded-lg" style={{ backgroundColor: "#FEF3C7" }}>
                      <p className="text-xs font-semibold" style={{ color: MUTED }}>Adequate Stock</p>
                      <p className="text-xl font-bold mt-1" style={{ color: "#D97706" }}>{adequateStock.length}</p>
                    </div>
                    <div className="p-3 rounded-lg" style={{ backgroundColor: "#FEE2E2" }}>
                      <p className="text-xs font-semibold" style={{ color: MUTED }}>Low Stock Alert</p>
                      <p className="text-xl font-bold mt-1" style={{ color: "#EF4444" }}>{lowStockProducts.length}</p>
                    </div>
                  </div>
                  
                  {/* Chart */}
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={inventoryStockChart} margin={{ top: 8, right: 8, left: 0, bottom: 40 }} barGap={8}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fontSize: 12, fill: MUTED, fontWeight: 600 }} 
                        axisLine={false} 
                        tickLine={false}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis tick={{ fontSize: 11, fill: MUTED }} axisLine={false} tickLine={false} width={40} />
                      <Tooltip
                        cursor={{ fill: "rgba(0,0,0,0.03)" }}
                        contentStyle={{ borderRadius: "12px", border: "1px solid rgba(0,0,0,0.06)", fontSize: 12, fontWeight: 600 }}
                        formatter={(val, name) => {
                          if (name === "stock") return [val, "Current Stock"];
                          if (name === "minStock") return [val, "Min Stock Level"];
                          return [val, name];
                        }}
                      />
                      <Bar dataKey="stock" fill={BRAND} radius={[6, 6, 0, 0]} maxBarSize={32} name="stock" />
                      <Bar dataKey="minStock" fill="#F87171" radius={[6, 6, 0, 0]} maxBarSize={32} name="minStock" />
                    </BarChart>
                  </ResponsiveContainer>
                  
                  {/* Low Stock Items */}
                  
                   
                  
                </>
              )}
            </div>
          );
        })()}
      </div>

      {/* CHARTS ROW 3 — Top Active Products Table */}
      {(() => {
        const activeProducts = inventoryStockChart.length > 0
          ? inventoryStockChart
          : [];
        const topActive = allListings
          ?.filter(p => String(p.status || '').toLowerCase() === 'active')
          .slice(0, 6) || [];
        return topActive.length === 0 ? null : (
          <div className="p-6 rounded-2xl" style={{ backgroundColor: CARD_BG, border: "1px solid rgba(0,0,0,0.06)" }}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-bold mb-0.5" style={{ color: HEADING }}>🛍️ Active Product Listings</h3>
                <p className="text-xs" style={{ color: MUTED }}>Recently active products in your catalog</p>
              </div>
              <button onClick={() => navigate("/listing")} className="text-xs font-semibold px-3 py-1.5 rounded-xl"
                style={{ backgroundColor: SAGE_100, color: SAGE }}>View All →</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: "2px solid #f0f4f8" }}>
                    {["Product", "Category", "Price", "Qty", "Total Value", "Status"].map(h => (
                      <th key={h} className="pb-3 text-left text-[11px] font-bold uppercase tracking-wide" style={{ color: MUTED }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {topActive.map((p, i) => {
                    const qty = Number(p.quantity || 0);
                    const price = Number(p.price || p.sellingPrice || 0);
                    const total = qty * price;
                    const cat = p.category || p.productCategory || "—";
                    return (
                      <tr key={p._id || i} className="transition-colors duration-150 hover:bg-gray-50"
                        style={{ borderBottom: "1px solid #f0f4f8" }}>
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
                              style={{ backgroundColor: SAGE_100, color: SAGE }}>
                              {p.productName?.charAt(0)?.toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-semibold" style={{ color: HEADING }}>{p.productName}</p>
                              <p className="text-[10px]" style={{ color: MUTED }}>{p.addedBy?.firstName} {p.addedBy?.lastName}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 pr-4">
                          <span className="text-xs px-2 py-0.5 rounded-lg font-semibold" style={{ backgroundColor: "#F1F5F9", color: MUTED }}>{cat}</span>
                        </td>
                        <td className="py-3 pr-4">
                          <p className="text-sm font-bold" style={{ color: HEADING }}>₹{price.toLocaleString("en-IN")}</p>
                        </td>
                        <td className="py-3 pr-4">
                          <p className="text-sm font-semibold" style={{ color: BODY }}>{qty} <span className="text-xs" style={{ color: MUTED }}>{p.unit || "units"}</span></p>
                        </td>
                        <td className="py-3 pr-4">
                          <p className="text-sm font-bold" style={{ color: SAGE }}>₹{total.toLocaleString("en-IN")}</p>
                        </td>
                        <td className="py-3">
                          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ backgroundColor: "#ECFDF5", color: "#059669" }}>Active</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}

      {/* ORDER STATUS + RECENT TRANSACTIONS */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top Crops Chart */}
        <div className="p-6 rounded-2xl" style={{ backgroundColor: CARD_BG, border: "1px solid rgba(0,0,0,0.06)" }}>
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-bold" style={{ color: HEADING }}>Order Book Status</h3>
            <span className="text-xs px-2.5 py-1 rounded-full font-semibold" style={{ backgroundColor: "#ECFDF5", color: "#34D399" }}>
              {topCropsChart.reduce((s, d) => s + d.value, 0)} Orders
            </span>
          </div>
          <p className="text-xs mb-4" style={{ color: MUTED }}>Breakdown of marketplace orders by status</p>
          {topCropsChart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[220px]" style={{ color: MUTED }}>
              <ShoppingCart className="w-10 h-10 mb-2 opacity-30" />
              <p className="text-sm">No orders yet</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={topCropsChart}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  strokeWidth={0}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={{ stroke: "#cbd5e1", strokeWidth: 1 }}
                >
                  {topCropsChart.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: "12px", border: "1px solid rgba(0,0,0,0.06)", backgroundColor: "#ffffff", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}
                  itemStyle={{ color: "#374151", fontSize: 13, fontWeight: 600 }}
                  formatter={(value, name) => [value + " orders", name]}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Recent Transactions */}
        <div className="p-6 rounded-2xl" style={{ backgroundColor: CARD_BG, border: "1px solid rgba(0,0,0,0.06)" }}>
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-bold" style={{ color: HEADING }}>Recent Transactions</h3>
            <button onClick={() => navigate("/ledger")} className="text-xs font-semibold" style={{ color: BRAND }}>View All →</button>
          </div>
          <p className="text-xs mb-4" style={{ color: MUTED }}>Latest ledger activity</p>
          {recentTxns.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[220px]" style={{ color: MUTED }}>
              <BookOpen className="w-10 h-10 mb-2 opacity-30" />
              <p className="text-sm">No transactions yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentTxns.map((e, i) => {
                const isCredit = e.type === "CREDIT";
                return (
                  <div key={e._id || i} className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: "#f8fafc" }}>
                    <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: isCredit ? "#FEF2F2" : SAGE_100 }}>
                      {isCredit
                        ? <TrendingDown className="w-4 h-4" style={{ color: "#F87171" }} />
                        : <TrendingUp className="w-4 h-4" style={{ color: SAGE }} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: HEADING }}>{e.user?.firstName} {e.user?.lastName}</p>
                      <p className="text-xs" style={{ color: MUTED }}>{e.referenceType} · {new Date(e.createdAt).toLocaleDateString("en-IN")}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold" style={{ color: isCredit ? "#F87171" : SAGE }}>
                        {isCredit ? "-" : "+"}{fmtClean(e.amount)}
                      </p>
                      <p className="text-[10px] font-medium" style={{ color: MUTED }}>{isCredit ? "Credit" : "Debit"}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* PAYMENT SUMMARY */}
      {ledgerEntries.length > 0 && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Balance cards */}
          <div className="space-y-3">
            {[
              { label: "To Pay Customers", sub: "Pending payments", value: fmtClean(Math.max(0, totalToPayCustomers)), icon: TrendingDown, iconBg: "#fee2e2", iconColor: "#ef4444", valColor: "#ef4444" },
              { label: "To Collect from Customers", sub: "Pending collections", value: fmtClean(Math.max(0, totalToCollect)), icon: TrendingUp, iconBg: SAGE_100, iconColor: SAGE, valColor: SAGE },
              {
                label: "Net Balance",
                sub: Math.max(0, totalToPayCustomers) >= Math.max(0, totalToCollect) ? `${theme.orgName} owes customers` : `Customers owe ${theme.orgName}`,
                value: fmtClean(Math.abs(Math.max(0, totalToPayCustomers) - Math.max(0, totalToCollect))),
                icon: Wallet,
                iconBg: "#fef3c7",
                iconColor: "#f59e0b",
                valColor: Math.max(0, totalToPayCustomers) >= Math.max(0, totalToCollect) ? "#ef4444" : SAGE,
              },
            ].map((item) => (
              <div key={item.label} className="p-5 flex items-center gap-4 rounded-2xl" style={{ backgroundColor: CARD_BG, border: "1px solid rgba(0,0,0,0.06)" }}>
                <div className="p-3 rounded-2xl flex-shrink-0" style={{ backgroundColor: item.iconBg }}>
                  <item.icon className="w-5 h-5" style={{ color: item.iconColor }} />
                </div>
                <div>
                  <p className="text-xs font-semibold" style={{ color: MUTED }}>{item.label}</p>
                  <p className="text-xl font-bold" style={{ color: item.valColor }}>{item.value}</p>
                  <p className="text-xs mt-0.5" style={{ color: MUTED }}>{item.sub}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Top pending customers */}
          <div className="p-5 rounded-2xl" style={{ backgroundColor: CARD_BG, border: "1px solid rgba(0,0,0,0.06)" }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold" style={{ color: HEADING }}>Pending Balances</h3>
              <button onClick={() => navigate("/ledger")} className="text-xs font-semibold" style={{ color: BRAND }}>View Ledger →</button>
            </div>
            {topPendingCustomers.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32" style={{ color: MUTED }}>
                <Wallet className="w-8 h-8 mb-2 opacity-30" />
                <p className="text-sm">All balances cleared</p>
              </div>
            ) : (
              <div className="space-y-3">
                {topPendingCustomers.map((r) => (
                  <div key={r.user._id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: "#C6EFD9", color: HEADING }}>
                        {r.user.firstName?.charAt(0)?.toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold leading-tight" style={{ color: HEADING }}>{r.user.firstName} {r.user.lastName}</p>
                        <p className="text-xs" style={{ color: MUTED }}>{r.user.phone}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold" style={{ color: r.net > 0 ? "#ef4444" : SAGE }}>{fmtClean(Math.abs(r.net))}</p>
                      <p className="text-[10px] font-semibold" style={{ color: r.net > 0 ? "#ef4444" : "#2BB57A" }}>{r.net > 0 ? `${theme.orgName} owes` : "Customer owes"}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ACTIONS + RIGHT PANEL */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* QUICK ACTIONS */}
        <div className="p-6 space-y-3 rounded-2xl" style={{ backgroundColor: CARD_BG, border: "1px solid rgba(0,0,0,0.06)" }}>
          <h3 className="mb-2 font-bold" style={{ color: HEADING }}>Quick Actions</h3>
          <button
            onClick={() => setView("review")}
            className="flex items-center w-full gap-2 px-4 py-2.5 text-sm font-semibold transition-all duration-150"
            style={{ border: `1.5px solid ${BRAND}`, borderRadius: "12px", color: BRAND, backgroundColor: "transparent" }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = "#C6EFD9"}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
          >
            <ClipboardList size={18} />
            Review New Listings
          </button>
          <button
            onClick={() => navigate("/members")}
            className="flex items-center w-full gap-2 px-4 py-2.5 text-sm font-semibold transition-all duration-150"
            style={{ border: "1.5px solid rgba(0,0,0,0.1)", borderRadius: "12px", color: BODY, backgroundColor: "transparent" }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = "#E8F8F1"}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
          >
            <Users size={18} />
            Manage Members
          </button>
        </div>

        {/* RIGHT PANEL */}
        <div className="p-6 rounded-2xl lg:col-span-2" style={{ backgroundColor: CARD_BG, border: "1px solid rgba(0,0,0,0.06)" }}>
          {view === "activity" && (
            <>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold" style={{ color: HEADING }}>Recent Activity</h3>
                <button onClick={() => navigate("/listing")} className="text-sm font-semibold" style={{ color: BRAND }}>View All →</button>
              </div>
              <div className="space-y-4">
                {paginatedActivity?.map((a, i) => (
                  <div key={i} className="flex gap-3 pb-4" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                    <div className="p-2 rounded-xl" style={{ backgroundColor: "#C6EFD9" }}>
                      <TrendingUp className="w-4 h-4" style={{ color: "#2BB57A" }} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: HEADING }}>{a.firstName} {a.lastName}</p>
                      <p className="text-sm" style={{ color: BODY }}>{getActionText(a.status)} • {a.cropName}</p>
                      <p className="mt-1 text-xs" style={{ color: MUTED }}>{timeAgo(a.createdAt)}</p>
                    </div>
                  </div>
                ))}
                {!paginatedActivity?.length && (
                  <p className="text-sm" style={{ color: MUTED }}>No recent activity</p>
                )}
              </div>
              {totalPages > 1 && (
                <div className="flex justify-end gap-2 mt-4">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="px-3 py-1 text-sm font-semibold disabled:opacity-40 transition-all duration-150"
                    style={{ border: "1.5px solid rgba(0,0,0,0.1)", borderRadius: "10px", color: BODY }}
                  >Prev</button>
                  <button
                    disabled={page === totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="px-3 py-1 text-sm font-semibold disabled:opacity-40 transition-all duration-150"
                    style={{ border: "1.5px solid rgba(0,0,0,0.1)", borderRadius: "10px", color: BODY }}
                  >Next</button>
                </div>
              )}
            </>
          )}

          {view === "review" && (
            <>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold" style={{ color: HEADING }}>Pending Listings</h3>
                <button onClick={() => setView("activity")} className="text-sm font-semibold" style={{ color: BRAND }}>Back →</button>
              </div>
              <div className="space-y-4">
                {pendingListings.map((p) => (
                  <div key={p._id} className="flex items-center justify-between pb-3" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: HEADING }}>{p.userId?.firstName} {p.userId?.lastName}</p>
                      <p className="text-xs" style={{ color: MUTED }}>{p.cropName} • {p.quantity} qtl</p>
                    </div>
                    <button onClick={() => navigate("/listing")} className="text-sm font-semibold" style={{ color: BRAND }}>Review →</button>
                  </div>
                ))}
                {!pendingListings.length && (
                  <p className="text-sm" style={{ color: MUTED }}>No pending listings 🎉</p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
