import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { sendOtp, verifyOtp } from "../store/thunks/authThunk";
import { Phone, AlertCircle, ArrowRight, ShieldCheck, Globe } from "lucide-react";
import { translateLanguage } from "../components/google-lang-picker/google-language-selector";
import theme from "../config/theme";
import banner from "../../public/Baner.png";

function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, isAuthenticated } = useSelector((s) => s.auth);

  const [mobile, setMobile] = useState("");
  const [formError, setFormError] = useState("");
  const [otp, setOtp] = useState(Array(6).fill(""));
  const [step, setStep] = useState(1);
  const [activeLang, setActiveLang] = useState(
    () => localStorage.getItem("currentLang") || "English"
  );
  const [langOpen, setLangOpen] = useState(false);
  const displayError = formError || error;

  const LANGS = [
    { language: "English", native: "English", flag: "🇬🇧" },
    { language: "Hindi",   native: "हिन्दी",   flag: "🇮🇳" },
    { language: "Marathi", native: "मराठी",   flag: "🇮🇳" },
    { language: "Gujarati",native: "ગુજરાતી", flag: "🇮🇳" },
    { language: "Telugu",  native: "తెలుగు",  flag: "🇮🇳" },
    { language: "Bengali", native: "বাংলা",   flag: "🇮🇳" },
  ];

  const handleLang = (lang) => {
    setActiveLang(lang.language);
    setLangOpen(false);
    translateLanguage(lang.language);
  };

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const handleLogin = async (e) => {
    e.preventDefault();
    const value = mobile.trim();
    if (!value) return setFormError("Enter mobile number");
    if (!/^[6-9][0-9]{9}$/.test(value))
      return setFormError("Enter valid 10-digit mobile number");
    try {
      setFormError("");
      if (step === 1) {
        await dispatch(sendOtp({ mobile: value })).unwrap();
        setStep(2);
      } else {
        const otpValue = otp.join("");
        if (otpValue.length < 6) return setFormError("Enter complete 6-digit OTP");
        await dispatch(verifyOtp({ mobile: value, otp: otpValue })).unwrap();
        navigate("/dashboard");
      }
    } catch (err) {
      setFormError(err || "Something went wrong");
    }
  };

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: "#f8fffe" }}>

      {/* ── LEFT: full image ── */}
      <div className="hidden lg:block lg:w-[58%] h-screen sticky top-0">
        <img
          src={banner}
          alt="banner"
          className="w-full h-full"
          style={{ objectFit: "fill" }}
        />
      </div>

      {/* ── RIGHT: login card ── */}
      <div
        className="flex flex-1 items-center justify-center px-6 py-10"
        style={{ backgroundColor: "#f0fdf8" }}
      >
        <div
          className="w-full max-w-[420px] rounded-3xl p-8 shadow-xl"
          style={{ backgroundColor: "#ffffff", border: "1px solid #d1fae5" }}
        >
          {/* brand header */}
          <div className="flex items-center justify-between mb-7">
            <div className="flex items-center gap-3">
              <div
                className="w-11 h-11 rounded-2xl overflow-hidden shadow-md"
                style={{ backgroundColor: "#ffffff", border: `2px solid ${theme.primary}55` }}
              >
                <img
                  src={theme.logo}
                  alt={theme.shortName}
                  className="w-full h-full object-cover scale-125"
                  style={{ mixBlendMode: "multiply" }}
                />
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: "#0d3d26" }}>
                  {theme.shortName}
                </p>
              </div>
            </div>
          </div>

          {/* language dropdown */}
          <div className="mb-6 relative" translate="no">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 mb-1.5">
              <Globe className="w-3.5 h-3.5" />
              भाषा चुनें / Select Language
            </label>
            <button
              type="button"
              onClick={() => setLangOpen((p) => !p)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all duration-150"
              style={{ border: "1.5px solid #d1fae5", backgroundColor: "#f0fdf4" }}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{LANGS.find((l) => l.language === activeLang)?.flag}</span>
                <span className="text-sm font-semibold" style={{ color: "#0d3d26" }}>
                  {LANGS.find((l) => l.language === activeLang)?.native}
                </span>
                <span className="text-xs text-gray-400">({activeLang})</span>
              </div>
              <svg
                className="w-4 h-4 text-gray-400 transition-transform duration-200"
                style={{ transform: langOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              >
                <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {langOpen && (
              <ul
                className="absolute z-50 w-full mt-1 rounded-2xl overflow-hidden shadow-lg"
                style={{ border: "1.5px solid #d1fae5", backgroundColor: "#fff" }}
              >
                {LANGS.map((lang) => {
                  const isActive = activeLang === lang.language;
                  return (
                    <li
                      key={lang.language}
                      onClick={() => handleLang(lang)}
                      className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors duration-100"
                      style={{
                        backgroundColor: isActive ? "#f0fdf4" : "#fff",
                        borderLeft: isActive ? `3px solid ${theme.primary}` : "3px solid transparent",
                      }}
                      onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = "#f9fafb"; }}
                      onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = "#fff"; }}
                    >
                      <span className="text-xl">{lang.flag}</span>
                      <div className="flex-1">
                        <p className="text-sm font-semibold" style={{ color: "#0d3d26" }}>{lang.native}</p>
                        <p className="text-xs text-gray-400">{lang.language}</p>
                      </div>
                      {isActive && (
                        <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                          <path d="M3 8l3.5 3.5 6.5-7" stroke={theme.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* heading */}
          <div className="mb-6">
            <h1 className="text-4xl font-extrabold mb-2" style={{ color: "#0d3d26" }}>
              {step === 1 ? "Welcome back" : "Verify your number"}
            </h1>
            <p className="text-base text-gray-400">
              {step === 1
                ? "Sign in to your retailer dashboard"
                : `OTP sent to +91 ${mobile} — check your SMS`}
            </p>
          </div>

          {/* step pills */}
          <div className="flex items-center gap-3 mb-6">
            {["Mobile", "OTP"].map((label, idx) => {
              const s = idx + 1;
              const active = step >= s;
              return (
                <div key={s} className="flex items-center gap-2">
                  <div
                    className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all duration-300"
                    style={{
                      backgroundColor: active ? theme.primary + "20" : "#f3f4f6",
                      color: active ? theme.primaryDark : "#9ca3af",
                      border: `1px solid ${active ? theme.primary + "50" : "transparent"}`,
                    }}
                  >
                    <span
                      className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold"
                      style={{
                        backgroundColor: active ? theme.primary : "#e5e7eb",
                        color: active ? "#fff" : "#9ca3af",
                      }}
                    >
                      {s}
                    </span>
                    {label}
                  </div>
                  {idx === 0 && (
                    <div
                      className="w-6 h-px"
                      style={{ backgroundColor: step === 2 ? theme.primary : "#e5e7eb" }}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* error */}
          {displayError && (
            <div
              className="flex items-start gap-2.5 p-3 mb-5 rounded-xl"
              style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca" }}
            >
              <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-red-500">{displayError}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">

            {/* mobile */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                Mobile Number
              </label>
              <div
                className="flex overflow-hidden rounded-2xl transition-all duration-200"
                style={{ border: "1.5px solid #d1fae5", backgroundColor: "#fff" }}
                onFocus={() => {}}
              >
                <div
                  className="flex items-center gap-1.5 px-3 text-xs font-bold select-none"
                  style={{
                    backgroundColor: "#f0fdf4",
                    borderRight: "1.5px solid #d1fae5",
                    color: "#166534",
                    minWidth: 56,
                  }}
                >
                  <Phone className="w-3.5 h-3.5" />
                  +91
                </div>
                <input
                  type="tel"
                  placeholder="98765 43210"
                  value={mobile}
                  maxLength={10}
                  disabled={step === 2}
                  onChange={(e) => {
                    setMobile(e.target.value.replace(/\D/g, ""));
                    setFormError("");
                  }}
                  className="flex-1 px-3 py-3 text-sm outline-none bg-transparent text-gray-800 placeholder-gray-300 disabled:text-gray-400"
                />
                <span className="flex items-center pr-3 text-xs text-gray-300 select-none">
                  {mobile.length}/10
                </span>
              </div>
            </div>

            {/* OTP */}
            {step === 2 && (
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-2">
                  Enter 6-digit OTP
                </label>
                <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(6, 1fr)" }}>
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      id={`otp-${i}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "");
                        if (!val) return;
                        const next = [...otp];
                        next[i] = val.slice(-1);
                        setOtp(next);
                        setFormError("");
                        if (i < 5) document.getElementById(`otp-${i + 1}`)?.focus();
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Backspace") {
                          const next = [...otp];
                          if (next[i]) { next[i] = ""; setOtp(next); }
                          else if (i > 0) document.getElementById(`otp-${i - 1}`)?.focus();
                        }
                      }}
                      onPaste={(e) => {
                        e.preventDefault();
                        const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
                        const next = Array(6).fill("");
                        pasted.split("").forEach((c, idx) => { next[idx] = c; });
                        setOtp(next);
                        document.getElementById(`otp-${Math.min(pasted.length, 5)}`)?.focus();
                      }}
                      className="w-full h-11 text-center text-base font-bold outline-none rounded-xl border-2 transition-all duration-150 bg-white text-gray-800"
                      style={{ borderColor: digit ? theme.primary : "#e5e7eb" }}
                      onFocus={(e) => (e.currentTarget.style.borderColor = theme.primary)}
                      onBlur={(e) => (e.currentTarget.style.borderColor = digit ? theme.primary : "#e5e7eb")}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => { setStep(1); setOtp(Array(6).fill("")); setFormError(""); }}
                  className="mt-2.5 text-xs font-semibold transition-colors"
                  style={{ color: theme.primary }}
                >
                  ← Change number
                </button>
              </div>
            )}

            {/* submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 text-sm font-bold text-white rounded-2xl transition-all duration-200 active:scale-[0.98] mt-2"
              style={{
                backgroundColor: loading ? "#9ca3af" : theme.primary,
                boxShadow: loading ? "none" : `0 6px 24px ${theme.primary}44`,
              }}
              onMouseEnter={(e) => { if (!loading) e.currentTarget.style.backgroundColor = theme.primaryDark; }}
              onMouseLeave={(e) => { if (!loading) e.currentTarget.style.backgroundColor = theme.primary; }}
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Processing...
                </>
              ) : (
                <>
                  {step === 1 ? "Send OTP" : "Verify & Sign In"}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs text-gray-300">or</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          {/* register */}
          <p className="text-sm text-center text-gray-400">
            Don't have an account?{" "}
            <span
              onClick={() => navigate("/register")}
              className="font-bold cursor-pointer transition-colors"
              style={{ color: theme.primary }}
              onMouseEnter={(e) => (e.currentTarget.style.color = theme.primaryDark)}
              onMouseLeave={(e) => (e.currentTarget.style.color = theme.primary)}
            >
              Create one
            </span>
          </p>

          {/* secure badge */}
          <div className="flex items-center justify-center gap-1.5 mt-6 text-xs text-gray-300">
            <ShieldCheck className="w-3.5 h-3.5" />
            Authorized administrators only
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
