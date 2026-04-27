import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../lib/api';

export const fetchOrders = createAsyncThunk(
  'procurement/fetchOrders',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/purchase/getPurchases');
      return res.data.data;
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
      const res = await api.post('/purchase/addPurchase', payload);
      return res.data.data;
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
      // If only status is being updated, send minimal payload
      if (Object.keys(data).length === 1 && data.status) {
        const res = await api.put(`/purchase/updatePurchase/${id}`, { status: data.status });
        return res.data?.data ?? res.data;
      }

      let purchaseId = data.purchaseId;
      if (!purchaseId) {
        try {
          const getRes = await api.get(`/purchase/getPurchaseById/${id}`);
          const existingOrder = getRes.data?.data ?? getRes.data;
          purchaseId = existingOrder?.purchaseId;
        } catch (getErr) {}
      }

      const payload = {
        ...(purchaseId && { purchaseId }),
        farmer: data.farmer,
        crop: data.crop,
        rate: Number(data.rate),
        quantity: Number(data.quantity),
        procurementDate: data.procurementDate,
        procurementCenter: data.procurementCenter,
        godown: data.godown ?? '',
        vehicle: data.vehicle ?? '',
        remarks: data.remarks ?? '',
        status: data.status || 'pending',
      };

      const res = await api.put(`/purchase/updatePurchase/${id}`, payload);
      return res.data?.data ?? res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'Failed to update order'
      );
    }
  }
);
