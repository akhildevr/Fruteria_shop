import { useEffect, useState } from "react";
import axios from "axios";
import AdminNavbar from "./AdminNavbar";

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => { fetchCustomers(); }, []);

  const fetchCustomers = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/customers`);
      setCustomers(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Error fetching customers", error);
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.mobile && c.mobile.includes(searchTerm)
  );

  return (
    <div className="min-h-screen bg-gray-100 p-6 text-black">
      <AdminNavbar />
      <h1 className="text-4xl font-black mb-8 border-b-4 border-black pb-2 uppercase tracking-tighter">Customer Rewards</h1>

      <div className="mb-8">
        <label className="block font-black mb-2 uppercase text-xl text-gray-700">Search Customer</label>
        <input 
          type="text" 
          placeholder="🔍 Type Mobile Number..."
          className="w-full md:w-1/2 bg-white border-4 border-black p-5 rounded-2xl text-3xl font-black shadow-lg outline-none"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border-4 border-black">
        <table className="w-full text-left">
          <thead className="bg-black text-white">
            <tr>
              <th className="p-6 text-xl font-black uppercase">Mobile Number</th>
              <th className="p-6 text-xl font-black uppercase">Reward Balance</th>
              <th className="p-6 text-xl font-black uppercase">Total Purchases</th>
              <th className="p-6 text-xl font-black uppercase text-right">Total Spent</th>
            </tr>
          </thead>
          <tbody className="divide-y-4 divide-gray-100">
            {filteredCustomers.length > 0 ? (
              filteredCustomers.map((customer, index) => (
                <tr key={customer._id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-yellow-50 transition-colors`}>
                  <td className="p-6 text-2xl font-black tracking-widest">{customer.mobile}</td>
                  <td className="p-6">
                    <span className="bg-yellow-400 text-black px-6 py-2 rounded-full font-black text-xl border-2 border-black">
                      {customer.rewardPoints} PTS
                    </span>
                  </td>
                  <td className="p-6 text-xl font-bold">{customer.purchaseCount || 0} Orders</td>
                  <td className="p-6 text-right text-2xl font-black text-green-700">₹{(customer.totalSpent || 0).toFixed(2)}</td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="4" className="p-20 text-center text-3xl font-black text-gray-300 italic uppercase">No customers found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Customers;
