// store/slices/layoutSlice.js
import { createSlice } from '@reduxjs/toolkit';
import { fetchMe } from '../thunks/layoutThunk';

const initialState = {
  me: null,
  loading: false,
  error: null,
};

const layoutSlice = createSlice({
  name: 'layout',
  initialState,
  reducers: {
    clearMe: (state) => {
      state.me = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMe.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.loading = false;
        state.me = action.payload;
      })
      .addCase(fetchMe.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearMe } = layoutSlice.actions;
export default layoutSlice.reducer;
