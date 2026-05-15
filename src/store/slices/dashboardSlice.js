import { createSlice } from '@reduxjs/toolkit';
import { getDashboardData } from '../thunks/dashboardThunk';

const initialState = {
  stats: {
    pendingApprovals: 0,
    approvedListings: 0,
    totalOrders: 0,
    totalProcurementValue: 0,
    pendingDeliveries: 0,
  },
  topCropsChart: [],
  recentActivity: [],
  allListings: [],
  revenueOrdersChart: [],
  procVsSalesChart: [],
  memberGrowthChart: [],
  topProductsChart: [],
  inventoryStockChart: [],
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
        state.topCropsChart = action.payload.topCropsChart;
        state.recentActivity = action.payload.recentActivity;
        state.allListings = action.payload.allListings;
        state.revenueOrdersChart = action.payload.revenueOrdersChart;
        state.procVsSalesChart = action.payload.procVsSalesChart;
        state.memberGrowthChart = action.payload.memberGrowthChart;
        state.topProductsChart = action.payload.topProductsChart;
        state.inventoryStockChart = action.payload.inventoryStockChart;
      })
      .addCase(getDashboardData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default dashboardSlice.reducer;
