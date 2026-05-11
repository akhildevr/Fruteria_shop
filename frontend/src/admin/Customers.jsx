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
    <div className="min-h-screen text-slate-100 px-3 py-4" style={{ background: "radial-gradient(circle at top, rgba(56,189,248,0.15), transparent 30%), linear-gradient(180deg, #020617 0%, #060d19 50%, #020616 100%)" }}>
      <AdminNavbar />
      <h1 className="font-extrabold text-center tracking-tight text-amber-300 mb-8" style={{ fontSize: "clamp(2.2rem, 6vw, 3rem)" }}>Customer Rewards</h1>

      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-6">
          <label className="block font-semibold mb-2 uppercase text-slate-100 text-lg sm:text-xl tracking-[0.14em]">Search Customer</label>
          <input 
            type="text" 
            placeholder="🔍 Type Mobile Number..."
            className="premium-input w-full md:w-1/2 px-4 py-3 text-[clamp(0.9rem,2.2vw,1.2rem)] font-semibold"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="premium-card rounded-2xl shadow-2xl overflow-hidden border border-slate-700/70">
          <table className="w-full text-left">
            <thead className="bg-slate-900 text-slate-100">
              <tr>
                <th className="p-4 sm:p-6 text-sm sm:text-lg font-black uppercase">Mobile Number</th>
                <th className="p-4 sm:p-6 text-sm sm:text-lg font-black uppercase">Reward Balance</th>
                <th className="p-4 sm:p-6 text-sm sm:text-lg font-black uppercase">Total Purchases</th>
                <th className="p-4 sm:p-6 text-sm sm:text-lg font-black uppercase text-right">Total Spent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {filteredCustomers.length > 0 ? (
                filteredCustomers.map((customer, index) => (
                  <tr key={customer._id} className={`${index % 2 === 0 ? 'bg-slate-950/50' : 'bg-slate-900/50'} hover:bg-slate-800/50 transition-colors`}>
                    <td className="p-4 sm:p-6 text-lg sm:text-xl font-black tracking-widest text-slate-100">{customer.mobile}</td>
                    <td className="p-4 sm:p-6">
                      <span className="bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 px-4 sm:px-6 py-2 rounded-full font-black text-sm sm:text-lg border border-amber-300/50">
                        {customer.rewardPoints} PTS
                      </span>
                    </td>
                    <td className="p-4 sm:p-6 text-sm sm:text-lg font-semibold text-slate-100">{customer.purchaseCount || 0} Orders</td>
                    <td className="p-4 sm:p-6 text-right text-lg sm:text-xl font-black text-emerald-300">₹{(customer.totalSpent || 0).toFixed(2)}</td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="4" className="p-10 sm:p-20 text-center text-lg sm:text-2xl font-black text-slate-400 italic uppercase">No customers found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Customers;
