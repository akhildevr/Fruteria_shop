import { useEffect, useState, useCallback } from "react";
import { fetchOrders, deleteOrder } from "../utils/api";
import { getBusinessDate } from "../utils/dateUtils";
import AdminNavbar from "./AdminNavbar";
import socket from "../utils/socket";

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [confirm, setConfirm] = useState({ show: false, id: null });
  const shopName = import.meta.env.VITE_SHOP_NAME || "Shop";

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
      await fetchOrdersData();
    };
    initialize();

    socket.on("orderUpdated", () => {
      fetchOrdersData();
    });

    return () => socket.off("orderUpdated");
  }, [fetchOrdersData]);

  const printBill = (order) => {
    const receipt = `
================================
          FRUTERIA
================================
Bill ID : ${order.billId || order._id}
Date    : ${new Date(order.createdAt).toLocaleDateString()}
Mobile  : ${order.mobile}
Payment : ${order.paymentMethod || "Cash"}
--------------------------------
${order.items.map(item => `${item.name}\n${item.qty} x ${item.price}    ₹${item.qty * item.price}`).join("\n")}
--------------------------------
Final Total : ₹${order.finalTotal}
================================
THANK YOU
================================
`;
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`<pre style="font-size:16px">${receipt}</pre>`);
    printWindow.print();
  };

  const deleteOrderAction = async (id) => {
    try {
      await deleteOrder(id);
      fetchOrdersData();
      setConfirm({ show: false, id: null });
    } catch (error) {
      console.error("Error deleting order", error);
    }
  };

  const selectedDateOrders = selectedDate
    ? orders.filter(order => getBusinessDate(order.createdAt) === selectedDate)
    : orders;

  const selectedDateSales = selectedDateOrders.reduce((a, b) => a + b.finalTotal, 0);

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

  return (
    <div className="min-h-screen text-slate-100 px-3 py-4" style={{ background: "radial-gradient(circle at top, rgba(56,189,248,0.15), transparent 30%), linear-gradient(180deg, #020617 0%, #060d19 50%, #020616 100%)" }}>
      <AdminNavbar />
      <h1 className="font-extrabold text-center tracking-tight text-amber-300 mb-8" style={{ fontSize: "clamp(2.2rem, 6vw, 3rem)" }}>Order History</h1>

      <div className="mx-auto w-full max-w-6xl">
        <div className="premium-card p-4 sm:p-6 shadow-2xl border border-slate-700/70 mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="block text-sm sm:text-base font-semibold text-slate-100 mb-2 uppercase tracking-[0.14em]">Search Orders</label>
              <input
                type="text"
                placeholder="🔍 Mobile or Bill ID..."
                className="premium-input w-full px-4 py-3 text-[clamp(0.9rem,2.2vw,1.2rem)] font-semibold"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm sm:text-base font-semibold text-slate-100 mb-2 uppercase tracking-[0.14em]">Filter by Date</label>
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
                      className="premium-button bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 px-4 py-3 rounded-2xl font-bold shadow-lg hover:from-cyan-300 hover:to-blue-400 transition-all text-sm sm:text-base whitespace-nowrap"
                    >
                      Print Report
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {selectedDate && (
            <div className="mt-4 pt-4 border-t border-slate-600 grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="bg-slate-900/50 p-3 rounded-lg">
                <p className="text-xs uppercase text-slate-400 font-semibold">Date</p>
                <p className="text-lg font-bold text-amber-300">{selectedDate}</p>
              </div>
              <div className="bg-slate-900/50 p-3 rounded-lg">
                <p className="text-xs uppercase text-slate-400 font-semibold">Total Orders</p>
                <p className="text-lg font-bold text-emerald-300">{selectedDateOrders.length}</p>
              </div>
              <div className="bg-slate-900/50 p-3 rounded-lg">
                <p className="text-xs uppercase text-slate-400 font-semibold">Day Sales</p>
                <p className="text-lg font-bold text-violet-300">₹{selectedDateSales}</p>
              </div>
            </div>
          )}
        </div>

        <div className="premium-card rounded-2xl shadow-2xl overflow-hidden border border-slate-700/70">
          <table className="w-full text-left">
            <thead className="bg-slate-900 text-slate-100">
              <tr>
                <th className="p-3 sm:p-4 uppercase font-black text-sm sm:text-base">Date</th>
                <th className="p-3 sm:p-4 uppercase font-black text-sm sm:text-base">Customer</th>
                <th className="p-3 sm:p-4 uppercase font-black text-sm sm:text-base">Items Summary</th>
                <th className="p-3 sm:p-4 uppercase font-black text-sm sm:text-base">Method</th>
                <th className="p-3 sm:p-4 uppercase font-black text-sm sm:text-base text-right">Total</th>
                <th className="p-3 sm:p-4 uppercase font-black text-sm sm:text-base text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {filteredOrders.length === 0 ? (
                <tr><td colSpan="6" className="p-6 text-center text-slate-400">No orders found</td></tr>
              ) : filteredOrders.map((order, index) => (
                <tr key={order._id} className={`${index % 2 === 0 ? 'bg-slate-950/50' : 'bg-slate-900/50'} hover:bg-slate-800/50 transition-colors`}>
                  <td className="p-3 sm:p-4 font-semibold text-slate-100 text-sm sm:text-base">{new Date(order.createdAt).toLocaleDateString()}</td>
                  <td className="p-3 sm:p-4">
                    <div className="font-semibold text-slate-100 text-sm sm:text-base">{order.mobile || "GUEST"}</div>
                    <div className="text-xs font-medium text-slate-400 font-mono">{order.billId || order._id}</div>
                  </td>
                  <td className="p-3 sm:p-4">
                    <div className="flex flex-wrap gap-1">
                      {order.items.map((item, i) => (
                        <span key={i} className="bg-slate-700/70 text-slate-100 px-2 py-1 rounded text-xs font-semibold border border-slate-600/50">
                          {item.name} x{item.qty}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="p-3 sm:p-4">
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${order.paymentMethod === 'UPI' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}`}>
                      {order.paymentMethod || "CASH"}
                    </span>
                  </td>
                  <td className="p-3 sm:p-4 text-right">
                    <div className="font-bold text-sm sm:text-base text-emerald-300">₹{order.finalTotal}</div>
                  </td>
                  <td className="p-3 sm:p-4 text-center">
                    <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-3">
                      <button
                        onClick={() => printBill(order)}
                        className="premium-button bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 px-4 py-2 rounded-xl font-bold hover:from-cyan-300 hover:to-blue-400 transition-all text-sm sm:text-base"
                      >
                        PRINT 🖨️
                      </button>
                      <button
                        onClick={() => setConfirm({ show: true, id: order._id })}
                        className="premium-button bg-gradient-to-r from-rose-400 to-red-500 text-slate-950 px-4 py-2 rounded-xl font-bold hover:from-rose-300 hover:to-red-400 transition-all text-sm sm:text-base"
                      >
                        DELETE 🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CUSTOM CONFIRM */}
      {confirm.show && (
        <div className="fixed inset-0 flex items-center justify-center z-[100] bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white p-6 rounded-2xl max-w-sm w-full shadow-2xl text-center border border-gray-100">
            <h2 className="text-2xl font-bold mb-2 text-red-600">Confirm Delete</h2>
            <p className="text-gray-700 mb-6 font-medium">Are you sure you want to delete this order?</p>
            <div className="flex gap-4">
              <button 
                onClick={() => deleteOrderAction(confirm.id)} 
                className="flex-1 bg-red-600 text-white py-2.5 rounded-xl font-bold hover:bg-red-700 transition-colors"
              >
                YES
              </button>
              <button onClick={() => setConfirm({ show: false, id: null })} className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-xl font-bold hover:bg-gray-200 transition-colors">NO</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
