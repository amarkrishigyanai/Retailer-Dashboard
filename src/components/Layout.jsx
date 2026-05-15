import { useEffect, useState, useRef } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../store/slices/authSlice";
import { clearMe } from "../store/slices/layoutSlice";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Archive,
  ShoppingBag,
  Ticket,
  Users,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  Bell,
  Search,
  ChevronDown,
  X,
  Megaphone,
  User,
  KeyRound,
  BookOpen,
  ImagePlus,
  FileText,
  MessageSquare,
  CalendarCheck,
  ClipboardList,
} from "lucide-react";
import { fetchMe } from "../store/thunks/layoutThunk";
import { fetchBroadcastHistory } from "../store/thunks/broadcastThunk";
import { fetchMembers } from "../store/thunks/membersThunk";
import { fetchProducts } from "../store/thunks/productsThunk";
import { fetchOrders } from "../store/thunks/procurementThunk";
import { fetchCoupons } from "../store/thunks/couponsThunk";
import theme from "../config/theme";
import { ROUTE_ROLES } from "../config/rbac";
import GoogleLangPicker from "./google-lang-picker/google-lang-picker";
import InstallPWA from "./InstallPWA";
import "./google-lang-picker/google-translate.css";

// ── Theme tokens ──────────────────────────────────────
const G = {
  // Sidebar — glassmorphism (fresh teal-mint)
  sidebarBg: "linear-gradient(160deg, rgba(10,58,46,0.88) 0%, rgba(8,90,68,0.84) 50%, rgba(5,110,82,0.80) 100%)",
  sidebarBorder: "rgba(0,200,150,0.22)",
  activeNav:
    "linear-gradient(90deg, rgba(0,200,150,0.28) 0%, rgba(0,180,130,0.1) 100%)",
  hoverNav: "rgba(255,255,255,0.08)",
  activeDot: "#00c896",
  activeIcon: "#5fffcb",
  activeText: "#ffffff",
  mutedIcon: "rgba(255,255,255,0.72)",
  mutedText: "rgba(255,255,255,0.80)",
  // Sidebar-specific accent colors
  sidebarAccent: "#00c896",
  sidebarAccentSoft: "rgba(0,200,150,0.22)",
  sidebarAccentBorder: "rgba(0,200,150,0.32)",
  sidebarDivider: "rgba(0,200,150,0.12)",
  sidebarBrandGlow: "0 0 24px rgba(0,200,150,0.35)",
  sidebarIconBg: "rgba(255,255,255,0.08)",
  sidebarIconBgActive: "rgba(0,200,150,0.28)",
  sidebarActiveShadow: "0 4px 20px rgba(0,200,150,0.25), inset 0 1px 0 rgba(255,255,255,0.12)",
  sidebarActiveBar: "#00c896",
  sidebarTagBg: "rgba(0,200,150,0.15)",
  sidebarTagText: "#5fffcb",
  sidebarFooterBg: "rgba(255,255,255,0.05)",
  sidebarUserGradient: "linear-gradient(135deg, #00c896, #00a87e)",
  sidebarOnlineDot: "#00c896",
  sidebarOnlineBorder: "#0a3a2e",
  // Header
  header: "rgba(255,255,255,0.97)",
  headerBorder: "rgba(62,207,142,0.12)",
  heading: "#0f172a",
  muted: "#64748b",
  searchBg: "#f0fdf4",
  searchBorder: "rgba(62,207,142,0.2)",
  // Dropdowns
  dropdownBg: "#ffffff",
  dropdownBorder: "rgba(62,207,142,0.15)",
  dropdownShadow: "0 16px 40px rgba(15,23,42,0.16)",
  // Misc
  primary: "#3ECF8E",
  primaryDark: "#2BB57A",
  primaryLight: "#E8F8F1",
  tagBg: "rgba(62,207,142,0.15)",
  tagText: "#3ECF8E",
  notifIconBg: "#E8F8F1",
  notifIcon: "#2BB57A",
  mainBg: "#f0faf5",
  overlayBg: "rgba(15,23,42,0.55)",
  logoutIconBg: "#fee2e2",
  logoutIcon: "#991b1b",
  pageBg: "#0d2b1e",
};

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: Package, label: "Crop Listings", path: "/listing" },
  { icon: ShoppingCart, label: "Procurement", path: "/procurement" },
  { icon: Archive, label: "Inventory", path: "/inventory" },
  { icon: ShoppingBag, label: "Order Book", path: "/buy" },
  { icon: Ticket, label: "Coupons", path: "/coupons" },
  { icon: Megaphone, label: "Broadcast", path: "/broadcast" },
  { icon: Users, label: "Members", path: "/members" },
  { icon: BookOpen, label: "Ledger", path: "/ledger" },
  { icon: ImagePlus, label: "Advertisement", path: "/advertisement" },
  { icon: BarChart3, label: "Reports", path: "/reports" },
  { icon: MessageSquare, label: "Inquiries", path: "/inquiry" },
  { icon: CalendarCheck, label: "Attendance", path: "/attendance" },
  { icon: ClipboardList, label: "Tasks", path: "/tasks" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

const timeAgo = (date) => {
  if (!date) return "";
  const mins = Math.floor((Date.now() - new Date(date)) / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
  return `${Math.floor(mins / 1440)}d ago`;
};

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const searchRef = useRef(null);
  const notifRef = useRef(null);
  const userRef = useRef(null);
  const searchFetchedRef = useRef(false);

  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { me } = useSelector((s) => s.layout);
  const { user } = useSelector((s) => s.auth);
  const userRole = user?.role?.toLowerCase();
  const { products } = useSelector((s) => s.products);

  const visibleMenuItems = menuItems.filter(({ path }) => {
    const allowed = ROUTE_ROLES[path];
    return !allowed || allowed.includes(userRole);
  });

  const { members } = useSelector((s) => s.members);
  const { orders } = useSelector((s) => s.procurement);
  const { coupons } = useSelector((s) => s.coupons);
  const broadcasts = useSelector((s) =>
    Array.isArray(s.broadcast?.broadcasts) ? s.broadcast.broadcasts : [],
  );

  useEffect(() => {
    dispatch(fetchMe());
    dispatch(fetchBroadcastHistory());
  }, [dispatch]);

  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target))
        setShowResults(false);
      if (notifRef.current && !notifRef.current.contains(e.target))
        setShowNotifications(false);
      if (userRef.current && !userRef.current.contains(e.target))
        setShowUserMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    dispatch(clearMe());
    navigate("/login");
  };

  const currentPage =
    menuItems.find((m) => m.path === location.pathname)?.label || "Dashboard";

  const handleSearchChange = (e) => {
    setGlobalSearch(e.target.value);
    setShowResults(true);
    if (!searchFetchedRef.current) {
      searchFetchedRef.current = true;
      if (!members.length) dispatch(fetchMembers());
      if (!products.length) dispatch(fetchProducts());
      if (!orders.length) dispatch(fetchOrders());
      if (!coupons.length) dispatch(fetchCoupons());
    }
  };

  const searchResults =
    globalSearch.trim().length < 2
      ? []
      : (() => {
        const term = globalSearch.toLowerCase();
        const results = [];
        members
          ?.filter(
            (m) =>
              `${m.firstName} ${m.lastName}`.toLowerCase().includes(term) ||
              m.phone?.includes(term),
          )
          .slice(0, 3)
          .forEach((m) =>
            results.push({
              icon: "👤",
              label: `${m.firstName} ${m.lastName}`,
              sub: `Member • +91 ${m.phone}`,
              path: "/members",
            }),
          );
        products
          ?.filter(
            (p) =>
              p.cropName?.toLowerCase().includes(term) ||
              `${p.userId?.firstName} ${p.userId?.lastName}`
                .toLowerCase()
                .includes(term),
          )
          .slice(0, 3)
          .forEach((p) =>
            results.push({
              icon: "📦",
              label: p.cropName,
              sub: `Listing • ${p.userId?.firstName} ${p.userId?.lastName} • ${p.status}`,
              path: "/listing",
            }),
          );
        orders
          ?.filter(
            (o) =>
              `${(o.customer || o.farmer)?.firstName} ${(o.customer || o.farmer)?.lastName}`
                .toLowerCase()
                .includes(term),
          )
          .slice(0, 3)
          .forEach((o) =>
            results.push({
              icon: "🛒",
              label: `${(o.customer || o.farmer)?.firstName} ${(o.customer || o.farmer)?.lastName}`,
              sub: `Order • ${o.crops?.map((c) => c.cropName).join(", ") || ""}`,
              path: "/procurement",
            }),
          );
        coupons
          ?.filter((c) => c.code?.toLowerCase().includes(term))
          .slice(0, 3)
          .forEach((c) =>
            results.push({
              icon: "🎟️",
              label: c.code,
              sub: `Coupon • ${c.discountType} • ${c.discountValue}`,
              path: "/coupons",
            }),
          );
        return results;
      })();

  return (
    <div
      className="h-screen flex overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #071f17 0%, #0a3a2a 45%, #083222 100%)",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      {/* SIDEBAR OVERLAY (mobile) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── SIDEBAR ── */}
      <aside
        className={`fixed lg:static z-40 h-full w-72 flex flex-col transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }`}
        style={{
          background: G.sidebarBg,
          backdropFilter: "blur(24px) saturate(200%)",
          WebkitBackdropFilter: "blur(24px) saturate(200%)",
          borderRight: `1px solid ${G.sidebarBorder}`,
          boxShadow: "4px 0 40px rgba(0,0,0,0.3), inset -1px 0 0 rgba(0,200,150,0.1)",
        }}
      >
        {/* BRAND */}
        <div
          className="px-5 py-5"
          style={{
            borderBottom: `1px solid ${G.sidebarDivider}`,
            background: "linear-gradient(180deg, rgba(0,200,150,0.1) 0%, transparent 100%)",
          }}
        >
          <div className="flex items-center gap-3.5">
            {/* Logo */}
            <div
              className="relative flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center"
              style={{
                background: "#ffffff",
                boxShadow: "0 0 0 2px rgba(0,200,150,0.6), 0 0 20px rgba(0,200,150,0.35)",
                overflow: "hidden",
              }}
            >
              <img
                src={theme.logo}
                alt={theme.shortName}
                className="w-full h-full object-cover scale-125"
                style={{ mixBlendMode: "multiply" }}
              />
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0" translate="no">
              <h1
                className="text-[12px] font-black leading-snug"
                style={{
                  color: "#ffffff",
                  textShadow: "0 2px 12px rgba(0,200,150,0.45)",
                  letterSpacing: "0em",
                  wordBreak: "break-word",
                }}
              >
                {theme.brand}
              </h1>
              <div className="flex items-center gap-1.5 mt-1">
                <span
                  className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                  style={{
                    background: "linear-gradient(90deg, rgba(0,200,150,0.3), rgba(0,180,130,0.15))",
                    border: "1px solid rgba(0,200,150,0.35)",
                    color: "#5fffcb",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                  }}
                >
                  Admin Panel
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* NAV */}
        <nav
          className="flex-1 px-3 py-3 overflow-y-auto"
          style={{ scrollbarWidth: "none" }}
        >
          {visibleMenuItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  setSidebarOpen(false);
                }}
                className="w-full flex items-center gap-3.5 px-4 py-3.5 mb-1.5 transition-all duration-200 relative group"
                style={{
                  borderRadius: "14px",
                  background: active
                    ? "linear-gradient(90deg, rgba(0,200,150,0.28) 0%, rgba(0,180,130,0.1) 100%)"
                    : "transparent",
                  border: active
                    ? "1px solid rgba(0,200,150,0.35)"
                    : "1px solid transparent",
                  backdropFilter: active ? "blur(8px)" : "none",
                  boxShadow: active ? G.sidebarActiveShadow : "none",
                  fontSize: "14.5px",
                  letterSpacing: "0.01em",
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = "rgba(255,255,255,0.07)";
                    e.currentTarget.style.border = "1px solid rgba(255,255,255,0.1)";
                    e.currentTarget.style.backdropFilter = "blur(6px)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.border = "1px solid transparent";
                    e.currentTarget.style.backdropFilter = "none";
                  }
                }}
              >
                {/* Active left glow bar */}
                {active && (
                  <span
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 rounded-r-full"
                    style={{
                      height: "60%",
                      background: "linear-gradient(180deg, #5fffcb, #00c896)",
                      boxShadow: "0 0 10px #00c896",
                    }}
                  />
                )}
                <span
                  className="w-9 h-9 flex items-center justify-center rounded-xl flex-shrink-0"
                  style={{
                    background: active
                      ? "linear-gradient(135deg, rgba(0,200,150,0.38), rgba(0,180,130,0.2))"
                      : "rgba(255,255,255,0.07)",
                    border: active
                      ? "1px solid rgba(0,200,150,0.45)"
                      : "1px solid rgba(255,255,255,0.08)",
                    boxShadow: active ? "0 0 14px rgba(0,200,150,0.35)" : "none",
                  }}
                >
                  <Icon
                    className="w-4.5 h-4.5"
                    style={{ width: 18, height: 18, color: active ? "#5fffcb" : "rgba(255,255,255,0.7)" }}
                  />
                </span>
                <span
                  className="truncate text-[16px]"
                  style={{
                    color: active ? "#ffffff" : "rgba(255,255,255,0.88)",
                    fontWeight: 700,
                    letterSpacing: "0.01em",
                    textShadow: active ? "0 1px 8px rgba(0,200,150,0.3)" : "none",
                  }}
                >
                  {item.label}
                </span>
                {active && (
                  <span
                    className="ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{
                      backgroundColor: "#00c896",
                      boxShadow: "0 0 8px #00c896",
                    }}
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* SIDEBAR FOOTER */}
        <div
          className="px-4 py-4"
          style={{
            borderTop: `1px solid ${G.sidebarDivider}`,
            background: "linear-gradient(0deg, rgba(0,0,0,0.15) 0%, transparent 100%)",
          }}
        >
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full flex items-center gap-3 px-3 py-2.5 transition-all duration-200"
            style={{
              borderRadius: "12px",
              background: "rgba(180,30,30,0.35)",
              border: "1px solid rgba(220,50,50,0.4)",
              backdropFilter: "blur(8px)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(180,30,30,0.55)";
              e.currentTarget.style.border = "1px solid rgba(220,50,50,0.6)";
              e.currentTarget.style.boxShadow = "0 4px 20px rgba(180,30,30,0.4)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(180,30,30,0.35)";
              e.currentTarget.style.border = "1px solid rgba(220,50,50,0.4)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{
                background: "linear-gradient(135deg, rgba(200,40,40,0.6), rgba(160,20,20,0.5))",
                border: "1px solid rgba(220,60,60,0.5)",
              }}
            >
              <LogOut className="w-4 h-4" style={{ color: "#fca5a5" }} />
            </div>
            <span className="text-xs font-semibold" style={{ color: "#ffffff" }}>
              Logout
            </span>
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* HEADER */}
        <header
          className="px-5 py-3 flex items-center gap-3"
          style={{
            backgroundColor: G.header,
            borderBottom: `1px solid ${G.headerBorder}`,
            boxShadow: "0 1px 12px rgba(15,35,24,0.06)",
          }}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-xl transition"
            style={{ backgroundColor: G.primaryLight }}
          >
            <Menu className="w-5 h-5" style={{ color: G.primaryDark }} />
          </button>

          <div className="hidden lg:flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, #3ECF8E22, #2BB57A22)",
              }}
            >
              {(() => {
                const item = menuItems.find(
                  (m) => m.path === location.pathname,
                );
                return item ? (
                  <item.icon
                    className="w-3.5 h-3.5"
                    style={{ color: G.primaryDark }}
                  />
                ) : null;
              })()}
            </div>
            <div>
              <p
                className="text-sm font-bold leading-tight"
                style={{ color: G.heading }}
              >
                {currentPage}
              </p>
              <p
                className="text-[11px] leading-tight"
                style={{ color: G.muted }}
              >
                {new Date().toLocaleDateString("en-IN", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </p>
            </div>
          </div>

          {/* SEARCH */}
          <div className="flex-1 max-w-lg mx-auto" ref={searchRef}>
            <div className="relative">
              <Search
                className="absolute left-3 top-2.5 w-4 h-4"
                style={{ color: G.muted }}
              />
              <input
                type="text"
                value={globalSearch}
                onChange={handleSearchChange}
                onFocus={() => setShowResults(true)}
                placeholder="Search members, products, orders..."
                className="w-full pl-9 pr-4 py-2 rounded-xl text-sm focus:outline-none transition"
                style={{
                  backgroundColor: G.searchBg,
                  border: `1px solid ${G.searchBorder}`,
                  color: G.heading,
                }}
              />
              {globalSearch && (
                <button
                  onClick={() => {
                    setGlobalSearch("");
                    setShowResults(false);
                  }}
                  className="absolute right-3 top-2.5"
                >
                  <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                </button>
              )}

              {showResults && globalSearch.trim().length >= 2 && (
                <div
                  className="absolute top-full left-0 right-0 mt-2 rounded-2xl z-50 overflow-hidden"
                  style={{
                    backgroundColor: G.dropdownBg,
                    border: `1px solid ${G.dropdownBorder}`,
                    boxShadow: G.dropdownShadow,
                  }}
                >
                  {searchResults.length === 0 ? (
                    <div className="px-4 py-6 text-center">
                      <p className="text-sm" style={{ color: G.muted }}>
                        No results for "{globalSearch}"
                      </p>
                    </div>
                  ) : (
                    <>
                      <div
                        className="px-4 py-2 border-b"
                        style={{ backgroundColor: G.primaryLight }}
                      >
                        <p
                          className="text-xs font-medium"
                          style={{ color: G.muted }}
                        >
                          {searchResults.length} results found
                        </p>
                      </div>
                      <div className="max-h-72 overflow-y-auto">
                        {searchResults.map((r, i) => (
                          <button
                            key={i}
                            onClick={() => {
                              navigate(r.path);
                              setGlobalSearch("");
                              setShowResults(false);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-3 transition text-left"
                            style={{
                              borderBottom: "1px solid rgba(0,0,0,0.05)",
                            }}
                            onMouseEnter={(e) =>
                            (e.currentTarget.style.backgroundColor =
                              G.activeNav)
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.backgroundColor = "")
                            }
                          >
                            <span className="text-lg">{r.icon}</span>
                            <div>
                              <p
                                className="text-sm font-semibold"
                                style={{ color: G.heading }}
                              >
                                {r.label}
                              </p>
                              <p className="text-xs" style={{ color: G.muted }}>
                                {r.sub}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          <GoogleLangPicker classes="d-none d-xl-block" />

          {/* RIGHT ACTIONS */}
          <div className="flex items-center gap-1.5 ml-auto">
            <InstallPWA />

            {/* NOTIFICATIONS */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => {
                  setShowNotifications((v) => !v);
                  setShowUserMenu(false);
                }}
                className="relative p-2 rounded-xl transition"
                style={{
                  color: showNotifications ? G.primaryDark : G.muted,
                  backgroundColor: showNotifications
                    ? G.primaryLight
                    : "transparent",
                  border: showNotifications
                    ? `1px solid ${G.primary}33`
                    : "1px solid transparent",
                }}
              >
                <Bell className="w-5 h-5" />
                {broadcasts.length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
                )}
              </button>

              {showNotifications && (
                <div
                  className="absolute right-0 top-full mt-2 w-96 rounded-2xl z-50 overflow-hidden"
                  style={{
                    backgroundColor: G.dropdownBg,
                    border: `1px solid ${G.dropdownBorder}`,
                    boxShadow: G.dropdownShadow,
                  }}
                >
                  <div
                    className="flex justify-between items-center px-5 py-4 border-b"
                    style={{ backgroundColor: G.primaryLight }}
                  >
                    <div>
                      <p className="font-semibold" style={{ color: G.heading }}>
                        Notifications
                      </p>
                      <p className="text-xs" style={{ color: G.muted }}>
                        {broadcasts.length} broadcast
                        {broadcasts.length !== 1 ? "s" : ""} sent
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        navigate("/broadcast");
                        setShowNotifications(false);
                      }}
                      className="text-xs px-3 py-1.5 rounded-lg transition text-white"
                      style={{ backgroundColor: G.primary }}
                    >
                      View All
                    </button>
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
                    {broadcasts.length === 0 ? (
                      <div className="px-5 py-8 text-center">
                        <Bell
                          className="w-10 h-10 mx-auto mb-2"
                          style={{ color: G.mutedIcon }}
                        />
                        <p className="text-sm" style={{ color: G.muted }}>
                          No notifications yet
                        </p>
                      </div>
                    ) : (
                      broadcasts.slice(0, 8).map((b) => (
                        <div
                          key={b._id}
                          className="flex gap-3 px-5 py-4 transition cursor-pointer"
                          style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}
                          onMouseEnter={(e) =>
                          (e.currentTarget.style.backgroundColor =
                            G.activeNav)
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.backgroundColor = "")
                          }
                        >
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: G.notifIconBg }}
                          >
                            <Megaphone
                              className="w-4 h-4"
                              style={{ color: G.notifIcon }}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p
                              className="text-sm font-medium truncate"
                              style={{ color: G.heading }}
                            >
                              {b.title}
                            </p>
                            <p
                              className="text-xs truncate mt-0.5"
                              style={{ color: G.muted }}
                            >
                              {b.description}
                            </p>
                            <p
                              className="text-xs mt-1"
                              style={{ color: G.muted }}
                            >
                              {timeAgo(b.createdAt)}
                            </p>
                          </div>
                          <span
                            className="text-xs px-2 py-0.5 rounded-full h-fit flex-shrink-0"
                            style={{
                              color: G.primaryDark,
                              backgroundColor: G.primaryLight,
                            }}
                          >
                            {b.targetRole || "All"}
                          </span>
                        </div>
                      ))
                    )}
                  </div>

                  {broadcasts.length > 0 && (
                    <div
                      className="px-5 py-3 border-t text-center"
                      style={{ backgroundColor: G.primaryLight }}
                    >
                      <button
                        onClick={() => {
                          navigate("/broadcast");
                          setShowNotifications(false);
                        }}
                        className="text-sm font-medium"
                        style={{ color: G.primaryDark }}
                      >
                        See all {broadcasts.length} notifications →
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* USER MENU */}
            <div className="relative" ref={userRef}>
              <button
                onClick={() => {
                  setShowUserMenu((v) => !v);
                  setShowNotifications(false);
                }}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl transition"
                style={{
                  backgroundColor: showUserMenu
                    ? G.primaryLight
                    : "transparent",
                  border: showUserMenu
                    ? `1px solid ${G.primary}33`
                    : "1px solid transparent",
                }}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style={{
                    background: "linear-gradient(135deg, #3ECF8E, #2BB57A)",
                    color: "#fff",
                    boxShadow: "0 2px 8px rgba(62,207,142,0.4)",
                  }}
                >
                  {me?.firstName?.charAt(0)?.toUpperCase() || "A"}
                </div>
                <div className="hidden sm:block text-left leading-tight">
                  <p
                    className="text-[13px] font-semibold"
                    style={{ color: G.heading }}
                  >
                    {me ? `${me.firstName} ${me.lastName}` : "..."}
                  </p>
                  <p className="text-[11px]" style={{ color: G.muted }}>
                    {me?.role || ""}
                  </p>
                </div>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform ${showUserMenu ? "rotate-180" : ""}`}
                  style={{ color: G.muted }}
                />
              </button>

              {showUserMenu && (
                <div
                  className="absolute right-0 top-full mt-2 w-56 rounded-2xl z-50 overflow-hidden"
                  style={{
                    backgroundColor: G.dropdownBg,
                    border: `1px solid ${G.dropdownBorder}`,
                    boxShadow: G.dropdownShadow,
                  }}
                >
                  <div
                    className="px-4 py-3 border-b"
                    style={{ backgroundColor: G.primaryLight }}
                  >
                    <p
                      className="text-sm font-semibold"
                      style={{ color: G.heading }}
                    >
                      {me ? `${me.firstName} ${me.lastName}` : "..."}
                    </p>
                    <p className="text-xs" style={{ color: G.muted }}>
                      {me?.emailId || me?.role || ""}
                    </p>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={() => {
                        navigate("/settings");
                        setShowUserMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition"
                      style={{ color: G.heading }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor = G.activeNav)
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor = "")
                      }
                    >
                      <User className="w-4 h-4" style={{ color: G.muted }} />
                      Profile Settings
                    </button>
                    <button
                      onClick={() => {
                        navigate("/settings");
                        setShowUserMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition"
                      style={{ color: G.heading }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor = G.activeNav)
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor = "")
                      }
                    >
                      <KeyRound
                        className="w-4 h-4"
                        style={{ color: G.muted }}
                      />
                      Change Password
                    </button>
                  </div>
                  <div className="border-t py-1">
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        setShowLogoutConfirm(true);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition"
                      style={{ color: "#991b1b" }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor = "#fee2e2")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor = "")
                      }
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main
          className="flex-1 overflow-y-auto p-6"
          style={{ backgroundColor: G.mainBg }}
        >
          <Outlet />
        </main>
      </div>

      {/* LOGOUT CONFIRM */}
      {showLogoutConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: G.overlayBg }}
        >
          <div
            className="rounded-2xl w-full max-w-sm p-6 text-center space-y-4"
            style={{ backgroundColor: "#ffffff" }}
          >
            <div className="flex justify-center">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ backgroundColor: G.logoutIconBg }}
              >
                <LogOut className="w-8 h-8" style={{ color: G.logoutIcon }} />
              </div>
            </div>
            <div>
              <h3
                className="text-lg"
                style={{ fontWeight: 800, color: G.heading }}
              >
                Sign Out
              </h3>
              <p className="text-sm mt-1" style={{ color: G.muted }}>
                Are you sure you want to sign out of your account?
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 px-4 py-2.5 text-sm font-semibold transition-all duration-150"
                style={{
                  border: `1.5px solid ${G.primary}`,
                  borderRadius: "12px",
                  color: G.primary,
                  backgroundColor: "transparent",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = G.primaryLight)
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "transparent")
                }
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 px-4 py-2.5 text-sm font-bold text-white transition-all duration-150"
                style={{ backgroundColor: G.primary, borderRadius: "12px" }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = G.primaryDark)
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = G.primary)
                }
              >
                Yes, Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
