import { useEffect, useState } from "react";
import axios from "axios";
import AdminNavbar from "./AdminNavbar";

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      console.log("🔄 [FRONTEND] Fetching customers...");
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/customers`);
      setCustomers(Array.isArray(res.data) ? res.data : []);
      console.log("Fetched customers data:", res.data); // Debugging: Check what data is received
    } catch (error) {
      console.error("❌ [FRONTEND] Error fetching customers", error);
    }
  };

  const handleAddPoints = async (mobile) => {
    const points = prompt(`Enter points to add for ${mobile}:`);
    if (!points || isNaN(points)) return;

    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/customers/update-points`, {
        mobile,
        points: parseInt(points)
      });
      alert("Points updated successfully!");
      fetchCustomers();
    } catch (error) {
      console.error("❌ [FRONTEND] Failed to update points", error);
      alert("Error updating points");
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.mobile && c.mobile.includes(searchTerm)
  );
  console.log("Filtered customers for display:", filteredCustomers); // Debugging: Check what data is being displayed

  return (
    <div className="p-6">
      <AdminNavbar />
      <h1 className="text-3xl font-bold mb-6">Customer Rewards</h1>

      <div className="mb-6">
        <input 
          type="text" 
          placeholder="🔍 Search by Mobile Number..." 
          className="w-full md:w-1/3 p-4 border rounded-xl shadow-sm focus:ring-2 focus:ring-green-500 outline-none"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-white shadow-lg rounded-2xl p-4 sm:p-6 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="text-left p-4">Mobile Number</th>
              <th className="text-left p-4">Reward Balance</th>
              <th className="text-left p-4">Total Purchases</th>
              <th className="text-left p-4">Total Spent</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.length > 0 ? (
              filteredCustomers.map((customer) => (
                <tr key={customer._id} className="border-b hover:bg-gray-50 transition-colors">
                  <td className="p-4 font-semibold">{customer.mobile}</td>
                  <td className="p-4">
                    <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full font-bold">
                      {customer.rewardPoints} pts
                    </span>
                  </td>
                  <td className="p-4">{customer.purchaseCount || 0} orders</td>
                  <td className="p-4 font-mono">₹{(customer.totalSpent || 0).toFixed(2)}</td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="4" className="p-10 text-center text-gray-500">No customers found matching your search.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Customers;