import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../lib/api';

export const addInquiry = createAsyncThunk(
  'inquiry/add',
  async (data, { rejectWithValue }) => {
    try {
      const res = await api.post('/inquiry/add', data);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to add inquiry');
    }
  }
);

export const fetchAllInquiries = createAsyncThunk(
  'inquiry/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/inquiry/all');
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch inquiries');
    }
  }
);

export const fetchMyInquiries = createAsyncThunk(
  'inquiry/fetchMy',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/inquiry/my-inquiries');
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch inquiries');
    }
  }
);

export const fetchInquiryById = createAsyncThunk(
  'inquiry/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      const res = await api.get(`/inquiry/${id}`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch inquiry');
    }
  }
);
