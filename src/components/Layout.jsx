import { useEffect, useState, useRef } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/slices/authSlice';
import { clearMe } from '../store/slices/layoutSlice';
import {
  LayoutDashboard, Package, ShoppingCart, Archive,
  ShoppingBag, Ticket, Users, BarChart3, Settings,
  LogOut, Menu, Bell, Search, ChevronDown, X,
  Megaphone, User, KeyRound, BookOpen, ImagePlus, FileText, MessageSquare, CalendarCheck,
} from 'lucide-react';
import { fetchMe } from '../store/thunks/layoutThunk';
import { fetchBroadcastHistory } from '../store/thunks/broadcastThunk';
import { fetchMembers } from '../store/thunks/membersThunk';
import { fetchProducts } from '../store/thunks/productsThunk';
import { fetchOrders } from '../store/thunks/procurementThunk';
import { fetchCoupons } from '../store/thunks/couponsThunk';
import theme from '../config/theme';
import { ROUTE_ROLES } from '../config/rbac';
import GoogleLangPicker from "./google-lang-picker/google-lang-picker";
import InstallPWA from './InstallPWA';
import "./google-lang-picker/google-translate.css";

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard',        path: '/dashboard' },
  { icon: Package,         label: 'Listing Approvals', path: '/listing' },
  { icon: ShoppingCart,    label: 'Procurement',       path: '/procurement' },
  { icon: Archive,         label: 'Inventory',         path: '/inventory' },
  { icon: ShoppingBag,     label: 'Order Book',        path: '/buy' },
  { icon: Ticket,          label: 'Coupons',           path: '/coupons' },
  { icon: Megaphone,       label: 'Broadcast',         path: '/broadcast' },
  { icon: Users,           label: 'Members',           path: '/members' },
  { icon: BookOpen,    label: 'Ledger',          path: '/ledger' },
  { icon: ImagePlus,   label: 'Advertisement',   path: '/advertisement' },
  { icon: BarChart3,   label: 'Reports',         path: '/reports' },
  { icon: MessageSquare, label: 'Inquiries',      path: '/inquiry' },
  { icon: CalendarCheck,  label: 'Attendance',     path: '/attendance' },
  { icon: Settings,        label: 'Settings',          path: '/settings' },
];

const timeAgo = (date) => {
  if (!date) return '';
  const mins = Math.floor((Date.now() - new Date(date)) / 60000);
  if (mins < 1)   return 'Just now';
  if (mins < 60)  return `${mins}m ago`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
  return `${Math.floor(mins / 1440)}d ago`;
};

export default function Layout() {
  const [sidebarOpen, setSidebarOpen]           = useState(false);
  const [globalSearch, setGlobalSearch]         = useState('');
  const [showResults, setShowResults]           = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu]         = useState(false);

  const searchRef = useRef(null);
  const notifRef  = useRef(null);
  const userRef   = useRef(null);

  const searchFetchedRef = useRef(false);

  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { me }       = useSelector((s) => s.layout);
  const { user }     = useSelector((s) => s.auth);
  const userRole     = user?.role?.toLowerCase();
  const { products } = useSelector((s) => s.products);

  const visibleMenuItems = menuItems.filter(({ path }) => {
    const allowed = ROUTE_ROLES[path];
    return !allowed || allowed.includes(userRole);
  });
  const { members }  = useSelector((s) => s.members);
  const { orders }   = useSelector((s) => s.procurement);
  const { coupons }  = useSelector((s) => s.coupons);
  const broadcasts   = useSelector((s) =>
    Array.isArray(s.broadcast?.broadcasts) ? s.broadcast.broadcasts : []
  );

  useEffect(() => {
    dispatch(fetchMe());
    dispatch(fetchBroadcastHistory());
  }, [dispatch]);

  /* CLOSE ALL DROPDOWNS ON OUTSIDE CLICK */
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowResults(false);
      if (notifRef.current  && !notifRef.current.contains(e.target))  setShowNotifications(false);
      if (userRef.current   && !userRef.current.contains(e.target))   setShowUserMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => { dispatch(logout()); dispatch(clearMe()); navigate('/login'); };

  /* CURRENT PAGE LABEL */
  const currentPage = menuItems.find((m) => m.path === location.pathname)?.label || 'Dashboard';

  /* GLOBAL SEARCH — lazy-load search data on first keystroke */
  const handleSearchChange = (e) => {
    setGlobalSearch(e.target.value);
    setShowResults(true);
    if (!searchFetchedRef.current) {
      searchFetchedRef.current = true;
      if (!members.length)  dispatch(fetchMembers());
      if (!products.length) dispatch(fetchProducts());
      if (!orders.length)   dispatch(fetchOrders());
      if (!coupons.length)  dispatch(fetchCoupons());
    }
  };

  /* GLOBAL SEARCH */
  const searchResults = globalSearch.trim().length < 2 ? [] : (() => {
    const term = globalSearch.toLowerCase();
    const results = [];

    members?.filter((m) =>
      `${m.firstName} ${m.lastName}`.toLowerCase().includes(term) || m.phone?.includes(term)
    ).slice(0, 3).forEach((m) => results.push({
      icon: '👤', label: `${m.firstName} ${m.lastName}`,
      sub: `Member • +91 ${m.phone}`, path: '/members',
    }));

    products?.filter((p) =>
      p.cropName?.toLowerCase().includes(term) ||
      `${p.userId?.firstName} ${p.userId?.lastName}`.toLowerCase().includes(term)
    ).slice(0, 3).forEach((p) => results.push({
      icon: '🌾', label: p.cropName,
      sub: `Listing • ${p.userId?.firstName} ${p.userId?.lastName} • ${p.status}`,
      path: '/listing',
    }));

    orders?.filter((o) =>
      `${o.farmer?.firstName} ${o.farmer?.lastName}`.toLowerCase().includes(term) ||
      o.crops?.some((c) => c.cropName?.toLowerCase().includes(term))
    ).slice(0, 3).forEach((o) => results.push({
      icon: '🛒', label: `${o.farmer?.firstName} ${o.farmer?.lastName}`,
      sub: `Procurement • ${o.crops?.map((c) => c.cropName).join(', ')}`,
      path: '/procurement',
    }));

    coupons?.filter((c) => c.code?.toLowerCase().includes(term)
    ).slice(0, 3).forEach((c) => results.push({
      icon: '🎟️', label: c.code,
      sub: `Coupon • ${c.discountType} • ${c.discountValue}`,
      path: '/coupons',
    }));

    return results;
  })();

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">

      {/* ===================== SIDEBAR ===================== */}
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`fixed lg:static z-40 h-full w-64 bg-gradient-to-b from-brand-900 to-brand-800 text-white flex flex-col transition-transform duration-300 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>

        {/* BRAND */}
        <div className="px-6 py-5 border-b border-brand-700/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
              <span className="text-lg">{theme.logo}</span>
            </div>
            <div>
              <h1 className="text-base font-bold tracking-wide">{theme.brand}</h1>
              <p className="text-xs text-brand-300">{theme.tagline}</p>
            </div>
          </div>
        </div>

        {/* NAV */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {visibleMenuItems.map((item) => {
            const Icon   = item.icon;
            const active = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => { navigate(item.path); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  active
                    ? 'bg-white text-brand-900 shadow-sm'
                    : 'text-brand-100 hover:bg-white/10'
                }`}
              >
                <Icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-brand-700' : ''}`} />
                {item.label}
                {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-600" />}
              </button>
            );
          })}
        </nav>


      </aside>

      {/* ===================== MAIN ===================== */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* ===== HEADER ===== */}
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-4 shadow-sm">

          {/* Mobile hamburger */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition"
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>

          {/* PAGE TITLE */}
          <div className="hidden lg:block">
            <p className="text-sm font-semibold text-gray-800">{currentPage}</p>
            <p className="text-xs text-gray-400">
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>

          {/* SEARCH */}
          <div className="flex-1 max-w-lg mx-auto" ref={searchRef}>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={globalSearch}
                onChange={handleSearchChange}
                onFocus={() => setShowResults(true)}
                placeholder="Search members, crops, orders..."
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition"
              />
              {globalSearch && (
                <button onClick={() => { setGlobalSearch(''); setShowResults(false); }} className="absolute right-3 top-2.5">
                  <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                </button>
              )}

              {/* SEARCH DROPDOWN */}
              {showResults && globalSearch.trim().length >= 2 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
                  {searchResults.length === 0 ? (
                    <div className="px-4 py-6 text-center">
                      <p className="text-sm text-gray-500">No results for "{globalSearch}"</p>
                    </div>
                  ) : (
                    <>
                      <div className="px-4 py-2 bg-gray-50 border-b">
                        <p className="text-xs text-gray-500 font-medium">{searchResults.length} results found</p>
                        </div>
                        
                      <div className="max-h-72 overflow-y-auto">
                        {searchResults.map((r, i) => (
                          <button
                            key={i}
                            onClick={() => { navigate(r.path); setGlobalSearch(''); setShowResults(false); }}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-brand-50 border-b last:border-b-0 transition text-left"
                          >
                          
                            <span className="text-lg">{r.icon}</span>
                            <div>
                              <p className="text-sm font-medium text-gray-800">{r.label}</p>
                              <p className="text-xs text-gray-500">{r.sub}</p>
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
          <div className="flex items-center gap-2 ml-auto">
            <InstallPWA />

            <div className="relative" ref={notifRef}>
              <button
                onClick={() => { setShowNotifications((v) => !v); setShowUserMenu(false); }}
                className={`relative p-2 rounded-xl transition ${showNotifications ? 'bg-brand-50 text-brand-700' : 'hover:bg-gray-100 text-gray-600'}`}
              >
                <Bell className="w-5 h-5" />
                {broadcasts.length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 top-full mt-2 w-96 bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 overflow-hidden">

                  {/* NOTIF HEADER */}
                  <div className="flex justify-between items-center px-5 py-4 border-b bg-gray-50">
                    <div>
                      <p className="font-semibold text-gray-800">Notifications</p>
                      <p className="text-xs text-gray-500">{broadcasts.length} broadcast{broadcasts.length !== 1 ? 's' : ''} sent</p>
                    </div>
                    <button
                      onClick={() => { navigate('/broadcast'); setShowNotifications(false); }}
                      className="text-xs text-white bg-brand-600 hover:bg-brand-700 px-3 py-1.5 rounded-lg transition"
                    >
                      View All
                    </button>
                  </div>

                  {/* NOTIF LIST */}
                  <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
                    {broadcasts.length === 0 ? (
                      <div className="px-5 py-8 text-center">
                        <Bell className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">No notifications yet</p>
                      </div>
                    ) : (
                      broadcasts.slice(0, 8).map((b) => (
                        <div key={b._id} className="flex gap-3 px-5 py-4 hover:bg-gray-50 transition cursor-pointer">
                          <div className="w-9 h-9 rounded-xl bg-brand-100 flex items-center justify-center flex-shrink-0">
                            <Megaphone className="w-4 h-4 text-brand-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">{b.title}</p>
                            <p className="text-xs text-gray-500 truncate mt-0.5">{b.description}</p>
                            <p className="text-xs text-gray-400 mt-1">{timeAgo(b.createdAt)}</p>
                          </div>
                          <span className="text-xs text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full h-fit flex-shrink-0">
                            {b.targetRole || 'All'}
                          </span>
                        </div>
                      ))
                    )}
                  </div>

                  {/* NOTIF FOOTER */}
                  {broadcasts.length > 0 && (
                    <div className="px-5 py-3 border-t bg-gray-50 text-center">
                      <button
                        onClick={() => { navigate('/broadcast'); setShowNotifications(false); }}
                        className="text-sm text-brand-600 hover:text-brand-700 font-medium"
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
                onClick={() => { setShowUserMenu((v) => !v); setShowNotifications(false); }}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl transition ${showUserMenu ? 'bg-brand-50' : 'hover:bg-gray-100'}`}
              >
                <div className="w-8 h-8 rounded-full bg-brand-700 text-white flex items-center justify-center text-sm font-bold">
                  {me?.firstName?.charAt(0)?.toUpperCase() || 'A'}
                </div>
                <div className="hidden sm:block text-left leading-tight">
                  <p className="text-sm font-medium text-gray-800">
                    {me ? `${me.firstName} ${me.lastName}` : '...'}
                  </p>
                  <p className="text-xs text-gray-500">{me?.role || ''}</p>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden">
                  <div className="px-4 py-3 bg-gray-50 border-b">
                    <p className="text-sm font-semibold text-gray-800">
                      {me ? `${me.firstName} ${me.lastName}` : '...'}
                    </p>
                    <p className="text-xs text-gray-500">{me?.emailId || me?.role || ''}</p>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={() => { navigate('/settings'); setShowUserMenu(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"
                    >
                      <User className="w-4 h-4 text-gray-400" />
                      Profile Settings
                    </button>
                    <button
                      onClick={() => { navigate('/settings'); setShowUserMenu(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"
                    >
                      <KeyRound className="w-4 h-4 text-gray-400" />
                      Change Password
                    </button>
                  </div>
                  <div className="border-t py-1">
                    <button
                      onClick={() => { setShowUserMenu(false); setShowLogoutConfirm(true); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition"
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
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>

      {/* LOGOUT CONFIRM DIALOG */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <LogOut className="w-8 h-8 text-red-600" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Sign Out</h3>
              <p className="text-sm text-gray-500 mt-1">Are you sure you want to sign out of your account?</p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm hover:bg-red-700 transition font-medium"
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
