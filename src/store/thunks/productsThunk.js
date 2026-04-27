import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../lib/api';

export const fetchProducts = createAsyncThunk(
  'products/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/product/getProducts');
      return res.data?.data || [];
    } catch (err) {
      return rejectWithValue('Failed to fetch products');
    }
  }
);

export const deleteListing = createAsyncThunk(
  'products/delete',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/product/deleteProduct/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to delete product');
    }
  }
);

export const updateListing = createAsyncThunk(
  'products/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await api.put(`/product/updateProduct/${id}`, data);
      return res.data?.data ?? res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update product');
    }
  }
);

export const approveListing = createAsyncThunk(
  'products/approve',
  async (id, { rejectWithValue }) => {
    try {
      const res = await api.put(`/product/toggleProductStatus/${id}`);
      return res.data?.data ?? { _id: id, status: 'active' };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to toggle product status');
    }
  }
);

export const rejectListing = createAsyncThunk(
  'products/reject',
  async (id, { rejectWithValue }) => {
    try {
      const res = await api.put(`/product/toggleProductStatus/${id}`);
      return res.data?.data ?? { _id: id, status: 'inactive' };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to toggle product status');
    }
  }
);
