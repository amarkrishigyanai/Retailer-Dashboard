import { createSlice } from '@reduxjs/toolkit';
import {
  checkIn, checkOut, fetchTodayAttendance, fetchMyAttendance,
  applyLeave, fetchAllStaffAttendance, fetchStaffAttendanceById,
} from '../thunks/attendanceThunk';

const extract = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.attendance)) return payload.attendance;
  if (Array.isArray(payload?.records)) return payload.records;
  return [];
};

const attendanceSlice = createSlice({
  name: 'attendance',
  initialState: {
    today: null,
    myAttendance: [],
    allStaff: [],
    staffDetail: [],
    loading: false,
    actionLoading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(checkIn.pending,   (state) => { state.actionLoading = true; state.error = null; })
      .addCase(checkIn.fulfilled, (state, a) => { state.actionLoading = false; state.today = a.payload?.data || a.payload; })
      .addCase(checkIn.rejected,  (state, a) => { state.actionLoading = false; state.error = a.payload; })

      .addCase(checkOut.pending,   (state) => { state.actionLoading = true; state.error = null; })
      .addCase(checkOut.fulfilled, (state, a) => { state.actionLoading = false; state.today = a.payload?.data || a.payload; })
      .addCase(checkOut.rejected,  (state, a) => { state.actionLoading = false; state.error = a.payload; })

      .addCase(fetchTodayAttendance.pending,   (state) => { state.loading = true; })
      .addCase(fetchTodayAttendance.fulfilled, (state, a) => { state.loading = false; state.today = a.payload?.data || a.payload; })
      .addCase(fetchTodayAttendance.rejected,  (state, a) => { state.loading = false; state.error = a.payload; })

      .addCase(fetchMyAttendance.pending,   (state) => { state.loading = true; })
      .addCase(fetchMyAttendance.fulfilled, (state, a) => { state.loading = false; state.myAttendance = extract(a.payload); })
      .addCase(fetchMyAttendance.rejected,  (state, a) => { state.loading = false; state.error = a.payload; })

      .addCase(applyLeave.pending,   (state) => { state.actionLoading = true; state.error = null; })
      .addCase(applyLeave.fulfilled, (state) => { state.actionLoading = false; })
      .addCase(applyLeave.rejected,  (state, a) => { state.actionLoading = false; state.error = a.payload; })

      .addCase(fetchAllStaffAttendance.pending,   (state) => { state.loading = true; })
      .addCase(fetchAllStaffAttendance.fulfilled, (state, a) => { state.loading = false; state.allStaff = extract(a.payload); })
      .addCase(fetchAllStaffAttendance.rejected,  (state, a) => { state.loading = false; state.error = a.payload; })

      .addCase(fetchStaffAttendanceById.pending,   (state) => { state.loading = true; })
      .addCase(fetchStaffAttendanceById.fulfilled, (state, a) => { state.loading = false; state.staffDetail = extract(a.payload); })
      .addCase(fetchStaffAttendanceById.rejected,  (state, a) => { state.loading = false; state.error = a.payload; });
  },
});

export const { clearError } = attendanceSlice.actions;
export default attendanceSlice.reducer;
