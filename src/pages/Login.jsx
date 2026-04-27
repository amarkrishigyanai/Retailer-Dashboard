import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { sendOtp, verifyOtp } from "../store/thunks/authThunk";
import { Lock, Phone, AlertCircle } from "lucide-react";
import theme from "../config/theme";

function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { loading, error, isAuthenticated } = useSelector((state) => state.auth);

  const [mobile, setMobile] = useState("");
  const [formError, setFormError] = useState("");
  const [otp, setOtp] = useState(Array(6).fill(""));
  const [step, setStep] = useState(1);
  const displayError = formError || error;

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const handleLogin = async (e) => {
    e.preventDefault();
    const value = mobile.trim();
    if (!value) return setFormError("Enter mobile number");
    if (!/^[6-9][0-9]{9}$/.test(value)) return setFormError("Enter valid mobile number");
    try {
      setFormError("");
      if (step === 1) {
        await dispatch(sendOtp({ mobile: value })).unwrap();
        setStep(2);
      } else {
        const otpValue = otp.join("");
        if (otpValue.length < 6) return setFormError("Enter 6-digit OTP");
        await dispatch(verifyOtp({ mobile: value, otp: otpValue })).unwrap();
        navigate("/dashboard");
      }
    } catch (err) {
      setFormError(err || "Something went wrong");
    }
  };

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: "#fef9e7" }}>
      {/* LEFT – IMAGE */}
      <div className="relative hidden w-1/2 lg:flex">
        <img
          src="https://images.unsplash.com/photo-1683506684881-efbb5203eacf?fm=jpg&q=60&w=3000"
          alt="Farming"
          className="absolute inset-0 object-cover w-full h-full"
        />
        <div className="absolute inset-0 flex items-center justify-center px-10" style={{ backgroundColor: "rgba(58,46,34,0.72)" }}>
          <div className="max-w-md">
            <h2 className="mb-4 text-3xl" style={{ fontWeight: 800, color: "#faf3dc" }}>Empowering Farmers</h2>
            <p className="text-sm leading-relaxed" style={{ color: "#fae0d8" }}>
              Modern technology meets traditional farming. Manage your Farmer Producer Organization with ease and efficiency.
            </p>
          </div>
        </div>
      </div>

      {/* RIGHT – FORM */}
      <div className="flex items-center justify-center w-full px-6 lg:w-1/2">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <div className="flex items-center justify-center w-12 h-12 mb-4 rounded-2xl" style={{ backgroundColor: "#e8907a" }}>
              <Lock className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl" style={{ fontWeight: 800, color: "#3b2e22" }}>{theme.brand}</h1>
            <p className="text-sm" style={{ color: "#7a6558" }}>{theme.tagline}</p>
          </div>

          {displayError && (
            <div className="flex gap-2 p-3 mb-4 rounded-xl" style={{ backgroundColor: "#fae0d8", border: "1px solid #f5c0b0" }}>
              <AlertCircle className="w-5 h-5 flex-shrink-0" style={{ color: "#9e4f3b" }} />
              <p className="text-sm" style={{ color: "#9e4f3b" }}>{displayError}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block mb-1 text-sm font-semibold" style={{ color: "#5a4535" }}>Mobile Number</label>
              <div className="flex overflow-hidden transition-all duration-150" style={{ borderRadius: "14px", border: "1px solid rgba(0,0,0,0.1)" }}>
                <div className="flex items-center gap-1.5 px-3 text-sm font-semibold select-none" style={{ backgroundColor: "#fae0d8", borderRight: "1px solid rgba(0,0,0,0.08)", color: "#5a4535" }}>
                  <Phone className="w-4 h-4" />
                  +91
                </div>
                <input
                  type="tel"
                  placeholder="98765 43210"
                  value={mobile}
                  maxLength={10}
                  onChange={(e) => { setMobile(e.target.value.replace(/\D/g, "")); setFormError(""); }}
                  className="flex-1 px-3 py-2.5 text-sm outline-none"
                  style={{ backgroundColor: "#ffffff", color: "#3b2e22" }}
                />
                <div className="flex items-center pr-3 text-xs select-none" style={{ color: "#b0a090" }}>{mobile.length}/10</div>
              </div>
            </div>

            {step === 2 && (
              <div>
                <label className="block mb-2 text-sm font-semibold" style={{ color: "#5a4535" }}>Enter OTP</label>
                <div className="flex gap-2 justify-between">
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
                          else if (i > 0) { document.getElementById(`otp-${i - 1}`)?.focus(); }
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
                      className="w-11 h-12 text-center text-lg font-bold outline-none transition-all duration-150"
                      style={{ borderRadius: "12px", border: "1.5px solid rgba(0,0,0,0.1)", color: "#3b2e22", backgroundColor: "#ffffff" }}
                      onFocus={e => e.currentTarget.style.borderColor = "#e8907a"}
                      onBlur={e => e.currentTarget.style.borderColor = "rgba(0,0,0,0.1)"}
                    />
                  ))}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 text-sm font-bold text-white transition-all duration-150"
              style={{
                borderRadius: "12px",
                backgroundColor: loading ? "#b0a090" : "#e8907a",
                cursor: loading ? "not-allowed" : "pointer",
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.backgroundColor = "#d97b63"; }}
              onMouseLeave={e => { if (!loading) e.currentTarget.style.backgroundColor = "#e8907a"; }}
            >
              {loading ? "Processing..." : step === 1 ? "Send OTP" : "Verify OTP"}
            </button>
          </form>

          <p className="mt-4 text-sm text-center" style={{ color: "#7a6558" }}>
            Don't have an account?{" "}
            <span
              onClick={() => navigate("/register")}
              className="font-bold cursor-pointer transition-all duration-150"
              style={{ color: "#e8907a" }}
              onMouseEnter={e => e.currentTarget.style.color = "#d97b63"}
              onMouseLeave={e => e.currentTarget.style.color = "#e8907a"}
            >
              Create one
            </span>
          </p>
          <p className="mt-4 text-xs text-center" style={{ color: "#b0a090" }}>
            Secure login for authorized administrators only
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
