import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../lib/api';

const extractEntries = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.ledgers)) return data.ledgers;
  if (Array.isArray(data?.result)) return data.result;
  if (Array.isArray(data?.entries)) return data.entries;
  return [];
};

export const fetchAllLedgers = createAsyncThunk(
  'ledger/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('ledger/');
      return extractEntries(res.data);
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch ledgers');
    }
  }
);

export const fetchPaymentBalance = createAsyncThunk(
  'ledger/paymentBalance',
  async (farmerId, { rejectWithValue }) => {
    try {
      const res = await api.get(`payment/balance/${farmerId}`);
      // normalize any response shape into a plain number
      const d = res.data;
      const raw = d?.balance ?? d?.amount ?? d?.netBalance ?? d?.data?.balance ?? d?.data?.amount ?? null;
      return { balance: raw !== null ? Number(raw) : null };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch balance');
    }
  }
);

export const recordFarmerPayment = createAsyncThunk(
  'ledger/farmerPayment',
  async ({ farmerId, amount, paymentMethod }, { rejectWithValue }) => {
    try {
      const res = await api.post('payment/farmer-payment', { farmerId, amount, paymentMethod });
      return res.data;
    } catch (err) {
      // If backend returns HTML (route not implemented), show a clear message
      const contentType = err.response?.headers?.['content-type'] || '';
      if (contentType.includes('text/html')) {
        return rejectWithValue('Payment route not available on server. Contact backend developer.');
      }
      const msg = err.response?.data?.message
        || err.response?.data?.error
        || err.response?.data
        || err.message
        || 'Payment failed';
      console.error('recordFarmerPayment error:', err.response?.status, err.response?.data);
      return rejectWithValue(typeof msg === 'string' ? msg : JSON.stringify(msg));
    }
  }
);

export const recordFpoPayment = createAsyncThunk(
  'ledger/retailerPayment',
  async ({ farmerId, amount, paymentMethod }, { rejectWithValue }) => {
    try {
      const res = await api.post('payment/fpo-payment', { farmerId, amount, paymentMethod });
      return res.data;
    } catch (err) {
      // If backend returns HTML (route not implemented), show a clear message
      const contentType = err.response?.headers?.['content-type'] || '';
      if (contentType.includes('text/html')) {
        return rejectWithValue('Payment route not available on server. Contact backend developer.');
      }
      const msg = err.response?.data?.message
        || err.response?.data?.error
        || err.response?.data
        || err.message
        || 'Payment failed';
      console.error('recordRetailerPayment error:', err.response?.status, err.response?.data);
      return rejectWithValue(typeof msg === 'string' ? msg : JSON.stringify(msg));
    }
  }
);

export const fetchLedgerByType = createAsyncThunk(
  'ledger/fetchByType',
  async (type, { rejectWithValue }) => {
    try {
      const res = await api.get(`ledger/reference/${type}`);
      return extractEntries(res.data);
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch ledger');
    }
  }
);
