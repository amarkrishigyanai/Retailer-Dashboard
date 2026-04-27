import { createSlice } from '@reduxjs/toolkit';
import {
  fetchAllLedgers,
  fetchLedgerByType,
  recordFarmerPayment,
  recordFpoPayment,
} from '../thunks/ledgerThunk';

const ledgerSlice = createSlice({
  name: 'ledger',
  initialState: {
    allEntries: [],      // Bug 1 fix: full unfiltered data — used by Farmer Balance & Monthly tabs
    entries: [],         // filtered by type — used by Transactions tab only
    loading: false,
    error: null,
    paymentLoading: false, // Bug 2 fix: payment spinner state
    paymentError: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // fetchAllLedgers — fills both allEntries and entries
      .addCase(fetchAllLedgers.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(fetchAllLedgers.fulfilled, (s, a) => {
        s.loading = false;
        s.allEntries = a.payload;
        s.entries = a.payload;
      })
      .addCase(fetchAllLedgers.rejected, (s, a) => { s.loading = false; s.error = a.payload; })

      // fetchLedgerByType — only updates entries, keeps allEntries intact
      .addCase(fetchLedgerByType.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(fetchLedgerByType.fulfilled, (s, a) => {
        s.loading = false;
        s.entries = a.payload; // Bug 1 fix: allEntries is NOT touched
      })
      .addCase(fetchLedgerByType.rejected, (s, a) => { s.loading = false; s.error = a.payload; })

      // recordFarmerPayment
      .addCase(recordFarmerPayment.pending, (s) => { s.paymentLoading = true; s.paymentError = null; })
      .addCase(recordFarmerPayment.fulfilled, (s) => { s.paymentLoading = false; })
      .addCase(recordFarmerPayment.rejected, (s, a) => { s.paymentLoading = false; s.paymentError = a.payload; })

      // recordFpoPayment
      .addCase(recordFpoPayment.pending, (s) => { s.paymentLoading = true; s.paymentError = null; })
      .addCase(recordFpoPayment.fulfilled, (s) => { s.paymentLoading = false; })
      .addCase(recordFpoPayment.rejected, (s, a) => { s.paymentLoading = false; s.paymentError = a.payload; });
  },
});

export default ledgerSlice.reducer;
