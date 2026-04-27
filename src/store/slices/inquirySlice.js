import { createSlice } from '@reduxjs/toolkit';
import { addInquiry, fetchAllInquiries, fetchMyInquiries, fetchInquiryById } from '../thunks/inquiryThunk';

const extract = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.inquiries)) return payload.inquiries;
  return [];
};

const inquirySlice = createSlice({
  name: 'inquiry',
  initialState: {
    inquiries: [],
    myInquiries: [],
    current: null,
    loading: false,
    submitLoading: false,
    error: null,
  },
  reducers: {
    clearCurrent: (state) => { state.current = null; },
    clearError:   (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      // Add
      .addCase(addInquiry.pending,   (state) => { state.submitLoading = true; state.error = null; })
      .addCase(addInquiry.fulfilled, (state) => { state.submitLoading = false; })
      .addCase(addInquiry.rejected,  (state, a) => { state.submitLoading = false; state.error = a.payload; })

      // All (admin)
      .addCase(fetchAllInquiries.pending,   (state) => { state.loading = true; })
      .addCase(fetchAllInquiries.fulfilled, (state, a) => { state.loading = false; state.inquiries = extract(a.payload); })
      .addCase(fetchAllInquiries.rejected,  (state, a) => { state.loading = false; state.error = a.payload; })

      // My inquiries
      .addCase(fetchMyInquiries.pending,   (state) => { state.loading = true; })
      .addCase(fetchMyInquiries.fulfilled, (state, a) => { state.loading = false; state.myInquiries = extract(a.payload); })
      .addCase(fetchMyInquiries.rejected,  (state, a) => { state.loading = false; state.error = a.payload; })

      // Single
      .addCase(fetchInquiryById.pending,   (state) => { state.loading = true; })
      .addCase(fetchInquiryById.fulfilled, (state, a) => { state.loading = false; state.current = a.payload?.data || a.payload; })
      .addCase(fetchInquiryById.rejected,  (state, a) => { state.loading = false; state.error = a.payload; });
  },
});

export const { clearCurrent, clearError } = inquirySlice.actions;
export default inquirySlice.reducer;
