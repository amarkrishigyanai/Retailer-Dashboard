import { createSlice } from '@reduxjs/toolkit';
import {
  fetchReports,
  fetchCustomers,
  fetchPrivateFiles,
} from '../thunks/reportsThunk';

const initialState = {
  /* PURCHASE REPORTS */
  purchases: [],

  /* customers */
  customers: [],

  /* PRIVATE FILES
     structure:
     {
       customerId: {
         soilHealthCard: [],
         labReport: [],
         govtSchemeDocs: []
       }
     }
  */
  files: {},

  loading: false,
  error: null,
};

const reportsSlice = createSlice({
  name: 'reports',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder

      /* ================= PURCHASE REPORTS ================= */
      .addCase(fetchReports.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchReports.fulfilled, (state, action) => {
        state.loading = false;
        state.purchases = action.payload;
      })
      .addCase(fetchReports.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /* ================= CUSTOMERS ================= */
      .addCase(fetchCustomers.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCustomers.fulfilled, (state, action) => {
        state.loading = false;
        state.customers = action.payload;
      })
      .addCase(fetchCustomers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /* ================= PRIVATE FILES ================= */
      .addCase(fetchPrivateFiles.pending, (state) => {
        // do NOT touch global loading — handled locally in the component
      })
      .addCase(fetchPrivateFiles.fulfilled, (state, action) => {
        const { customerId, type, files } = action.payload;
        if (!state.files[customerId]) state.files[customerId] = {};
        state.files[customerId][type] = files;
      })
      .addCase(fetchPrivateFiles.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export default reportsSlice.reducer;
