import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../lib/api';

export const fetchAssignedTasks = createAsyncThunk('tasks/assigned', async (_, { rejectWithValue }) => {
  try { const res = await api.get('/tasks/assigned'); return res.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed to fetch tasks'); }
});

export const fetchTaskStats = createAsyncThunk('tasks/stats', async (_, { rejectWithValue }) => {
  try { const res = await api.post('/tasks/stats'); return res.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed to fetch stats'); }
});

export const createTask = createAsyncThunk('tasks/create', async (data, { rejectWithValue }) => {
  try { const res = await api.post('/tasks/create', data); return res.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed to create task'); }
});

export const createBatchTasks = createAsyncThunk('tasks/batch', async (data, { rejectWithValue }) => {
  try { const res = await api.post('/tasks/batch', data); return res.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed to create tasks'); }
});

export const updateTask = createAsyncThunk('tasks/update', async ({ taskId, data }, { rejectWithValue }) => {
  try { const res = await api.put(`/tasks/${taskId}`, data); return res.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed to update task'); }
});

export const deleteTask = createAsyncThunk('tasks/delete', async (taskId, { rejectWithValue }) => {
  try { await api.delete(`/tasks/${taskId}`); return taskId; }
  catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed to delete task'); }
});

export const fetchTaskById = createAsyncThunk('tasks/detail', async (taskId, { rejectWithValue }) => {
  try { const res = await api.get(`/tasks/${taskId}`); return res.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed to fetch task'); }
});

export const startTask = createAsyncThunk('tasks/start', async (taskId, { rejectWithValue }) => {
  try { const res = await api.put(`/tasks/${taskId}/start`); return res.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed'); }
});

export const completeTask = createAsyncThunk('tasks/complete', async (taskId, { rejectWithValue }) => {
  try { const res = await api.put(`/tasks/${taskId}/complete`); return res.data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed'); }
});
