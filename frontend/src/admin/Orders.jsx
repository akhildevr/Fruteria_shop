import { useEffect, useState } from "react";
import { fetchOrders, deleteOrder } from "../utils/api";
import AdminNavbar from "./AdminNavbar";

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [confirm, setConfirm] = useState({ show: false, id: null });

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

  const deleteOrderAction = async (id) => {
    try {
      await deleteOrder(id);
      fetchOrdersData();
      setConfirm({ show: false, id: null });
    } catch (error) {
      console.error("Error deleting order", error);
    }
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
                <th className="p-3 sm:p-4 uppercase font-black text-sm sm:text-base">Date</th>
                <th className="p-3 sm:p-4 uppercase font-black text-sm sm:text-base">Customer</th>
                <th className="p-3 sm:p-4 uppercase font-black text-sm sm:text-base">Items Summary</th>
                <th className="p-3 sm:p-4 uppercase font-black text-sm sm:text-base text-right">Total</th>
                <th className="p-3 sm:p-4 uppercase font-black text-sm sm:text-base text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {filteredOrders.map((order, index) => (
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
