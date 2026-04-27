import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../lib/api';

export const getDashboardData = createAsyncThunk(
  'dashboard/getDashboardData',
  async (_, { rejectWithValue }) => {
    try {
      const [listingsRes, ordersRes, membersRes] = await Promise.all([
        api.get('/product/getProducts'),
        api.get('/order/allOrders'),
        api.get('/user/getAllUsers'),
      ]);
      const products = listingsRes.data?.data || [];
      const orders = ordersRes.data?.data ?? ordersRes.data ?? [];
      const totalMembers = (membersRes.data?.data || []).length;

      /* ===== STATS ===== */
      const normalizeStatus = (status) => String(status || '').trim().toLowerCase();

      const pendingApprovals = products.filter((p) => normalizeStatus(p.status) === 'pending').length;
      const approvedListings = products.filter((p) => normalizeStatus(p.status) === 'active').length;
      const totalOrders = Array.isArray(orders) ? orders.length : 0;
      const totalProcurementValue = Array.isArray(orders)
        ? orders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0)
        : 0;

      /* ===== RECENT ACTIVITY ===== */
      const recentActivity = products.slice(0, 20).map((p) => ({
        firstName: p.addedBy?.firstName ?? '',
        lastName: p.addedBy?.lastName ?? '',
        cropName: p.productName ?? '',
        status: p.status,
        createdAt: p.createdAt,
      }));

      /* ===== MONTHLY BAR GRAPH ===== */
      const chartMap = new Map();
      products.forEach((p) => {
        const date = new Date(p.createdAt);
        const monthLabel = date.toLocaleString('default', { month: 'short' });
        const prev = chartMap.get(monthLabel) || { month: monthLabel, sales: 0 };
        chartMap.set(monthLabel, { month: monthLabel, sales: prev.sales + Number(p.quantity || 0) });
      });
      const chartData = Array.from(chartMap.values());

      /* ===== DAILY DOTTED GRAPH ===== */
      const daysMap = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };
      products.forEach((p) => {
        const day = new Date(p.createdAt).toLocaleString('en-US', { weekday: 'short' });
        if (daysMap[day] !== undefined) daysMap[day] += 1;
      });
      const dailyListings = Object.keys(daysMap).map((day) => ({ day, count: daysMap[day] }));

      return {
        stats: { pendingApprovals, approvedListings, totalOrders, totalProcurementValue, totalMembers },
        recentActivity,
        chartData,
        dailyListings,
        allListings: products,
      };
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'Failed to load dashboard'
      );
    }
  }
);