// store/thunks/layoutThunk.js
import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../lib/api';

export const fetchMe = createAsyncThunk(
  'layout/fetchMe',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/user/getUserDetails');

      // API shape: { success, data }
      return res.data?.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'Failed to load user'
      );
    }
  }
);
