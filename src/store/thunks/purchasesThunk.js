// src/store/thunks/purchasesThunk.js
import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../lib/api';

export const fetchPurchases = createAsyncThunk(
  'purchases/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/order/allOrders');
      const payload = res.data?.data ?? res.data;
      return Array.isArray(payload) ? payload : [];
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'Failed to fetch orders'
      );
    }
  }
);

export const createPurchase = createAsyncThunk(
  'purchases/create',
  async (payload, { rejectWithValue }) => {
    try {
      const res = await api.post('/order/place', payload);
      return res.data?.data ?? res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'Failed to place order'
      );
    }
  }
);
