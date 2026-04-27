import { createSlice } from "@reduxjs/toolkit";
import { sendOtp, verifyOtp } from "../thunks/authThunk";
import { getToken, setToken, clearToken } from "../../lib/tokenStorage";

// ✅ SAFE JSON PARSER
const safeParse = (key) => {
  try {
    const value = localStorage.getItem(key);
    if (!value || value === "undefined") return null;
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const rawToken = getToken();
const validToken = rawToken && rawToken !== "undefined" ? rawToken : null;

const initialState = {
  token: validToken,
  user: safeParse("user"),
  profile: safeParse("profile"),
  isAuthenticated: !!validToken,
  loading: false,
  error: null,
  otpSent: false, // ✅ REQUIRED
};

const authSlice = createSlice({
  name: "auth",
  initialState,

  reducers: {
    logout: (state) => {
      state.user = null;
      state.profile = null;
      state.token = null;
      state.isAuthenticated = false;
      state.otpSent = false; // ✅ add this
      clearToken();
      localStorage.removeItem("user");
      localStorage.removeItem("profile");
    },

    clearAuthState: (state) => {
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    builder

      /**
       * =========================
       * SEND OTP
       * =========================
       */
      .addCase(sendOtp.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(sendOtp.fulfilled, (state) => {
        state.loading = false;
        state.otpSent = true; // move to OTP screen
      })

      .addCase(sendOtp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to send OTP";
      })

      /**
       * =========================
       * VERIFY OTP (LOGIN)
       * =========================
       */
      .addCase(verifyOtp.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(verifyOtp.fulfilled, (state, action) => {
        const { token, user, profile } = action.payload;

        if (!token) {
          state.loading = false;
          state.error = "Login failed: no token received";
          return;
        }

        // ✅ Save to state
        state.loading = false;
        state.token = token;
        state.user = user;
        state.profile = profile;
        state.isAuthenticated = true;
        state.otpSent = false;

        // ✅ Persist data
        setToken(token);
        localStorage.setItem("user", JSON.stringify(user ?? null));
        localStorage.setItem("profile", JSON.stringify(profile ?? null));
      })

      .addCase(verifyOtp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "OTP verification failed";
      });
  },
});

export const { logout, clearAuthState } = authSlice.actions;
export default authSlice.reducer;
