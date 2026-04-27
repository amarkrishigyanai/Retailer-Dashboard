import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../lib/api';

export const checkIn = createAsyncThunk('attendance/checkIn', async (data, { rejectWithValue }) => {
  try { const res = await api.post('/attendance/check-in', data); return res.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || 'Check-in failed'); }
});

export const checkOut = createAsyncThunk('attendance/checkOut', async (data, { rejectWithValue }) => {
  try { const res = await api.post('/attendance/check-out', data); return res.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || 'Check-out failed'); }
});

export const fetchTodayAttendance = createAsyncThunk('attendance/today', async (_, { rejectWithValue }) => {
  try { const res = await api.get('/attendance/today'); return res.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed to fetch today'); }
});

export const fetchMyAttendance = createAsyncThunk('attendance/my', async (_, { rejectWithValue }) => {
  try { const res = await api.get('/attendance/my-attendance'); return res.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed to fetch my attendance'); }
});

export const applyLeave = createAsyncThunk('attendance/applyLeave', async (data, { rejectWithValue }) => {
  try { const res = await api.post('/attendance/apply-leave', data); return res.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed to apply leave'); }
});

export const fetchAllStaffAttendance = createAsyncThunk('attendance/all', async (_, { rejectWithValue }) => {
  try { const res = await api.get('/attendance/all'); return res.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed to fetch all attendance'); }
});

export const fetchStaffAttendanceById = createAsyncThunk('attendance/byStaff', async (staffId, { rejectWithValue }) => {
  try { const res = await api.get(`/attendance/staff/${staffId}`); return res.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed to fetch staff attendance'); }
});
