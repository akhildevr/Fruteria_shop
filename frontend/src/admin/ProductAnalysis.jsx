import { useEffect, useState, useMemo, useCallback } from "react";
import { fetchOrders } from "../utils/api";
import AdminNavbar from "./AdminNavbar";
import socket from "../utils/socket";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";

const ProductAnalysis = () => {
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [loading, setLoading] = useState(true);

  const fetchOrdersData = useCallback(async () => {
    try {
      const res = await fetchOrders();
      setOrders(res.data);
    } catch (error) {
      console.error("Error fetching orders", error);
    }
  }, []);

  useEffect(() => {
    const initialize = async () => {
      setLoading(true);
      await fetchOrdersData();
      setLoading(false);
    };

    initialize();
    socket.on("orderUpdated", fetchOrdersData);
    return () => socket.off("orderUpdated", fetchOrdersData);
  }, [fetchOrdersData]);

  const monthKey = (date) => {
    if (!date) return "";
    const d = new Date(date);
    // Keep consistent with business-day cutover (2 AM)
    if (d.getHours() < 2) d.setDate(d.getDate() - 1);
    d.setHours(2, 0, 0, 0);
    return d.toISOString().slice(0, 7);
  };
  const monthLabel = (month) => new Date(`${month}-01`).toLocaleDateString("en-US", { month: "short", year: "numeric" });

  const { productStats, monthOptions, productStatsByMonth, overallTotals } = useMemo(() => {
    const products = {};
    const monthly = {};
    let totalQty = 0;
    let totalRevenue = 0;
    let totalCashRevenue = 0;
    let totalUpiRevenue = 0;

    orders.forEach((order) => {
      const orderMonth = monthKey(order.billDate || order.createdAt);


      const isUpi = order.paymentMethod === "UPI";

      if (!monthly[orderMonth]) {
        monthly[orderMonth] = {};
      }

      order.items.forEach((item) => {
        const productId = item.productId || item.name || item._id || "unknown";
        const name = item.name || "Unknown Product";
        const qty = Number(item.qty) || 0;
        const revenue = qty * (Number(item.price) || 0);

        totalQty += qty;
        totalRevenue += revenue;

        // Split revenue by payment method
        if (isUpi) {
          totalUpiRevenue += revenue;
        } else {
          totalCashRevenue += revenue;
        }

        if (!products[productId]) {
          products[productId] = { productId, name, qty: 0, revenue: 0 };
        }
        products[productId].qty += qty;
        products[productId].revenue += revenue;

        if (!monthly[orderMonth][productId]) {
          monthly[orderMonth][productId] = { productId, name, qty: 0, revenue: 0 };
        }
        monthly[orderMonth][productId].qty += qty;
        monthly[orderMonth][productId].revenue += revenue;
      });
    });

    const monthKeys = Object.keys(monthly).sort((a, b) => b.localeCompare(a));
    const overall = Object.values(products).sort((a, b) => b.revenue - a.revenue || b.qty - a.qty);

    return {
      productStats: overall,
      monthOptions: monthKeys,
      productStatsByMonth: monthly,
      overallTotals: { totalQty, totalRevenue, totalCashRevenue, totalUpiRevenue, totalProducts: overall.length }
    };
  }, [orders]);

  const currentMonth = monthOptions.includes(selectedMonth) ? selectedMonth : monthOptions[0] || selectedMonth;

  const activeMonthProducts = useMemo(() => {
    return currentMonth && productStatsByMonth[currentMonth]
      ? Object.values(productStatsByMonth[currentMonth]).sort((a, b) => b.revenue - a.revenue || b.qty - a.qty)
      : [];
  }, [currentMonth, productStatsByMonth]);

  const selectedMonthTotals = activeMonthProducts.reduce(
    (acc, product) => ({
      totalQty: acc.totalQty + product.qty,
      totalRevenue: acc.totalRevenue + product.revenue
    }),
    { totalQty: 0, totalRevenue: 0 }
  );

  const monthRevenueData = useMemo(() => {
    return monthOptions
      .map((month) => ({
        month: monthLabel(month),
        revenue: Object.values(productStatsByMonth[month] || {}).reduce((sum, item) => sum + item.revenue, 0)
      }))
      .reverse();
  }, [monthOptions, productStatsByMonth]);

  const selectedPieData = useMemo(() => {
    const slice = activeMonthProducts.slice(0, 5);
    const data = slice.map((product) => ({ name: product.name, value: product.revenue }));
    if (activeMonthProducts.length > 5) {
      const others = activeMonthProducts.slice(5).reduce((sum, product) => sum + product.revenue, 0);
      if (others > 0) data.push({ name: "Others", value: others });
    }
    return data;
  }, [activeMonthProducts]);

  const overallPieData = useMemo(() => {
    const slice = productStats.slice(0, 6);
    const data = slice.map((product) => ({ name: product.name, value: product.revenue }));
    if (productStats.length > 6) {
      const others = productStats.slice(6).reduce((sum, product) => sum + product.revenue, 0);
      if (others > 0) data.push({ name: "Others", value: others });
    }
    return data;
  }, [productStats]);

  const filteredProducts = useMemo(() => {
    if (!searchTerm) return productStats;
    return productStats.filter((product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [productStats, searchTerm]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-900 font-bold">Loading product sales...</div>;

  return (
    <div className="min-h-screen text-slate-900 px-3 py-6" style={{ background: 'linear-gradient(180deg, #f7fafc 0%, #e2e8f0 45%, #ffffff 100%)' }}>
      <AdminNavbar />
      <h1 className="font-extrabold text-center tracking-tight text-slate-900 mb-8 text-4xl lg:text-5xl drop-shadow-sm" style={{ color: 'var(--text-primary)' }}>Product Sales Analysis</h1>

      <div className="mx-auto max-w-6xl space-y-6">
        <div className="premium-card p-6 border border-slate-200 shadow-xl bg-white/95 backdrop-blur-sm">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="rounded-3xl bg-white p-5 border border-slate-200 shadow-sm">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-500 mb-3">Distinct Products Sold</p>
              <p className="text-3xl font-black text-slate-900">{overallTotals.totalProducts}</p>
            </div>
            <div className="rounded-3xl bg-white p-5 border border-slate-200 shadow-sm">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-500 mb-3">Total Quantity Sold</p>
              <p className="text-3xl font-black text-slate-900">{overallTotals.totalQty}</p>
            </div>
            <div className="rounded-3xl bg-white p-5 border border-slate-200 shadow-sm">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-500 mb-3">Total Revenue</p>
              <p className="text-3xl font-black text-emerald-600">₹{overallTotals.totalRevenue.toFixed(2)}</p>
              <div className="flex gap-3 mt-2">
                <span className="text-sm font-bold text-emerald-600">CASH: ₹{overallTotals.totalCashRevenue.toFixed(2)}</span>
                <span className="text-sm font-bold text-blue-600">UPI: ₹{overallTotals.totalUpiRevenue.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="premium-card p-6 border border-slate-200 shadow-xl bg-white/95 backdrop-blur-sm">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="rounded-3xl bg-white p-5 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-4 gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-slate-500 mb-2">Monthly Revenue Trend</p>
                  <h2 className="text-lg font-bold text-slate-900">Revenue by Month</h2>
                </div>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthRevenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" vertical={false} />
                    <XAxis dataKey="month" tick={{ fill: '#475569', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#475569', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip wrapperStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 10px 30px rgba(15,23,42,0.12)' }} />
                    <Bar dataKey="revenue" fill="#22c55e" radius={[10, 10, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-3xl bg-white p-5 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-4 gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-slate-500 mb-2">Revenue Share</p>
                  <h2 className="text-lg font-bold text-slate-900">Top Products</h2>
                </div>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={selectedPieData.length ? selectedPieData : overallPieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      fill="#38bdf8"
                      label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                    >
                      {((selectedPieData.length ? selectedPieData : overallPieData)).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={["#22c55e", "#38bdf8", "#f97316", "#a855f7", "#ec4899", "#eab308"][index % 6]} />
                      ))}
                    </Pie>
                    <Tooltip wrapperStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 10px 30px rgba(15,23,42,0.12)' }} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        <div className="premium-card p-6 border border-slate-200 shadow-xl bg-white/95 backdrop-blur-sm">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block uppercase tracking-[0.25em] text-slate-500 text-xs mb-2">Search Product</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by product name"
                className="premium-input w-full px-4 py-3 bg-white border border-slate-200 text-slate-900"
              />
            </div>
            <div>
              <label className="block uppercase tracking-[0.25em] text-slate-500 text-xs mb-2">Month</label>
              <select
                value={currentMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="premium-input w-full px-4 py-3 bg-white border border-slate-200 text-slate-900"
              >
                {monthOptions.map((month) => (
                  <option key={month} value={month}>{monthLabel(month)}</option>
                ))}
              </select>
            </div>
            <div className="rounded-3xl bg-white p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-slate-500 mb-3">Selected Month Revenue</p>
                <p className="text-3xl font-black text-slate-900">₹{selectedMonthTotals.totalRevenue.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-slate-500 mb-1">Selected Month Quantity</p>
                <p className="text-2xl font-black text-slate-900">{selectedMonthTotals.totalQty}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div className="rounded-3xl bg-white p-5 border border-slate-200 shadow-sm">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-500 mb-3">Top Products Overall</p>
              <div className="space-y-3 max-h-72 overflow-y-auto pr-2">
                {productStats.slice(0, 5).map((product) => (
                  <div key={product.productId} className="rounded-2xl bg-white p-3 border border-slate-200">
                    <div className="flex justify-between items-center gap-3">
                      <p className="font-semibold text-slate-900">{product.name}</p>
                      <span className="text-xs uppercase tracking-[0.2em] text-slate-500">₹{product.revenue.toFixed(0)}</span>
                    </div>
                    <p className="text-slate-500 text-sm">Qty: {product.qty}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl bg-white p-5 border border-slate-200 shadow-sm">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-500 mb-3">Top Products This Month</p>
              <div className="space-y-3 max-h-72 overflow-y-auto pr-2">
                {activeMonthProducts.slice(0, 5).map((product) => (
                  <div key={product.productId} className="rounded-2xl bg-white p-3 border border-slate-200">
                    <div className="flex justify-between items-center gap-3">
                      <p className="font-semibold text-slate-900">{product.name}</p>
                      <span className="text-xs uppercase tracking-[0.2em] text-slate-500">₹{product.revenue.toFixed(0)}</span>
                    </div>
                    <p className="text-slate-500 text-sm">Qty: {product.qty}</p>
                  </div>
                ))}
                {activeMonthProducts.length === 0 && (
                  <p className="text-slate-500 text-sm">No sales in selected month.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="premium-card rounded-2xl shadow-xl overflow-hidden border border-slate-200 bg-white/95">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-white text-slate-900">
                <tr>
                  <th className="p-3 uppercase text-slate-500 text-xs tracking-[0.2em]">Product</th>
                  <th className="p-3 uppercase text-slate-500 text-xs tracking-[0.2em] text-right">Month Qty</th>
                  <th className="p-3 uppercase text-slate-500 text-xs tracking-[0.2em] text-right">Month Revenue</th>
                  <th className="p-3 uppercase text-slate-500 text-xs tracking-[0.2em] text-right">Overall Qty</th>
                  <th className="p-3 uppercase text-slate-500 text-xs tracking-[0.2em] text-right">Overall Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-6 text-center text-slate-500">No products match your search.</td>
                  </tr>
                ) : filteredProducts.map((product) => {
                  const monthProduct = currentMonth && productStatsByMonth[currentMonth] ? productStatsByMonth[currentMonth][product.productId] : null;
                  return (
                    <tr key={product.productId} className="bg-white hover:bg-white transition-colors">
                      <td className="p-3 text-slate-900 font-semibold">{product.name}</td>
                      <td className="p-3 text-center text-slate-700">{monthProduct?.qty || 0}</td>
                      <td className="p-3 text-center text-emerald-600">₹{(monthProduct?.revenue || 0).toFixed(2)}</td>
                      <td className="p-3 text-center text-slate-700">{product.qty}</td>
                      <td className="p-3 text-center text-amber-600">₹{product.revenue.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductAnalysis;
