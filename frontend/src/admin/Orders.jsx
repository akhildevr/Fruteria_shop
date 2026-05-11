import { useEffect, useState } from "react";
import { fetchOrders } from "../utils/api";
import AdminNavbar from "./AdminNavbar";

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => { fetchOrdersData(); }, []);

  const fetchOrdersData = async () => {
    try {
      const res = await fetchOrders();
      setOrders(res.data);
    } catch (error) {
      console.error("Error fetching orders", error);
    }
  };

  const printBill = (order) => {
    const receipt = `
================================
          FRUTERIA
================================
Bill ID : ${order.billId || order._id}
Date    : ${new Date(order.createdAt).toLocaleDateString()}
Mobile  : ${order.mobile}
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

  const filteredOrders = orders.filter(order => 
    (order.mobile && order.mobile.includes(searchTerm)) || 
    (order.billId && order.billId.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen text-slate-100 px-3 py-4" style={{ background: "radial-gradient(circle at top, rgba(56,189,248,0.15), transparent 30%), linear-gradient(180deg, #020617 0%, #060d19 50%, #020616 100%)" }}>
      <AdminNavbar />
      <h1 className="font-extrabold text-center tracking-tight text-amber-300 mb-8" style={{ fontSize: "clamp(2.2rem, 6vw, 3rem)" }}>Order History</h1>

      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-6">
          <label className="block font-semibold mb-2 uppercase text-slate-100 text-lg sm:text-xl tracking-[0.14em]">Filter Orders</label>
          <input 
            type="text" 
            placeholder="🔍 Mobile or Bill ID..."
            className="premium-input w-full md:w-1/2 px-4 py-3 text-[clamp(0.9rem,2.2vw,1.2rem)] font-semibold"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="premium-card rounded-2xl shadow-2xl overflow-hidden border border-slate-700/70">
          <table className="w-full text-left">
            <thead className="bg-slate-900 text-slate-100">
              <tr>
                <th className="p-3 sm:p-5 text-sm sm:text-lg font-black uppercase">Date</th>
                <th className="p-3 sm:p-5 text-sm sm:text-lg font-black uppercase">Customer</th>
                <th className="p-3 sm:p-5 text-sm sm:text-lg font-black uppercase">Items Summary</th>
                <th className="p-3 sm:p-5 text-sm sm:text-lg font-black uppercase text-right">Total</th>
                <th className="p-3 sm:p-5 text-sm sm:text-lg font-black uppercase text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {filteredOrders.map((order, index) => (
                <tr key={order._id} className={`${index % 2 === 0 ? 'bg-slate-950/50' : 'bg-slate-900/50'} hover:bg-slate-800/50 transition-colors`}>
                  <td className="p-3 sm:p-5 font-semibold text-slate-100 text-sm sm:text-base">{new Date(order.createdAt).toLocaleDateString()}</td>
                  <td className="p-3 sm:p-5">
                    <div className="font-black text-lg sm:text-xl tracking-tighter text-slate-100">{order.mobile || "GUEST"}</div>
                    <div className="text-xs sm:text-sm font-medium text-slate-400 font-mono">{order.billId || order._id}</div>
                  </td>
                  <td className="p-3 sm:p-5">
                    <div className="flex flex-wrap gap-2">
                      {order.items.map((item, i) => (
                        <span key={i} className="bg-slate-700/70 text-slate-100 px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm font-semibold border border-slate-600/50">
                          {item.name} x{item.qty}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="p-3 sm:p-5 text-right">
                    <div className="text-xl sm:text-2xl font-black text-emerald-300">₹{order.finalTotal}</div>
                  </td>
                  <td className="p-3 sm:p-5 text-center">
                    <button
                      onClick={() => printBill(order)}
                      className="premium-button bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-bold hover:from-cyan-300 hover:to-blue-400 transition-all text-sm sm:text-base"
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
  );
};

export default Orders;
