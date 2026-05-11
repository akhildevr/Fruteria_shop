import { useEffect, useState } from "react";
import { fetchOrders, fetchTodaySales } from "../utils/api";
import AdminNavbar from "./AdminNavbar";

const Dashboard = () => {
  const [orders, setOrders] = useState([]);
  const [todaySales, setTodaySales] = useState(0);

  useEffect(() => {
    fetchOrdersData();
    fetchTodaySalesData();
  }, []);

  const fetchOrdersData = async () => {
    try {
      console.log("🔄 [FRONTEND] Fetching all orders...");
      const res = await fetchOrders();
      console.log("✅ [FRONTEND] Orders received:", res.data.length, "orders");
      setOrders(res.data);
    } catch (error) {
      console.error("❌ [FRONTEND] Error fetching orders", error);
    }
  };

  const fetchTodaySalesData = async () => {
    try {
      console.log("🔄 [FRONTEND] Fetching today's sales...");
      const res = await fetchTodaySales();
      console.log("✅ [FRONTEND] Today's sales received: ₹" + res.data.totalSales);
      setTodaySales(res.data.totalSales);
    } catch (error) {
      console.error("❌ [FRONTEND] Error fetching today's sales", error);
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

${order.items
      .map(
        (item) => `
${item.name}
${item.qty} x ${item.price}
`
      )
      .join("")}

--------------------------------

Final Total : ₹${order.finalTotal}

================================
THANK YOU
================================
`;

    const printWindow = window.open("", "_blank");

    if (!printWindow) {
      alert("Unable to open print window. Please allow popups.");
      return;
    }

    printWindow.document.write(`<pre>${receipt}</pre>`);
    printWindow.document.close();
    printWindow.print();
  };

  const totalSales = orders.reduce((a, b) => a + b.finalTotal, 0);

  return (
    <div className="p-5">
      <AdminNavbar />
      <h1 className="text-3xl font-bold mb-5">Dashboard</h1>

      <div className="grid grid-cols-3 gap-5 mb-10 text-left">
        <div className="bg-green-500 text-white p-5 rounded-xl">
          <h2 className="text-xl">Today's Sales</h2>
          <p className="text-3xl font-bold">₹{todaySales}</p>
        </div>

        <div className="bg-blue-500 text-white p-5 rounded-xl">
          <h2 className="text-xl">Total Sales</h2>
          <p className="text-3xl font-bold">₹{totalSales}</p>
        </div>

        <div className="bg-orange-500 text-white p-5 rounded-xl">
          <h2 className="text-xl">Total Orders</h2>
          <p className="text-3xl font-bold">{orders.length}</p>
        </div>
      </div>

      <table className="w-full border">
        <thead>
          <tr>
            <th className="border p-2">Date</th>
            <th className="border p-2">Mobile</th>
            <th className="border p-2">Total</th>
            <th className="border p-2">Action</th>
          </tr>
        </thead>

        <tbody>
          {orders.map((order) => (
            <tr key={order._id} className="text-center">
              <td className="border p-2">
                {new Date(order.createdAt).toLocaleDateString()}
              </td>
              <td className="border p-2">{order.mobile || "Guest"}</td>
              <td className="border p-2">₹{order.finalTotal}</td>
              <td className="border p-2">
                <button
                  onClick={() => printBill(order)}
                  className="bg-black text-white px-4 py-2 rounded-lg"
                >
                  Print
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Dashboard;
