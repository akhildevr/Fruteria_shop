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
    <div className="min-h-screen bg-gray-100 p-6 text-black">
      <AdminNavbar />
      <h1 className="text-4xl font-black mb-8 border-b-4 border-black pb-2 uppercase tracking-tighter">Order History</h1>

      <div className="mb-8">
        <label className="block font-black mb-2 uppercase text-xl text-gray-700">Filter Orders</label>
        <input 
          type="text" 
          placeholder="🔍 Mobile or Bill ID..."
          className="w-full md:w-1/2 bg-white border-4 border-black p-5 rounded-2xl text-2xl font-black shadow-lg outline-none"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border-4 border-black">
        <table className="w-full text-left">
          <thead className="bg-black text-white">
            <tr>
              <th className="p-5 text-xl font-black uppercase">Date</th>
              <th className="p-5 text-xl font-black uppercase">Customer</th>
              <th className="p-5 text-xl font-black uppercase">Items Summary</th>
              <th className="p-5 text-xl font-black uppercase text-right">Total</th>
              <th className="p-5 text-xl font-black uppercase text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y-4 divide-gray-100">
            {filteredOrders.map((order, index) => (
              <tr key={order._id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-green-50 transition-colors`}>
                <td className="p-5 font-black text-xl">{new Date(order.createdAt).toLocaleDateString()}</td>
                <td className="p-5">
                  <div className="font-black text-2xl tracking-tighter">{order.mobile || "GUEST"}</div>
                  <div className="text-xs font-bold text-gray-400 font-mono">{order.billId || order._id}</div>
                </td>
                <td className="p-5">
                  <div className="flex flex-wrap gap-2">
                    {order.items.map((item, i) => (
                      <span key={i} className="bg-gray-200 text-black px-3 py-1 rounded-lg text-sm font-black border border-black/10">
                        {item.name} x{item.qty}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="p-5 text-right">
                  <div className="text-3xl font-black text-green-700">₹{order.finalTotal}</div>
                </td>
                <td className="p-5 text-center">
                  <button
                    onClick={() => printBill(order)}
                    className="bg-black text-white px-8 py-3 rounded-2xl font-black text-lg hover:bg-gray-800 active:scale-90 shadow-lg transition-all"
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
  );
};

export default Orders;
