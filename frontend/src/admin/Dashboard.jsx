import { useEffect, useState } from "react";
import { fetchOrders, fetchTodaySales } from "../utils/api";
import AdminNavbar from "./AdminNavbar";

const Dashboard = () => {
  const [orders, setOrders] = useState([]);
  const [todaySales, setTodaySales] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchOrdersData();
    fetchTodaySalesData();
  }, []);

  const fetchOrdersData = async () => {
    try {
      const res = await fetchOrders();
      setOrders(res.data);
    } catch (error) {
      console.error("Error fetching orders", error);
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
          FRUTERIA
================================
Bill ID : ${order.billId}
Mobile : ${order.mobile}
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

  const filteredOrders = orders.filter(order => 
    (order.mobile && order.mobile.includes(searchTerm)) || 
    (order.billId && order.billId.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gray-100 p-6 text-black">
      <AdminNavbar />
      <h1 className="text-4xl font-black mb-8 border-b-4 border-black pb-2">DASHBOARD</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-green-600 text-white p-8 rounded-3xl shadow-xl border-4 border-black">
          <h2 className="text-2xl font-bold uppercase opacity-80">Today's Sales</h2>
          <p className="text-5xl font-black mt-2">₹{todaySales}</p>
        </div>

        <div className="bg-blue-700 text-white p-8 rounded-3xl shadow-xl border-4 border-black">
          <h2 className="text-2xl font-bold uppercase opacity-80">Total Sales</h2>
          <p className="text-5xl font-black mt-2">₹{totalSales}</p>
        </div>

        <div className="bg-orange-500 text-white p-8 rounded-3xl shadow-xl border-4 border-black">
          <h2 className="text-2xl font-bold uppercase opacity-80">Total Orders</h2>
          <p className="text-5xl font-black mt-2">{orders.length}</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-lg border-2 border-gray-300">
        <div className="mb-6">
          <label className="block text-lg font-bold mb-2 uppercase">Search Transactions</label>
          <input
            type="text"
            placeholder="🔍 Mobile or Bill ID..."
            className="w-full md:w-1/3 bg-gray-50 border-4 border-black p-4 rounded-xl text-xl font-bold outline-none focus:bg-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto rounded-xl border-2 border-black">
          <table className="w-full text-left">
            <thead className="bg-black text-white">
              <tr>
                <th className="p-4 uppercase font-black">Date</th>
                <th className="p-4 uppercase font-black">Bill ID</th>
                <th className="p-4 uppercase font-black">Mobile</th>
                <th className="p-4 uppercase font-black text-right">Total</th>
                <th className="p-4 uppercase font-black text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-gray-200">
              {filteredOrders.map((order, index) => (
                <tr key={order._id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-yellow-50`}>
                  <td className="p-4 font-bold">{new Date(order.createdAt).toLocaleDateString()}</td>
                  <td className="p-4 font-mono text-sm">{order.billId}</td>
                  <td className="p-4 font-black">{order.mobile || "GUEST"}</td>
                  <td className="p-4 font-black text-right text-xl">₹{order.finalTotal}</td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => printBill(order)}
                      className="bg-black text-white px-6 py-2 rounded-xl font-bold hover:bg-gray-800 active:scale-90 transition-all"
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

export default Dashboard;
