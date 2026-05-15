import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../lib/api';

const DOC_TYPES_BY_ROLE = {
  Farmer: ['labReport', 'soilHealthCard', 'govtSchemeDocs'],
  Retailer: ['shopActLicense', 'pesticideLicense', 'gstCertificate', 'panCard'],
  Distributor: ['seedLicense', 'fertilizerLicense', 'procurementLicense', 'GSTCertificate', 'CINCertificate', 'PANCard', 'InsecticidesLicense'],
  Staff: [],
};

export const fetchDocuments = createAsyncThunk(
  'documents/fetch',
  async ({ userId, role }, { rejectWithValue }) => {
    if (!userId) return rejectWithValue('userId is required');
    const types = DOC_TYPES_BY_ROLE[role] ?? DOC_TYPES_BY_ROLE['Farmer'];
    if (!types.length) return [];
    try {
      const results = await Promise.allSettled(
        types.map((type) => api.get(`/admin/files/private?type=${type}&userId=${userId}`))
      );
      return results.flatMap((result, i) => {
        if (result.status !== 'fulfilled') return [];
        const data = result.value.data;
        return (data?.files || data || []).map((doc) => ({
          ...doc,
          document_type: types[i],
        }));
      });
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load documents');
    }
  }
);
