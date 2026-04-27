import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../lib/api';

// GET /product/getProducts
export const fetchProducts = createAsyncThunk(
  'inventory/fetchProducts',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/product/getProducts');
      const products = res.data.data;
      return products;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch products');
    }
  }
);

// GET /inventory/stocks  — current stock levels per product
export const fetchStockSummary = createAsyncThunk(
  'inventory/fetchStockSummary',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/inventory/stocks');
      const payload = res.data?.data ?? res.data?.stocks ?? res.data ?? [];
      return Array.isArray(payload) ? payload : [];
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch stock summary');
    }
  }
);

// POST /product/addProduct
export const addProduct = createAsyncThunk(
  'inventory/addProduct',
  async (data, { rejectWithValue }) => {
    try {
      const res = await api.post('/product/addProduct', data);
      console.log('addProduct success:', res.data);
      return res.data.data ?? res.data;
    } catch (err) {
      console.log('addProduct error full:', err.response?.data);
      return rejectWithValue(err.response?.data?.message || 'Failed to add product');
    }
  }
);

// PUT /product/updateProduct/:id
export const updateProduct = createAsyncThunk(
  'inventory/updateProduct',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await api.put(`/product/updateProduct/${id}`, data);
      return res.data.data ?? res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update product');
    }
  }
);

// PUT /product/updateProduct/:id — toggle active status
export const toggleProductStatus = createAsyncThunk(
  'inventory/toggleProductStatus',
  async ({ id, isActive }, { rejectWithValue }) => {
    try {
      await api.put(`/product/updateProduct/${id}`, { isActive });
      return { id, isActive };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update status');
    }
  }
);

// DELETE /product/deleteProduct/:id
export const deleteProduct = createAsyncThunk(
  'inventory/deleteProduct',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/product/deleteProduct/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to delete product');
    }
  }
);

// DELETE /inventory/stock/:itemId
export const deleteStockItem = createAsyncThunk(
  'inventory/deleteStock',
  async (itemId, { rejectWithValue }) => {
    try {
      await api.delete(`/inventory/stock/${itemId}`);
      return itemId;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to delete stock item');
    }
  }
);
