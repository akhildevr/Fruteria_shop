import { useEffect, useState } from "react";
import API from "../utils/api";
import AdminNavbar from "./AdminNavbar";
import socket from "../utils/socket";

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => { 
    fetchCustomers(); 

    socket.on("orderUpdated", fetchCustomers);

    return () => {
      socket.off("orderUpdated");
    };
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await API.get("/customers");
      setCustomers(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Error fetching customers", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-amber-300 font-bold text-2xl animate-pulse uppercase tracking-widest italic">Loading Customers...</div>;
  }

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
                <th className="p-3 sm:p-4 uppercase font-black text-sm sm:text-base">Mobile Number</th>
                <th className="p-3 sm:p-4 uppercase font-black text-sm sm:text-base">Reward Balance</th>
                <th className="p-3 sm:p-4 uppercase font-black text-sm sm:text-base">Total Purchases</th>
                <th className="p-3 sm:p-4 uppercase font-black text-sm sm:text-base text-right">Total Spent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {filteredCustomers.length > 0 ? (
                filteredCustomers.map((customer, index) => (
                  <tr key={customer._id} className={`${index % 2 === 0 ? 'bg-slate-950/50' : 'bg-slate-900/50'} hover:bg-slate-800/50 transition-colors`}>
                    <td className="p-3 sm:p-4 font-semibold text-sm sm:text-base tracking-widest text-slate-100">{customer.mobile}</td>
                    <td className="p-3 sm:p-4">
                      <span className="bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 px-3 py-1 rounded-full font-black text-xs sm:text-sm border border-amber-300/50">
                        {customer.rewardPoints} PTS
                      </span>
                    </td>
                    <td className="p-3 sm:p-4 font-semibold text-sm sm:text-base text-slate-100">{customer.purchaseCount || 0} Orders</td>
                    <td className="p-3 sm:p-4 text-right font-bold text-sm sm:text-base text-emerald-300">₹{(customer.totalSpent || 0).toFixed(2)}</td>
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
