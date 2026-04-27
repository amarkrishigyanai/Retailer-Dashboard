import { createSlice } from '@reduxjs/toolkit';
import { fetchAssignedTasks, fetchTaskStats, createTask, createBatchTasks, updateTask, deleteTask, fetchTaskById } from '../thunks/taskThunk';

const extract = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.tasks)) return payload.tasks;
  return [];
};

const taskSlice = createSlice({
  name: 'tasks',
  initialState: {
    tasks: [],
    stats: null,
    detail: null,
    loading: false,
    actionLoading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => { state.error = null; },
    clearDetail: (state) => { state.detail = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAssignedTasks.pending,   (state) => { state.loading = true; state.error = null; })
      .addCase(fetchAssignedTasks.fulfilled, (state, a) => { state.loading = false; state.tasks = extract(a.payload); })
      .addCase(fetchAssignedTasks.rejected,  (state, a) => { state.loading = false; state.error = a.payload; })

      .addCase(fetchTaskStats.fulfilled, (state, a) => { state.stats = a.payload?.data || a.payload; })

      .addCase(createTask.pending,   (state) => { state.actionLoading = true; state.error = null; })
      .addCase(createTask.fulfilled, (state, a) => {
        state.actionLoading = false;
        const t = a.payload?.data || a.payload;
        if (t?._id) state.tasks.unshift(t);
      })
      .addCase(createTask.rejected,  (state, a) => { state.actionLoading = false; state.error = a.payload; })

      .addCase(createBatchTasks.pending,   (state) => { state.actionLoading = true; state.error = null; })
      .addCase(createBatchTasks.fulfilled, (state, a) => {
        state.actionLoading = false;
        const created = extract(a.payload);
        state.tasks.unshift(...created);
      })
      .addCase(createBatchTasks.rejected,  (state, a) => { state.actionLoading = false; state.error = a.payload; })

      .addCase(updateTask.pending,   (state) => { state.actionLoading = true; state.error = null; })
      .addCase(updateTask.fulfilled, (state, a) => {
        state.actionLoading = false;
        const t = a.payload?.data || a.payload;
        const idx = state.tasks.findIndex((x) => x._id === t?._id);
        if (idx !== -1) state.tasks[idx] = t;
      })
      .addCase(updateTask.rejected,  (state, a) => { state.actionLoading = false; state.error = a.payload; })

      .addCase(deleteTask.fulfilled, (state, a) => { state.tasks = state.tasks.filter((t) => t._id !== a.payload); })

      .addCase(fetchTaskById.fulfilled, (state, a) => { state.detail = a.payload?.data || a.payload; });
  },
});

export const { clearError, clearDetail } = taskSlice.actions;
export default taskSlice.reducer;
