import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Package,
  ShoppingCart,
  CheckCircle,
  ClipboardList,
  Users,
  TrendingUp,
  TrendingDown,
  Wallet,
  BookOpen,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
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

  const { stats, chartData, dailyListings, recentActivity, allListings, loading } =
    useSelector((state) => state.dashboard);

  const { allEntries = [] } = useSelector((s) => s.ledger);
  const ledgerEntries = Array.isArray(allEntries) ? allEntries : [];

  const totalToPayFarmers = ledgerEntries.reduce((s, e) => {
    if (e.type === "CREDIT" && e.referenceType === "PROCUREMENT") return s + Number(e.amount || 0);
    if (e.type === "DEBIT" && (e.referenceType === "PROCUREMENT_PAYMENT" || e.referenceType === "PAYMENT")) return s - Number(e.amount || 0);
    return s;
  }, 0);

  const totalToCollect = ledgerEntries.reduce((s, e) => {
    if (e.type === "DEBIT" && e.referenceType === "SALE") return s + Number(e.amount || 0);
    if (e.type === "CREDIT" && e.referenceType === "PAYMENT") return s - Number(e.amount || 0);
    return s;
  }, 0);

  const farmerBalanceMap = {};
  ledgerEntries.forEach((e) => {
    const id = e.user?._id;
    if (!id) return;
    if (!farmerBalanceMap[id]) farmerBalanceMap[id] = { user: e.user, net: 0 };
    farmerBalanceMap[id].net += e.type === "CREDIT" ? Number(e.amount || 0) : -Number(e.amount || 0);
  });
  const topPendingFarmers = Object.values(farmerBalanceMap)
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

  const chartTooltipStyle = { backgroundColor: "#1a2e22", color: "#E8F8F1", borderRadius: "10px", border: "none", fontSize: "12px" };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl" style={{ fontWeight: 800, color: HEADING }}>Dashboard Overview</h1>
        <p className="text-sm" style={{ color: MUTED }}>Welcome back! Here's what's happening with your FPO today.</p>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Pending Approvals"  value={stats.pendingApprovals}  icon={Package}      path="/listing"     iconBg="#C6EFD9"  iconColor="#2BB57A"  navigate={navigate} />
        <StatCard title="Approved Listings"  value={stats.approvedListings}  icon={CheckCircle}  path="/listing"     iconBg="#E8F8F1"  iconColor="#3ECF8E"  navigate={navigate} />
        <StatCard title="Total Orders"       value={stats.totalOrders}       icon={ShoppingCart} path="/procurement" iconBg="#dbeafe"  iconColor="#3b82f6"  navigate={navigate} />
        <StatCard title="Total Members"      value={stats.totalMembers}      icon={Users}        path="/members"     iconBg="#fef3c7"  iconColor="#f59e0b"  navigate={navigate} />
      </div>

      {/* GRAPHS */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="p-6 rounded-2xl" style={{ backgroundColor: CARD_BG, border: "1px solid rgba(0,0,0,0.06)" }}>
          <h3 className="mb-3 font-bold" style={{ color: HEADING }}>Daily Listings Submitted</h3>
          {dailyListings.every((d) => d.count === 0) ? (
            <div className="flex flex-col items-center justify-center h-[260px]" style={{ color: MUTED }}>
              <TrendingUp className="w-10 h-10 mb-2 opacity-30" />
              <p className="text-sm">No listings submitted yet</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={dailyListings}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(62,207,142,0.15)" />
                <XAxis dataKey="day" tick={{ fill: MUTED, fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fill: MUTED, fontSize: 12 }} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Line type="monotone" dataKey="count" stroke="#3ECF8E" strokeWidth={2.5} dot={{ r: 4, fill: "#3ECF8E", strokeWidth: 0 }} activeDot={{ r: 6, fill: "#2BB57A" }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="p-6 rounded-2xl" style={{ backgroundColor: CARD_BG, border: "1px solid rgba(0,0,0,0.06)" }}>
          <h3 className="mb-3 font-bold" style={{ color: HEADING }}>Crop-wise Procurement Trend</h3>
          {chartData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[260px]" style={{ color: MUTED }}>
              <ShoppingCart className="w-10 h-10 mb-2 opacity-30" />
              <p className="text-sm">No procurement data available</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(62,207,142,0.15)" />
                <XAxis dataKey="month" tick={{ fill: MUTED, fontSize: 12 }} />
                <YAxis tick={{ fill: MUTED, fontSize: 12 }} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Bar dataKey="sales" fill="#3ECF8E" radius={[6, 6, 0, 0]} barSize={36} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* PAYMENT SUMMARY */}
      {ledgerEntries.length > 0 && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Balance cards */}
          <div className="space-y-3">
            {[
              { label: "To Pay Farmers", sub: "Pending procurement payments", value: fmtClean(Math.max(0, totalToPayFarmers)), icon: TrendingDown, iconBg: "#fee2e2", iconColor: "#ef4444", valColor: "#ef4444" },
              { label: "To Collect from Farmers", sub: "Pending sale collections", value: fmtClean(Math.max(0, totalToCollect)), icon: TrendingUp, iconBg: SAGE_100, iconColor: SAGE, valColor: SAGE },
              {
                label: "Net Balance",
                sub: Math.max(0, totalToPayFarmers) >= Math.max(0, totalToCollect) ? "FPO owes farmers" : "Farmers owe FPO",
                value: fmtClean(Math.abs(Math.max(0, totalToPayFarmers) - Math.max(0, totalToCollect))),
                icon: Wallet,
                iconBg: "#fef3c7",
                iconColor: "#f59e0b",
                valColor: Math.max(0, totalToPayFarmers) >= Math.max(0, totalToCollect) ? "#ef4444" : SAGE,
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

          {/* Top pending farmers */}
          <div className="p-5 rounded-2xl" style={{ backgroundColor: CARD_BG, border: "1px solid rgba(0,0,0,0.06)" }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold" style={{ color: HEADING }}>Pending Balances</h3>
              <button onClick={() => navigate("/ledger")} className="text-xs font-semibold" style={{ color: BRAND }}>View Ledger →</button>
            </div>
            {topPendingFarmers.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32" style={{ color: MUTED }}>
                <Wallet className="w-8 h-8 mb-2 opacity-30" />
                <p className="text-sm">All balances cleared</p>
              </div>
            ) : (
              <div className="space-y-3">
                {topPendingFarmers.map((r) => (
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
                      <p className="text-[10px] font-semibold" style={{ color: r.net > 0 ? "#ef4444" : "#2BB57A" }}>{r.net > 0 ? "FPO owes" : "Farmer owes"}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent transactions */}
          <div className="p-5 rounded-2xl" style={{ backgroundColor: CARD_BG, border: "1px solid rgba(0,0,0,0.06)" }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold" style={{ color: HEADING }}>Recent Transactions</h3>
              <button onClick={() => navigate("/ledger")} className="text-xs font-semibold" style={{ color: BRAND }}>View All →</button>
            </div>
            {recentTxns.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32" style={{ color: MUTED }}>
                <BookOpen className="w-8 h-8 mb-2 opacity-30" />
                <p className="text-sm">No transactions yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentTxns.map((e, i) => {
                  const isCredit = e.type === "CREDIT";
                  return (
                    <div key={e._id || i} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: isCredit ? "#fee2e2" : SAGE_100 }}>
                        {isCredit
                          ? <TrendingDown className="w-4 h-4" style={{ color: "#ef4444" }} />
                          : <TrendingUp className="w-4 h-4" style={{ color: SAGE }} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: HEADING }}>{e.user?.firstName} {e.user?.lastName}</p>
                        <p className="text-xs" style={{ color: MUTED }}>{e.referenceType} · {new Date(e.createdAt).toLocaleDateString("en-IN")}</p>
                      </div>
                      <p className="text-sm font-bold flex-shrink-0" style={{ color: isCredit ? "#ef4444" : SAGE }}>
                        {isCredit ? "-" : "+"}{fmtClean(e.amount)}
                      </p>
                    </div>
                  );
                })}
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
