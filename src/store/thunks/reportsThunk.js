import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../lib/api';

/* ================= MONTHLY INVENTORY REPORT ================= */
export const fetchReports = createAsyncThunk(
  'reports/fetchInventoryMonthly',
  async (year = new Date().getFullYear(), { rejectWithValue }) => {
    try {
      const res = await api.get(`/reports/inventory/monthly?year=${year}`);
      return res.data?.data ?? res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'Failed to load reports'
      );
    }
  }
);

/* ================= CUSTOMERS ================= */
export const fetchCustomers = createAsyncThunk(
  'reports/fetchCustomers',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/user/getAllUsers');
      return res.data.data;
    } catch (err) {
      return rejectWithValue('Failed to fetch customers');
    }
  }
);

/* ================= PRIVATE FILES ================= */
export const fetchPrivateFiles = createAsyncThunk(
  'reports/fetchPrivateFiles',
  async ({ customerId, type }, { rejectWithValue }) => {
    try {
      const res = await api.get(
        `/admin/files/private?type=${type}&userId=${customerId}`
      );

      return {
        customerId,
        type,
        files: res.data.files || [],
      };
    } catch (err) {
      return rejectWithValue('Failed to fetch files');
    }
  }
);
