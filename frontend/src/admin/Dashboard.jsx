import { useEffect, useState } from "react";
import axios from "axios";

const Dashboard = () => {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/orders`);
      setOrders(res.data);
    } catch (error) {
      console.error("Error fetching orders", error);
    }
  };

  const totalSales = orders.reduce((a, b) => a + b.finalTotal, 0);

  return (
    <div className="p-5">
      <h1 className="text-3xl font-bold mb-5">FRUTERIA ADMIN</h1>

      <div className="grid grid-cols-3 gap-5 mb-10">
        <div className="bg-green-500 text-white p-5 rounded-xl">
          Total Sales ₹{totalSales}
        </div>

        <div className="bg-orange-500 text-white p-5 rounded-xl">
          Orders {orders.length}
        </div>
      </div>

      <table className="w-full border">
        <thead>
          <tr>
            <th className="border p-2">Mobile</th>
            <th className="border p-2">Total</th>
          </tr>
        </thead>

        <tbody>
          {orders.map((order) => (
            <tr key={order._id} className="text-center">
              <td className="border p-2">{order.customerMobile || order.mobile}</td>
              <td className="border p-2">₹{order.finalTotal}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Dashboard;
