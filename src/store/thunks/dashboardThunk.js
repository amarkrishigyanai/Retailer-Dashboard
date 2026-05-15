import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../lib/api';

export const getDashboardData = createAsyncThunk(
  'dashboard/getDashboardData',
  async (_, { rejectWithValue }) => {
    try {
      const [listingsRes, ordersRes, membersRes, purchasesRes, inventoryRes] = await Promise.all([
        api.get('/product/getProducts'),
        api.get('/order/allOrders'),
        api.get('/user/getAllUsers'),
        api.get('/purchase/getPurchases'),
        api.get('/inventory/stocks').catch(() => ({ data: { data: [] } })), // Fallback if inventory API fails
      ]);
      const products = listingsRes.data?.data || [];
      const orders = ordersRes.data?.data ?? ordersRes.data ?? [];
      const totalMembers = (membersRes.data?.data || []).length;
      const purchases = purchasesRes.data?.data ?? purchasesRes.data ?? [];
      const inventoryStocks = inventoryRes.data?.data ?? inventoryRes.data ?? [];

      /* ===== STATS ===== */
      const normalizeStatus = (status) => String(status || '').trim().toLowerCase();

      const pendingApprovals = products.filter((p) => normalizeStatus(p.status) === 'pending').length;
      const approvedListings = products.filter((p) => normalizeStatus(p.status) === 'active').length;
      const totalOrders = Array.isArray(purchases) ? purchases.length : 0;
      const pendingDeliveries = Array.isArray(orders)
        ? orders.filter((o) => ['pending', 'approved'].includes(normalizeStatus(o.status))).length
        : 0;
      const totalProcurementValue = Array.isArray(purchases)
        ? purchases.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0)
        : 0;

      /* ===== RECENT ACTIVITY ===== */
      const recentActivity = products.slice(0, 20).map((p) => ({
        firstName: p.addedBy?.firstName ?? '',
        lastName: p.addedBy?.lastName ?? '',
        cropName: p.productName ?? '',
        status: p.status,
        createdAt: p.createdAt,
      }));

      /* ===== ORDER BOOK STATUS DISTRIBUTION ===== */
      const obStatusCount = { PENDING: 0, APPROVED: 0, SOLD: 0, CANCELLED: 0 };
      if (Array.isArray(orders)) {
        orders.forEach((o) => {
          const s = String(o.status || 'PENDING').toUpperCase();
          if (obStatusCount[s] !== undefined) obStatusCount[s]++;
          else obStatusCount['PENDING']++;
        });
      }
      const topCropsChart = [
        { name: 'Pending',   value: obStatusCount['PENDING'],   color: '#FBBF24', bg: '#FFFBEB' },
        { name: 'Approved',  value: obStatusCount['APPROVED'],  color: '#60A5FA', bg: '#EFF6FF' },
        { name: 'Sold',      value: obStatusCount['SOLD'],      color: '#34D399', bg: '#ECFDF5' },
        { name: 'Cancelled', value: obStatusCount['CANCELLED'], color: '#F87171', bg: '#FEF2F2' },
      ].filter((d) => d.value > 0);

      /* ===== MONTHLY REVENUE & ORDERS (last 6 months) ===== */
      const now = new Date();
      const monthLabels = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        monthLabels.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleString('default', { month: 'short' }) });
      }
      const revenueOrdersChart = monthLabels.map(({ key, label }) => {
        const [yr, mo] = key.split('-').map(Number);
        const revenue = Array.isArray(orders)
          ? orders
              .filter(o => ['SOLD','sold','APPROVED','approved','completed','COMPLETED'].includes(String(o.status || '')))
              .filter(o => { const d = new Date(o.placedAt || o.updatedAt || o.createdAt); return d.getFullYear() === yr && d.getMonth() === mo; })
              .reduce((s, o) => s + Number(o.finalAmount || o.totalAmount || 0), 0)
          : 0;
        const ordersCount = Array.isArray(orders)
          ? orders.filter(o => { const d = new Date(o.placedAt || o.updatedAt || o.createdAt); return d.getFullYear() === yr && d.getMonth() === mo; }).length
          : 0;
        return { month: label, revenue, orders: ordersCount };
      });

      /* ===== PROCUREMENT VS SALES VALUE ₹ (last 6 months) ===== */
      const procVsSalesChart = monthLabels.map(({ key, label }) => {
        const [yr, mo] = key.split('-').map(Number);
        const procValue = purchases
          .filter(p => { const d = new Date(p.createdAt); return d.getFullYear() === yr && d.getMonth() === mo; })
          .reduce((s, p) => {
            const fromCrops = p.crops?.reduce((cs, c) => cs + (Number(c.rate || 0) * Number(c.quantity || 0)), 0) ?? 0;
            return s + (Number(p.totalAmount) || fromCrops);
          }, 0);
        const salesValue = Array.isArray(orders)
          ? orders
              .filter(o => ['SOLD', 'sold', 'completed', 'COMPLETED', 'APPROVED', 'approved'].includes(String(o.status || '')))
              .filter(o => {
                const d = new Date(o.placedAt || o.updatedAt || o.createdAt);
                return d.getFullYear() === yr && d.getMonth() === mo;
              })
              .reduce((s, o) => s + Number(o.finalAmount || o.totalAmount || o.amount || 0), 0)
          : 0;
        return { month: label, procurement: procValue, sales: salesValue };
      });

      /* ===== MEMBER GROWTH (last 6 months) ===== */
      const allUsers = membersRes.data?.data || [];
      const memberGrowthChart = monthLabels.map(({ key, label }) => {
        const [yr, mo] = key.split('-').map(Number);
        const count = allUsers.filter(u => { const d = new Date(u.createdAt); return d.getFullYear() === yr && d.getMonth() === mo; }).length;
        return { month: label, members: count };
      });
      // cumulative
      let cum = 0;
      memberGrowthChart.forEach(m => { cum += m.members; m.total = cum; });

      /* ===== TOP PRODUCTS BY SALES (THIS MONTH) ===== */
      // Create a product lookup map from both products and inventory
      const productMap = {};
      
      // Add products
      products.forEach(p => {
        if (p._id) productMap[String(p._id)] = p;
        if (p.id) productMap[String(p.id)] = p;
      });
      
      // Add inventory items (which contain product details)
      inventoryStocks.forEach(inv => {
        const prodId = inv.item?.product?._id || inv.product?._id || inv._id;
        if (prodId) {
          productMap[String(prodId)] = {
            ...productMap[String(prodId)],
            productName: inv.item?.product?.productName || inv.product?.productName || inv.productName,
            name: inv.item?.product?.name || inv.product?.name || inv.name,
            productImages: inv.item?.product?.productImages || inv.product?.productImages || inv.productImages,
            image: inv.item?.product?.image || inv.product?.image || inv.image,
            price: inv.item?.product?.price || inv.product?.price || inv.price,
            sellingPrice: inv.item?.product?.sellingPrice || inv.product?.sellingPrice || inv.sellingPrice,
          };
        }
      });
      
      // Calculate sales from orders for the current month
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();
      
      const productSalesMap = {};
      Array.isArray(orders) && orders.forEach(o => {
        const orderDate = new Date(o.placedAt || o.updatedAt || o.createdAt);
        const orderYear = orderDate.getFullYear();
        const orderMonth = orderDate.getMonth();
        
        // Filter for current month only
        if (orderYear === currentYear && orderMonth === currentMonth && 
            ['SOLD', 'sold', 'completed', 'COMPLETED', 'APPROVED', 'approved'].includes(String(o.status || ''))) {
          
          // Try multiple item structures
          const items = o.items || o.orderItems || o.products || [];
          if (Array.isArray(items) && items.length > 0) {
            items.forEach(item => {
              // Try to get product ID from various fields
              const productId = item.product?._id || item.productId || item._id || item.id;
              const qty = Number(item.quantity || 0);
              let revenue = Number(item.totalPrice || 0);
              
              // Try to get product name from various fields
              const productName = item.product?.productName || item.productName || item.product?.name || item.name || null;
              
              // If totalPrice is 0, try calculating from price * quantity
              if (revenue === 0 && item.price) {
                revenue = Number(item.price) * qty;
              }
              
              // If revenue still 0, try to get from order total or use a placeholder
              if (revenue === 0 && o.totalAmount) {
                revenue = Number(o.totalAmount) / (items.length || 1);
              }
              
              if (productId && qty > 0) {
                if (!productSalesMap[productId]) {
                  productSalesMap[productId] = { 
                    qty: 0, 
                    revenue: 0, 
                    product: item.product || {},
                    itemName: productName // Store name from item
                  };
                }
                productSalesMap[productId].qty += qty;
                productSalesMap[productId].revenue += revenue;
              }
            });
          }
        }
      });
      
      // Fallback: if no items in orders, use purchases data for current month
      if (Object.keys(productSalesMap).length === 0) {
        purchases.forEach(p => {
          const purchaseDate = new Date(p.createdAt);
          const purchaseYear = purchaseDate.getFullYear();
          const purchaseMonth = purchaseDate.getMonth();
          
          if (purchaseYear === currentYear && purchaseMonth === currentMonth) {
            const name = p.crop || p.crops?.[0]?.cropName || p.productName || 'Unknown';
            const qty = Number(p.quantity || p.crops?.[0]?.quantity || 0);
            const revenue = Number(p.totalAmount || 0);
            
            if (name && qty > 0) {
              if (!productSalesMap[name]) {
                productSalesMap[name] = { qty: 0, revenue: 0, product: {} };
              }
              productSalesMap[name].qty += qty;
              productSalesMap[name].revenue += revenue;
            }
          }
        });
      }
      
      // Merge with product details from products array and inventory
      const topProductsChart = Object.entries(productSalesMap)
        .map(([productId, data]) => {
          // Priority 1: Use product data from enriched map (includes inventory)
          const foundProduct = productMap[String(productId)];
          
          if (foundProduct) {
            return {
              _id: productId,
              name: foundProduct.productName || foundProduct.name || data.itemName,
              qty: data.qty,
              revenue: data.revenue,
              image: foundProduct.productImages?.[0]?.url || foundProduct.image,
              price: Number(foundProduct.price || foundProduct.sellingPrice || 0),
            };
          }
          
          // Priority 2: Use product name from order item
          if (data.itemName) {
            return {
              _id: productId,
              name: data.itemName,
              qty: data.qty,
              revenue: data.revenue,
              image: data.product?.productImages?.[0]?.url || data.product?.image,
              price: Number(data.product?.price || data.product?.sellingPrice || 0),
            };
          }
          
          // Fallback: show shortened ID
          return {
            _id: productId,
            name: `Product ${String(productId).substring(0, 8)}`,
            qty: data.qty,
            revenue: data.revenue,
            image: data.product?.productImages?.[0]?.url || data.product?.image,
            price: Number(data.product?.price || data.product?.sellingPrice || 0),
          };
        })
        .sort((a, b) => b.qty - a.qty || b.revenue - a.revenue)
        .slice(0, 3);

      /* ===== INVENTORY STOCK LEVELS ===== */
      // Sum up purchased quantity per product name from purchases
      const purchasedQtyMap = {};
      purchases.forEach(p => {
        const name = p.crop || p.crops?.[0]?.cropName || p.productName || '';
        if (name) purchasedQtyMap[name] = (purchasedQtyMap[name] || 0) + Number(p.quantity || p.crops?.[0]?.quantity || 0);
      });
      const inventoryStockChart = products.slice(0, 8).map(p => {
        const stockVal = Number(p.quantity ?? p.stock ?? p.currentStock ?? 0);
        const purchasedQty = purchasedQtyMap[p.productName] || 0;
        const resolvedStock = stockVal > 0 ? stockVal : purchasedQty;
        return {
          name: p.productName?.length > 14 ? p.productName.slice(0, 14) + '…' : p.productName,
          stock: resolvedStock,
          minStock: Number(p.minStock || p.minQuantity || p.minimumStock || 10),
        };
      });

      return {
        stats: { pendingApprovals, approvedListings, totalOrders, totalProcurementValue, totalMembers, pendingDeliveries },
        recentActivity,
        topCropsChart,
        allListings: products,
        revenueOrdersChart,
        procVsSalesChart,
        memberGrowthChart,
        topProductsChart,
        inventoryStockChart,
      };
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'Failed to load dashboard'
      );
    }
  }
);