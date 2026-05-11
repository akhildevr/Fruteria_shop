import { useEffect, useState } from "react";
import { fetchOrders, fetchTodaySales } from "../utils/api";
import AdminNavbar from "./AdminNavbar";

const Dashboard = () => {
  const [orders, setOrders] = useState([]);
  const [todaySales, setTodaySales] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState("");

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

  const formatOrderDate = (date) => new Date(date).toLocaleDateString("en-CA");

  const selectedDateOrders = selectedDate
    ? orders.filter(order => formatOrderDate(order.createdAt) === selectedDate)
    : orders;

  const selectedDateSales = selectedDateOrders.reduce((a, b) => a + b.finalTotal, 0);

  const filteredOrders = selectedDateOrders.filter(order => 
    (order.mobile && order.mobile.includes(searchTerm)) || 
    (order.billId && order.billId.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen text-slate-100 px-3 py-4" style={{ background: "radial-gradient(circle at top, rgba(56,189,248,0.15), transparent 30%), linear-gradient(180deg, #020617 0%, #060d19 50%, #020616 100%)" }}>
      <AdminNavbar />
      <h1 className="font-extrabold text-center tracking-tight text-amber-300 mb-8" style={{ fontSize: "clamp(2.2rem, 6vw, 3rem)" }}>DASHBOARD</h1>

      <div className="mx-auto w-full max-w-6xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <div className="bg-slate-950/90 p-4 sm:p-6 rounded-[2rem] border border-slate-700/70 shadow-xl text-center">
            <h2 className="text-lg sm:text-xl font-semibold text-slate-100 mb-3 uppercase tracking-[0.14em]">Today's Sales</h2>
            <p className="text-3xl sm:text-4xl font-black text-amber-300">₹{todaySales}</p>
          </div>

          <div className="bg-slate-950/90 p-4 sm:p-6 rounded-[2rem] border border-slate-700/70 shadow-xl text-center">
            <h2 className="text-lg sm:text-xl font-semibold text-slate-100 mb-3 uppercase tracking-[0.14em]">Total Sales</h2>
            <p className="text-3xl sm:text-4xl font-black text-cyan-300">₹{totalSales}</p>
          </div>

          <div className="bg-slate-950/90 p-4 sm:p-6 rounded-[2rem] border border-slate-700/70 shadow-xl text-center">
            <h2 className="text-lg sm:text-xl font-semibold text-slate-100 mb-3 uppercase tracking-[0.14em]">Total Orders</h2>
            <p className="text-3xl sm:text-4xl font-black text-emerald-300">{orders.length}</p>
          </div>

          <div className="bg-slate-950/90 p-4 sm:p-6 rounded-[2rem] border border-slate-700/70 shadow-xl text-center">
            <h2 className="text-lg sm:text-xl font-semibold text-slate-100 mb-3 uppercase tracking-[0.14em]">Day Sales</h2>
            <p className="text-3xl sm:text-4xl font-black text-rose-300">{selectedDate ? `₹${selectedDateSales}` : "—"}</p>
            <p className="text-sm sm:text-base mt-2 text-slate-400">{selectedDate ? `${selectedDateOrders.length} orders` : "Select a date above"}</p>
          </div>
        </div>

        <div className="premium-card p-4 sm:p-6 shadow-2xl border border-slate-700/70">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
            <div>
              <label className="block text-lg sm:text-xl font-semibold text-slate-100 mb-2 uppercase tracking-[0.14em]">Search Transactions</label>
              <input
                type="text"
                placeholder="🔍 Mobile or Bill ID..."
                className="premium-input w-full px-4 py-3 text-[clamp(0.9rem,2.2vw,1.2rem)] font-semibold"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-lg sm:text-xl font-semibold text-slate-100 mb-2 uppercase tracking-[0.14em]">Filter by Day</label>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                <input
                  type="date"
                  className="premium-input flex-1 px-4 py-3 text-[clamp(0.9rem,2.2vw,1.2rem)] font-semibold"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
                {selectedDate && (
                  <button
                    onClick={() => setSelectedDate("")}
                    className="premium-button-secondary bg-slate-900/95 text-slate-100 px-4 py-3 rounded-2xl font-bold border border-slate-600 shadow-lg hover:border-slate-400 transition-all text-sm sm:text-base"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-700/70">
            <table className="w-full text-left">
              <thead className="bg-slate-900 text-slate-100">
                <tr>
                  <th className="p-3 sm:p-4 uppercase font-black text-sm sm:text-base">Date</th>
                  <th className="p-3 sm:p-4 uppercase font-black text-sm sm:text-base">Bill ID</th>
                  <th className="p-3 sm:p-4 uppercase font-black text-sm sm:text-base">Mobile</th>
                  <th className="p-3 sm:p-4 uppercase font-black text-sm sm:text-base text-right">Total</th>
                  <th className="p-3 sm:p-4 uppercase font-black text-sm sm:text-base text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {filteredOrders.map((order, index) => (
                  <tr key={order._id} className={`${index % 2 === 0 ? 'bg-slate-950/50' : 'bg-slate-900/50'} hover:bg-slate-800/50 transition-colors`}>
                    <td className="p-3 sm:p-4 font-semibold text-slate-100 text-sm sm:text-base">{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td className="p-3 sm:p-4 font-mono text-slate-300 text-sm sm:text-base">{order.billId}</td>
                    <td className="p-3 sm:p-4 font-semibold text-slate-100 text-sm sm:text-base">{order.mobile || "GUEST"}</td>
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
