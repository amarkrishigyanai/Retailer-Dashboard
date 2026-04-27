import { createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../lib/api";
import theme from "../../config/theme";

/**
 * =========================
 * LOGIN (Email OR Phone)
 * =========================
 */
export const sendOtp = createAsyncThunk(
  "auth/sendOtp",
  async ({ mobile }, { rejectWithValue }) => {
    try {
      if (!mobile) {
        return rejectWithValue("Mobile is required");
      }

      const res = await api.post("/otp/send-otp", {
        mobile,
        role: theme.defaultRole, // or "FPO"
      });

      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to send OTP",
      );
    }
  },
);

export const verifyOtp = createAsyncThunk(
  "auth/verifyOtp",
  async ({ mobile, otp }, { rejectWithValue }) => {
    try {
      const res = await api.post("/otp/verify-otp", {
        mobile,
        otp,
        role: theme.defaultRole,
      });

      console.log("FULL RESPONSE:", res);
      console.log("DATA ONLY:", res.data);
      console.log("TOKEN:", res.data?.token);

      return {
        token: res.data.token, // ✅ correct
        user: {
          ...res.data.data, // ✅ FIXED (was res.data.user ❌)
          role: res.data.data?.role?.toLowerCase() || "fpo",
        },
        profile: null, // no profile in response
      };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Invalid OTP");
    }
  },
);
