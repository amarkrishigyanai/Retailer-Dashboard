import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../lib/api';

/* ================= PURCHASE REPORTS ================= */
export const fetchReports = createAsyncThunk(
  'reports/fetchPurchases',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('purchase/getPurchases');
      return res.data.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'Failed to load reports'
      );
    }
  }
);

/* ================= FARMERS ================= */
export const fetchFarmers = createAsyncThunk(
  'reports/fetchFarmers',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/user/getAllFarmers');
      return res.data.data;
    } catch (err) {
      return rejectWithValue('Failed to fetch farmers');
    }
  }
);

/* ================= PRIVATE FILES ================= */
export const fetchPrivateFiles = createAsyncThunk(
  'reports/fetchPrivateFiles',
  async ({ farmerId, type }, { rejectWithValue }) => {
    try {
      const res = await api.get(
        `/admin/files/private?type=${type}&userId=${farmerId}`
      );

      return {
        farmerId,
        type,
        files: res.data.files || [],
      };
    } catch (err) {
      return rejectWithValue('Failed to fetch files');
    }
  }
);
