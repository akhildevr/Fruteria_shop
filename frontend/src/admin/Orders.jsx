import { useEffect, useState } from "react";
import axios from "axios";
import AdminNavbar from "./AdminNavbar";

const Orders = () => {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/orders`);
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

Bill ID : ${order._id}

Mobile : ${order.mobile}

--------------------------------

${order.items.map(item => `
${item.name}
${item.qty} x ${item.price}
`).join("")}

--------------------------------

Final Total : ₹${order.finalTotal}

================================
THANK YOU
================================
`;

    const printWindow = window.open("", "_blank");
    printWindow.document.write(`<pre>${receipt}</pre>`);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="p-6">
      <AdminNavbar />
      <h1 className="text-3xl font-bold mb-6">Order History</h1>
      <div className="bg-white shadow-lg rounded-2xl p-6">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left p-4">Date</th>
              <th className="text-left p-4">Mobile</th>
              <th className="text-left p-4">Total</th>
              <th className="text-left p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order._id} className="border-b">
                <td className="p-4">{new Date(order.createdAt).toLocaleDateString()}</td>
                <td className="p-4">{order.mobile}</td>
                <td className="p-4">₹{order.finalTotal}</td>
                <td className="p-4">
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
    </div>
  );
};

export default Orders;
