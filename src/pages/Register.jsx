import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { registerUser } from "../store/thunks/registerThunk";
import { clearAuthState } from "../store/slices/registerSlice";
import {
  Eye, EyeOff, User, Mail, Phone, Lock,
  Store, FileText, MapPin, AlertCircle, CheckCircle2,
  ShieldCheck, BarChart3, Users, Globe,
} from "lucide-react";
import theme from "../config/theme";

const HEADING  = "#3b2e22";
const BODY     = "#5a4535";
const MUTED    = "#7a6558";
const BRAND    = "#e8907a";
const BRAND_DK = "#d97b63";
const BRAND_100 = "#fae0d8";
const CARD_BG  = "#faf3dc";

function passwordStrength(pw) {
  if (pw.length < 6) return { label: "Weak",   width: "33%",  color: "#9e4f3b",  text: "#9e4f3b" };
  if (pw.length < 8 || !/[A-Z]/.test(pw) || !/[0-9]/.test(pw))
    return { label: "Medium", width: "66%",  color: "#c4674f", text: "#c4674f" };
  return { label: "Strong", width: "100%", color: "#679a52", text: "#679a52" };
}

const inputBase = {
  backgroundColor: "#ffffff",
  border: "1px solid rgba(0,0,0,0.08)",
  borderRadius: "14px",
  color: HEADING,
  fontSize: "14px",
  outline: "none",
  transition: "all 0.15s ease",
  width: "100%",
  padding: "10px 16px",
};

const iconInputStyle = { ...inputBase, paddingLeft: "40px" };

function InputIcon({ icon: Icon }) {
  return <Icon className="absolute w-4 h-4 left-3 top-3 pointer-events-none" style={{ color: MUTED }} />;
}

function Label({ children, required }) {
  return (
    <label className="block mb-1.5 text-xs font-bold tracking-wide uppercase" style={{ color: MUTED }}>
      {children}
      {required && <span className="ml-0.5" style={{ color: BRAND }}>*</span>}
    </label>
  );
}

function SectionCard({ title, icon: Icon, children }) {
  return (
    <div className="p-4 space-y-4" style={{ borderRadius: "20px", border: "1px solid rgba(0,0,0,0.08)", backgroundColor: "rgba(250,243,220,0.6)" }}>
      <div className="flex items-center gap-2">
        <div className="flex items-center justify-center w-7 h-7 rounded-xl" style={{ backgroundColor: BRAND_100 }}>
          <Icon className="w-3.5 h-3.5" style={{ color: BRAND_DK }} />
        </div>
        <span className="text-xs font-bold tracking-widest uppercase" style={{ color: BRAND_DK }}>{title}</span>
      </div>
      {children}
    </div>
  );
}

const FEATURES = [
  { icon: Store,       text: "Procurement & inventory management" },
  { icon: Users,       text: "Member tracking & ledger" },
  { icon: BarChart3,   text: "Reports & analytics" },
  { icon: Globe,       text: "Multi-language support" },
  { icon: ShieldCheck, text: "Secure JWT authentication" },
];

function Register() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [confirmError, setConfirmError] = useState("");

  const { loading, error, registerSuccess } = useSelector((s) => s.register);

  const [form, setForm] = useState({
    firstName: "", lastName: "", phone: "", gender: "",
    password: "", village: "", district: "", state: "",
    gstNumber: "", shopName: "", emailId: "",
  });

  useEffect(() => {
    if (registerSuccess) {
      setTimeout(() => { dispatch(clearAuthState()); navigate("/login"); }, 1500);
    }
  }, [registerSuccess, dispatch, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: name === "gstNumber" ? value.toUpperCase() : value }));
    if (error) dispatch(clearAuthState());
  };

  const handleRegister = (e) => {
    e.preventDefault();
    if (form.password !== confirmPassword) { setConfirmError("Passwords do not match"); return; }
    setConfirmError("");
    const trimmed = Object.fromEntries(
      Object.entries(form).map(([k, v]) => [k, typeof v === "string" ? v.trim() : v])
    );
    dispatch(registerUser({ ...trimmed, role: "Retailer" }));
  };

  const strength = form.password ? passwordStrength(form.password) : null;

  const focusStyle = (e) => { e.currentTarget.style.borderColor = BRAND; e.currentTarget.style.boxShadow = `0 0 0 2px ${BRAND}33`; };
  const blurStyle  = (e) => { e.currentTarget.style.borderColor = "rgba(0,0,0,0.08)"; e.currentTarget.style.boxShadow = "none"; };

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: "#fef9e7" }}>
      {/* FORM */}
      <div className="flex items-start justify-center w-full lg:w-1/2 px-6 py-10 overflow-y-auto">
        <div className="w-full max-w-md">
          {/* Brand */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center justify-center w-11 h-11 rounded-2xl" style={{ backgroundColor: BRAND }}>
                <Store className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs font-bold tracking-widest uppercase" style={{ color: BRAND }}>{theme.brand}</p>
                <h1 className="text-lg font-bold leading-tight" style={{ color: HEADING }}>{theme.tagline}</h1>
              </div>
            </div>
            <h2 className="text-2xl" style={{ fontWeight: 800, color: HEADING }}>Create your account</h2>
            <p className="mt-1 text-sm" style={{ color: MUTED }}>Fill in the details below to get started</p>
          </div>

          {error && (
            <div className="flex gap-2.5 p-3.5 mb-5 rounded-xl" style={{ backgroundColor: BRAND_100, border: "1px solid #f5c0b0" }}>
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "#9e4f3b" }} />
              <p className="text-sm" style={{ color: "#9e4f3b" }}>{error}</p>
            </div>
          )}
          {registerSuccess && (
            <div className="flex gap-2.5 p-3.5 mb-5 rounded-xl" style={{ backgroundColor: "#dff0d8", border: "1px solid #c2e0b5" }}>
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "#3e6030" }} />
              <p className="text-sm" style={{ color: "#3e6030" }}>Registration successful! Redirecting to login…</p>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            {/* Personal */}
            <SectionCard title="Personal Information" icon={User}>
              <div className="grid grid-cols-2 gap-3">
                {[["firstName","First Name","Ramesh"],["lastName","Last Name","Kumar"]].map(([name,label,ph]) => (
                  <div key={name}>
                    <Label required>{label}</Label>
                    <div className="relative">
                      <InputIcon icon={User} />
                      <input name={name} required disabled={loading} value={form[name]} onChange={handleChange}
                        style={iconInputStyle} placeholder={ph} onFocus={focusStyle} onBlur={blurStyle} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label required>Phone</Label>
                  <div className="relative">
                    <InputIcon icon={Phone} />
                    <input name="phone" type="tel" inputMode="numeric" pattern="[0-9]{10}" required disabled={loading}
                      value={form.phone} onChange={handleChange} style={iconInputStyle} placeholder="9876543210"
                      onFocus={focusStyle} onBlur={blurStyle} />
                  </div>
                </div>
                <div>
                  <Label required>Gender</Label>
                  <select name="gender" required disabled={loading} value={form.gender} onChange={handleChange}
                    style={inputBase} onFocus={focusStyle} onBlur={blurStyle}>
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div>
                <Label required>Email Address</Label>
                <div className="relative">
                  <InputIcon icon={Mail} />
                  <input name="emailId" type="email" required disabled={loading} value={form.emailId} onChange={handleChange}
                    style={iconInputStyle} placeholder="example@email.com" onFocus={focusStyle} onBlur={blurStyle} />
                </div>
              </div>
            </SectionCard>

            {/* Security */}
            <SectionCard title="Account Security" icon={Lock}>
              <div>
                <Label required>Password</Label>
                <div className="relative">
                  <InputIcon icon={Lock} />
                  <input name="password" type={showPassword ? "text" : "password"} minLength={8} required disabled={loading}
                    value={form.password} onChange={handleChange}
                    style={{ ...iconInputStyle, paddingRight: "40px" }}
                    placeholder="Min 8 chars, include A–Z and 0–9"
                    onFocus={focusStyle} onBlur={blurStyle} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 transition" style={{ color: MUTED }}>
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {strength && (
                  <div className="mt-2 space-y-1">
                    <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ backgroundColor: "rgba(0,0,0,0.08)" }}>
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: strength.width, backgroundColor: strength.color }} />
                    </div>
                    <p className="text-xs" style={{ color: MUTED }}>
                      Strength: <span className="font-bold" style={{ color: strength.text }}>{strength.label}</span>
                    </p>
                  </div>
                )}
              </div>
              <div>
                <Label required>Confirm Password</Label>
                <div className="relative">
                  <InputIcon icon={Lock} />
                  <input name="confirmPassword" type={showConfirm ? "text" : "password"} required disabled={loading}
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); setConfirmError(""); }}
                    style={{ ...iconInputStyle, paddingRight: "40px", borderColor: confirmError ? "#9e4f3b" : "rgba(0,0,0,0.08)" }}
                    placeholder="Re-enter your password"
                    onFocus={focusStyle} onBlur={blurStyle} />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-3 transition" style={{ color: MUTED }}>
                    {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {confirmError && <p className="mt-1 text-xs" style={{ color: "#9e4f3b" }}>{confirmError}</p>}
              </div>
            </SectionCard>

            {/* Business */}
            <SectionCard title="Business Details" icon={Store}>
              <div>
                <Label required>Business / Shop Name</Label>
                <div className="relative">
                  <InputIcon icon={Store} />
                  <input name="shopName" required disabled={loading} value={form.shopName} onChange={handleChange}
                    style={iconInputStyle} placeholder="Your Shop Name" onFocus={focusStyle} onBlur={blurStyle} />
                </div>
              </div>
              <div>
                <Label>GST Number <span className="ml-1 text-xs font-normal normal-case" style={{ color: MUTED }}>(optional)</span></Label>
                <div className="relative">
                  <InputIcon icon={FileText} />
                  <input name="gstNumber" disabled={loading} value={form.gstNumber} onChange={handleChange}
                    style={iconInputStyle} placeholder="22AAAAA0000A1Z5"
                    pattern="[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}"
                    title="Enter a valid 15-character GST number"
                    onFocus={focusStyle} onBlur={blurStyle} />
                </div>
              </div>
            </SectionCard>

            {/* Location */}
            <SectionCard title="Location" icon={MapPin}>
              <div>
                <Label>Village</Label>
                <div className="relative">
                  <InputIcon icon={MapPin} />
                  <input name="village" disabled={loading} value={form.village} onChange={handleChange}
                    style={iconInputStyle} placeholder="Village name" onFocus={focusStyle} onBlur={blurStyle} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[["district","District","District"],["state","State","State"]].map(([name,label,ph]) => (
                  <div key={name}>
                    <Label>{label}</Label>
                    <input name={name} disabled={loading} value={form[name]} onChange={handleChange}
                      style={inputBase} placeholder={ph} onFocus={focusStyle} onBlur={blurStyle} />
                  </div>
                ))}
              </div>
            </SectionCard>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 text-sm font-bold transition-all duration-150 mt-1"
              style={{
                borderRadius: "12px",
                backgroundColor: loading ? "#b0a090" : BRAND,
                color: "#ffffff",
                cursor: loading ? "not-allowed" : "pointer",
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.backgroundColor = BRAND_DK; }}
              onMouseLeave={e => { if (!loading) e.currentTarget.style.backgroundColor = BRAND; }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Creating Account…
                </span>
              ) : "Create Account →"}
            </button>
          </form>

          <p className="mt-5 text-sm text-center" style={{ color: MUTED }}>
            Already have an account?{" "}
            <Link to="/login" className="font-bold transition-all duration-150" style={{ color: BRAND }}
              onMouseEnter={e => e.currentTarget.style.color = BRAND_DK}
              onMouseLeave={e => e.currentTarget.style.color = BRAND}>
              Sign in
            </Link>
          </p>
          <div className="flex items-center justify-center gap-1.5 mt-5">
            <ShieldCheck className="w-3.5 h-3.5" style={{ color: MUTED }} />
            <p className="text-xs" style={{ color: "#b0a090" }}>Secure registration for authorized administrators only</p>
          </div>
        </div>
      </div>

      {/* RIGHT – IMAGE */}
      <div className="relative hidden w-1/2 lg:flex">
        <img
          src="https://images.unsplash.com/photo-1683506684881-efbb5203eacf?fm=jpg&q=60&w=3000"
          alt="Farming"
          className="absolute inset-0 object-cover w-full h-full"
        />
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(58,46,34,0.88) 0%, rgba(90,69,53,0.78) 50%, rgba(58,46,34,0.92) 100%)" }} />
        <div className="relative flex flex-col justify-center px-12 py-16">
          <div className="mb-2">
            <span className="text-xs font-bold tracking-widest uppercase" style={{ color: "#f5edaa" }}>{theme.brand}</span>
          </div>
          <h2 className="text-4xl leading-tight mb-4" style={{ fontWeight: 800, color: "#faf3dc" }}>
            Empowering<br />Farmers Together
          </h2>
          <p className="text-sm leading-relaxed max-w-sm mb-10" style={{ color: "#fae0d8" }}>
            A modern platform built for Retailers & Distributors — manage your entire operation from one place.
          </p>
          <div className="space-y-4">
            {FEATURES.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-xl shrink-0" style={{ backgroundColor: "rgba(255,255,255,0.12)" }}>
                  <Icon className="w-4 h-4" style={{ color: "#f5edaa" }} />
                </div>
                <span className="text-sm" style={{ color: "#fae0d8" }}>{text}</span>
              </div>
            ))}
          </div>
          <div className="mt-12 pt-8" style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}>
            <p className="text-xs" style={{ color: "rgba(245,237,170,0.6)" }}>{theme.brand} · {theme.tagline}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
