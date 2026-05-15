import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../lib/api';

export const fetchMembers = createAsyncThunk(
  'members/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/user/getAllUsers');
      return Array.isArray(res.data.data) ? res.data.data : res.data.users ?? res.data ?? [];
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'Failed to fetch members'
      );
    }
  }
);

export const updateMember = createAsyncThunk(
  'members/update',
  async ({ id, data }, { rejectWithValue }) => {
    return rejectWithValue('Admin update endpoint not available. Contact backend developer to add PUT /admin/update-user/:id');
  }
);

export const updateKyc = createAsyncThunk(
  'members/updateKyc',
  async ({ id, kycStatus }, { rejectWithValue }) => {
    return rejectWithValue('Admin KYC update endpoint not available. Contact backend developer to add PUT /admin/update-user/:id');
  }
);

export const fetchMemberDocs = createAsyncThunk(
  'members/fetchDocs',
  async ({ type, userId }, { rejectWithValue }) => {
    try {
      const res = await api.get(`/admin/files/private?type=${type}&userId=${userId}`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch documents');
    }
  }
);

export const fetchMemberCrops = createAsyncThunk(
  'members/fetchCrops',
  async (userId, { rejectWithValue }) => {
    try {
      const res = await api.get(`/crop/getCropsByUser`, { params: { userId } });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch crops');
    }
  }
);

export const fetchMemberListings = createAsyncThunk(
  'members/fetchListings',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get(`/crop-listing/getListings`);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch listings');
    }
  }
);

export const fetchMemberPurchases = createAsyncThunk(
  'members/fetchPurchases',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get(`/purchase/getPurchases`);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch purchases');
    }
  }
);
export const createStaff = createAsyncThunk(
  'members/createStaff',
  async (data, { rejectWithValue }) => {
    try {
      const res = await api.post('/admin/create-staff', data);
      return res.data.data ?? res.data.user ?? res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'Failed to create staff'
      );
    }
  }
);

export const createCustomer = createAsyncThunk(
  'members/createCustomer',
  async (data, { rejectWithValue }) => {
    try {
      const res = await api.post('/user/register', data);
      return res.data.user ?? res.data.data ?? res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'Failed to create customer'
      );
    }
  }
);

export const deleteMember = createAsyncThunk(
  'members/delete',
  async (id, { rejectWithValue }) => {
    return rejectWithValue('Delete user endpoint not available in API. Contact backend developer.');
  }
);
