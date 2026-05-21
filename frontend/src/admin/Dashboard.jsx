import { useEffect, useState } from "react";
import { fetchOrders, fetchTodaySales, fetchPurchases } from "../utils/api";
import AdminNavbar from "./AdminNavbar";
import socket from "../utils/socket";

const Dashboard = () => {
  const [orders, setOrders] = useState([]);
  const [todaySales, setTodaySales] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [purchases, setPurchases] = useState([]);
  const shopName = import.meta.env.VITE_SHOP_NAME || "Shop";

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      await Promise.allSettled([
        fetchOrdersData(),
        fetchTodaySalesData(),
        fetchPurchasesData()
      ]);
      setLoading(false);
    };
    loadInitialData();

    socket.on("orderUpdated", () => {
      fetchOrdersData();
      fetchTodaySalesData();
    });

    socket.on("purchaseUpdated", () => {
      fetchPurchasesData();
    });

    return () => {
      socket.off("orderUpdated");
      socket.off("purchaseUpdated");
    };
  }, []);

  const fetchOrdersData = async () => {
    try {
      const res = await fetchOrders();
      setOrders(res.data);
    } catch (error) {
      console.error("Error fetching orders", error);
    }
  };

  const fetchPurchasesData = async () => {
    try {
      const res = await fetchPurchases();
      setPurchases(res.data);
    } catch (error) {
      console.error("Error fetching purchases", error);
    }
  };

  const fetchTodaySalesData = async () => {
    try {
      const res = await fetchTodaySales();
      setTodaySales(res.data.totalSales);
    } catch (error) {
      console.error("Error fetching today's sales", error);
    }
  };

  const printBill = (order) => {
    const receipt = `
================================
          ${shopName.toUpperCase()}
================================
Bill ID : ${order.billId}
Mobile : ${order.mobile}
Payment : ${order.paymentMethod || "Cash"}
--------------------------------
${order.items.map(item => `${item.name}\n${item.qty} x ${item.price}`).join("\n")}
--------------------------------
Final Total : ₹${order.finalTotal}
================================
THANK YOU
================================
`;
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`<pre>${receipt}</pre>`);
    printWindow.print();
  };

  const totalSales = orders.reduce((a, b) => a + b.finalTotal, 0);

  const formatOrderDate = (date) => new Date(date).toLocaleDateString("en-CA");

  const selectedDateOrders = selectedDate
    ? orders.filter(order => formatOrderDate(order.createdAt) === selectedDate)
    : orders;

  const selectedDateSales = selectedDateOrders.reduce((a, b) => a + b.finalTotal, 0);

  const totalPurchaseCost = purchases.reduce((a, b) => a + (Number(b.price) || 0), 0);

  const filteredOrders = selectedDateOrders.filter(order => 
    (order.mobile && order.mobile.includes(searchTerm)) || 
    (order.billId && order.billId.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const printSalesReport = () => {
    const reportOrders = selectedDateOrders;
    const reportRows = reportOrders.map((order) => 
      order.items.map((item, i) => {
        const isFirst = i === 0;
        const isLast = i === order.items.length - 1;
        return `
          <tr class="${isLast ? 'bill-row-end' : ''}">
            <td>${isFirst ? (order.billId || order._id) : ""}</td>
            <td>${isFirst ? (order.mobile && order.mobile.toLowerCase() !== "guest" ? order.mobile : "Guest") : ""}</td>
            <td>${isFirst ? (order.paymentMethod || "Cash") : ""}</td>
            <td>${item.name}</td>
            <td class="text-right">${item.qty}</td>
            <td class="text-right">₹${item.price}</td>
            <td class="text-right">₹${item.qty * item.price}</td>
            <td class="text-right bold">${isLast ? `₹${order.finalTotal}` : ""}</td>
          </tr>`;
      }).join("")
    ).join("");

    const html = `
      <html>
        <head>
          <title>${shopName} Sales Report</title>
          <style>
            @page { size: auto; margin: 0mm; }
            body { font-family: Arial, sans-serif; color: #111; margin: 0; font-size: 11px; line-height: 1.25; }
            .report-container { padding: 20mm; }
            .header { text-align: center; margin-bottom: 18px; }
            .header h1 { margin: 0; font-size: 24px; letter-spacing: 1px; }
            .header p { margin: 4px 0 0; font-size: 12px; color: #333; }
            .summary { width: 100%; margin-bottom: 16px; border-collapse: collapse; }
            .summary td { padding: 6px 8px; font-size: 12px; vertical-align: bottom; }
            .summary .label { font-weight: bold; width: 140px; }
            .report-table { width: 100%; border-collapse: collapse; font-size: 11px; }
            .report-table th { border: 1px solid #ccc; border-bottom: 2px solid #888; padding: 6px 8px; vertical-align: bottom; background: #f5f5f5; text-align: left; }
            .report-table td { padding: 6px 8px; vertical-align: bottom; border-left: 1px solid #ccc; border-right: 1px solid #ccc; }
            .report-table tr.bill-row-end td { border-bottom: 1px solid #ccc; }
            .report-table .text-right { text-align: right; }
            .report-table .bold { font-weight: bold; }
            .report-table td:first-child, .report-table td:nth-child(2), .report-table td:nth-child(3) { vertical-align: top; }
            .footer { margin-top: 18px; font-size: 11px; }
            .note { margin-top: 10px; color: #555; }
          </style>
        </head>
        <body>
          <div class="report-container">
            <div class="header">
              <h1>${shopName.toUpperCase()}</h1>
              <p>Daily Sales Report</p>
            </div>
            <table class="summary">
              <tr><td class="label">Report Date</td><td>${selectedDate}</td></tr>
              <tr><td class="label">Total Orders</td><td>${reportOrders.length}</td></tr>
              <tr><td class="label">Total Sales</td><td>₹${selectedDateSales.toFixed(2)}</td></tr>
            </table>
            <table class="report-table">
              <thead>
                <tr>
                  <th>Bill</th>
                  <th>Customer</th>
                  <th>Method</th>
                  <th>Item</th>
                  <th class="text-right">Qty</th>
                  <th class="text-right">Price</th>
                  <th class="text-right">Amount</th>
                  <th class="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                ${reportRows}
                <tr class="bill-row-end">
                  <td colspan="7" class="text-right bold">Grand Total</td>
                  <td class="text-right bold">₹${selectedDateSales.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
            <div class="footer">
              <p class="bold">Report generated on: ${new Date().toLocaleString()}</p>
              <p class="note">This report contains all orders for the selected date and provides a summary of sales totals and item details.</p>
            </div>
          </div>
        </body>
      </html>`;

    const printWindow = window.open("", "_blank");
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  if (loading) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-amber-300 font-bold text-2xl animate-pulse uppercase tracking-widest italic">Loading Dashboard...</div>;
  }

  return (
    <div className="min-h-screen text-slate-100 px-3 py-4" style={{ background: "radial-gradient(circle at top, rgba(56,189,248,0.15), transparent 30%), linear-gradient(180deg, #020617 0%, #060d19 50%, #020616 100%)" }}>
      <AdminNavbar />
      <h1 className="font-extrabold text-center tracking-tight text-amber-300 mb-8" style={{ fontSize: "clamp(2.2rem, 6vw, 3rem)" }}>DASHBOARD</h1>

      <div className="mx-auto w-full max-w-6xl">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-6 mb-8">
          <div className="bg-slate-950/90 p-4 rounded-[2rem] border border-slate-700/70 shadow-xl text-center flex flex-col justify-center min-h-[120px]">
            <h2 className="text-[9px] sm:text-[11px] font-semibold text-slate-100 mb-2 uppercase tracking-[0.07em]">Today's Sales</h2>
            <p className="text-xl sm:text-2xl font-black text-amber-300">₹{todaySales}</p>
          </div>

          <div className="bg-slate-950/90 p-4 rounded-[2rem] border border-slate-700/70 shadow-xl text-center flex flex-col justify-center min-h-[120px]">
            <h2 className="text-[9px] sm:text-[11px] font-semibold text-slate-100 mb-2 uppercase tracking-[0.07em]">Total Sales</h2>
            <p className="text-xl sm:text-2xl font-black text-cyan-300">₹{totalSales}</p>
          </div>

          <div className="bg-slate-950/90 p-4 rounded-[2rem] border border-slate-700/70 shadow-xl text-center flex flex-col justify-center min-h-[120px]">
            <h2 className="text-[9px] sm:text-[11px] font-semibold text-slate-100 mb-2 uppercase tracking-[0.07em]">Total Purchase</h2>
            <p className="text-xl sm:text-2xl font-black text-rose-400">₹{totalPurchaseCost}</p>
          </div>

          <div className="bg-slate-950/90 p-4 rounded-[2rem] border border-slate-700/70 shadow-xl text-center flex flex-col justify-center min-h-[120px]">
            <h2 className="text-[9px] sm:text-[11px] font-semibold text-slate-100 mb-2 uppercase tracking-[0.07em]">Total Orders</h2>
            <p className="text-xl sm:text-2xl font-black text-emerald-300">{orders.length}</p>
          </div>

          <div className="bg-slate-950/90 p-4 rounded-[2rem] border border-slate-700/70 shadow-xl text-center flex flex-col justify-center min-h-[120px]">
            <h2 className="text-[9px] sm:text-[11px] font-semibold text-slate-100 mb-2 uppercase tracking-[0.07em]">Day Sales</h2>
            <p className="text-xl sm:text-2xl font-black text-violet-300">{selectedDate ? `₹${selectedDateSales}` : "—"}</p>
            <p className="text-sm sm:text-base mt-2 text-slate-400">{selectedDate ? `${selectedDateOrders.length} orders` : "Select a date above"}</p>
          </div>
        </div>

        <div className="premium-card p-4 sm:p-6 shadow-2xl border border-slate-700/70">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
            <div>
              <label className="block text-sm sm:text-base font-semibold text-slate-100 mb-2 uppercase tracking-[0.14em]">Search Transactions</label>
              <input
                type="text"
                placeholder="🔍 Mobile or Bill ID..."
                className="premium-input w-full px-4 py-3 text-[clamp(0.9rem,2.2vw,1.2rem)] font-semibold"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm sm:text-base font-semibold text-slate-100 mb-2 uppercase tracking-[0.14em]">Filter by Day</label>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                <input
                  type="date"
                  className="premium-input flex-1 px-4 py-3 text-[clamp(0.9rem,2.2vw,1.2rem)] font-semibold"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
                {selectedDate && (
                  <>
                    <button
                      onClick={() => setSelectedDate("")}
                      className="premium-button-secondary bg-slate-900/95 text-slate-100 px-4 py-3 rounded-2xl font-bold border border-slate-600 shadow-lg hover:border-slate-400 transition-all text-sm sm:text-base"
                    >
                      Clear
                    </button>
                    <button
                      onClick={printSalesReport}
                      className="premium-button bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 px-4 py-3 rounded-2xl font-bold shadow-lg hover:from-cyan-300 hover:to-blue-400 transition-all text-sm sm:text-base"
                    >
                      Print Day Report
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-700/70">
            <table className="w-full text-left" style={{ borderCollapse: 'collapse' }}>
              <thead className="bg-slate-900 text-slate-100">
                <tr>
                  <th className="p-3 sm:p-4 uppercase font-black text-sm sm:text-base border-b border-slate-700">Date</th>
                  <th className="p-3 sm:p-4 uppercase font-black text-sm sm:text-base border-b border-slate-700">Bill ID</th>
                  <th className="p-3 sm:p-4 uppercase font-black text-sm sm:text-base border-b border-slate-700">Mobile</th>
                  <th className="p-3 sm:p-4 uppercase font-black text-sm sm:text-base border-b border-slate-700">Method</th>
                  <th className="p-3 sm:p-4 uppercase font-black text-sm sm:text-base text-right border-b border-slate-700">Total</th>
                  <th className="p-3 sm:p-4 uppercase font-black text-sm sm:text-base text-center border-b border-slate-700">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order, index) => (
                  <tr key={order._id} className={`${index % 2 === 0 ? 'bg-slate-950/40' : 'bg-slate-900/40'} hover:bg-slate-800/60 transition-colors border-b border-slate-700/50 last:border-0`}>
                    <td className="p-3 sm:p-4 font-semibold text-slate-100 text-sm sm:text-base">{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td className="p-3 sm:p-4 font-mono text-slate-300 text-sm sm:text-base">{order.billId}</td>
                    <td className="p-3 sm:p-4 font-semibold text-slate-100 text-sm sm:text-base">{order.mobile || "GUEST"}</td>
                    <td className="p-3 sm:p-4 font-semibold text-sm sm:text-base">
                      <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${order.paymentMethod === 'UPI' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}`}>
                        {order.paymentMethod || "CASH"}
                      </span>
                    </td>
                    <td className="p-3 sm:p-4 font-bold text-right text-amber-300 text-sm sm:text-base">₹{order.finalTotal}</td>
                    <td className="p-3 sm:p-4 text-center">
                      <button
                        onClick={() => printBill(order)}
                        className="premium-button bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 px-4 py-2 rounded-xl font-bold hover:from-cyan-300 hover:to-blue-400 transition-all text-sm sm:text-base"
                      >
                        PRINT 🖨️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
