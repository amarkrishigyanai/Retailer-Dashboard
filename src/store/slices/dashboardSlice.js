import { createSlice } from '@reduxjs/toolkit';
import { getDashboardData } from '../thunks/dashboardThunk';

const initialState = {
  stats: {
    pendingApprovals: 0,
    approvedListings: 0,
    totalOrders: 0,
    totalProcurementValue: 0,
  },
  chartData: [],
  dailyListings: [],
  recentActivity: [],
  allListings: [], // ✅ ADD
  loading: false,
  error: null,
};

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getDashboardData.pending, (state) => {
        state.loading = true;
      })
      .addCase(getDashboardData.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload.stats;
        state.chartData = action.payload.chartData;
        state.dailyListings = action.payload.dailyListings;
        state.recentActivity = action.payload.recentActivity;
         state.allListings = action.payload.allListings; // ✅ ADD
      })
      .addCase(getDashboardData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default dashboardSlice.reducer;
