import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../lib/api';

// Normalize backend shape (farmer → customer, single crop → crops[])
const normalize = (o) => ({
  ...o,
  customer: o.farmer ?? o.customer,
  crops: o.crops?.length
    ? o.crops
    : [{ cropName: o.crop ?? '', variety: o.variety ?? '', rate: o.rate ?? 0, quantity: o.quantity ?? 0, unit: o.unit ?? 'qtl' }],
  totalAmount: o.totalAmount ?? (Number(o.rate ?? 0) * Number(o.quantity ?? 0)),
});

export const fetchOrders = createAsyncThunk(
  'procurement/fetchOrders',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/purchase/getPurchases');
      const data = res.data.data ?? res.data ?? [];
      return (Array.isArray(data) ? data : []).map(normalize);
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'Failed to fetch orders'
      );
    }
  }
);

export const createOrder = createAsyncThunk(
  'procurement/createOrder',
  async (payload, { rejectWithValue }) => {
    try {
      // API expects single-crop fields: farmer, crop, rate, quantity
      const firstCrop = payload.crops?.[0] ?? {};
      const body = {
        farmer: payload.customer,
        crop: firstCrop.cropName,
        variety: firstCrop.variety,
        rate: Number(firstCrop.rate),
        quantity: Number(firstCrop.quantity),
        unit: firstCrop.unit ?? 'qtl',
        procurementDate: payload.procurementDate,
        procurementCenter: payload.procurementCenter,
        godown: payload.godown ?? '',
        vehicle: payload.vehicle ?? '',
        remarks: payload.remarks ?? '',
        previousDues: payload.previousDues ?? 0,
        status: 'pending',
        // send full crops array too in case backend supports it
        crops: payload.crops,
      };
      const res = await api.post('/purchase/addPurchase', body);
      return normalize(res.data.data ?? res.data);
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'Failed to create order'
      );
    }
  }
);

export const deleteOrder = createAsyncThunk(
  'procurement/deleteOrder',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/purchase/deletePurchase/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'Failed to delete order'
      );
    }
  }
);

export const updateOrder = createAsyncThunk(
  'procurement/updateOrder',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      if (Object.keys(data).length === 1 && data.status) {
        const res = await api.put(`/purchase/updatePurchase/${id}`, { status: data.status });
        return normalize(res.data?.data ?? res.data);
      }

      const firstCrop = data.crops?.[0] ?? {};
      const payload = {
        farmer: data.customer,
        crop: firstCrop.cropName,
        variety: firstCrop.variety,
        rate: Number(firstCrop.rate),
        quantity: Number(firstCrop.quantity),
        unit: firstCrop.unit ?? 'qtl',
        crops: data.crops,
        procurementDate: data.procurementDate,
        procurementCenter: data.procurementCenter,
        godown: data.godown ?? '',
        vehicle: data.vehicle ?? '',
        remarks: data.remarks ?? '',
        previousDues: data.previousDues ?? 0,
        status: data.status || 'pending',
      };

      const res = await api.put(`/purchase/updatePurchase/${id}`, payload);
      return normalize(res.data?.data ?? res.data);
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'Failed to update order'
      );
    }
  }
);
