import { useEffect, useState } from "react";
import { fetchPurchases, addPurchase, deletePurchase } from "../utils/api";
import AdminNavbar from "./AdminNavbar";

const Purchase = () => {
  const [purchases, setPurchases] = useState([]);
  const [form, setForm] = useState({ itemName: "", quantity: "", price: "", date: new Date().toISOString().split('T')[0] });
  const [searchTerm, setSearchTerm] = useState("");
  const [alert, setAlert] = useState({ show: false, message: "" });
  const [confirm, setConfirm] = useState({ show: false, id: null });

  useEffect(() => { fetchPurchasesData(); }, []);

  const fetchPurchasesData = async () => {
    try {
      const res = await fetchPurchases();
      setPurchases(res.data);
    } catch (error) {
      console.error("Fetch purchases failed:", error);
    }
  };

  const savePurchaseAction = async () => {
    if (!form.itemName || !form.quantity || !form.price || !form.date) {
      return setAlert({ show: true, message: "Please fill all fields" });
    }
    try {
      await addPurchase(form);
      setAlert({ show: true, message: "Purchase Recorded Successfully" });
      setForm({ itemName: "", quantity: "", price: "", date: new Date().toISOString().split('T')[0] });
      fetchPurchasesData();
    } catch (error) {
      setAlert({ show: true, message: "Error Saving Purchase" });
    }
  };

  const deletePurchaseAction = async (id) => {
    try {
      await deletePurchase(id);
      fetchPurchasesData();
      setConfirm({ show: false, id: null });
    } catch (error) {
      setAlert({ show: true, message: "Error deleting purchase" });
    }
  };

  const filteredPurchases = purchases.filter(p => 
    p.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.date.includes(searchTerm)
  );

  return (
    <div className="min-h-screen text-slate-100 px-3 py-4" style={{ background: "radial-gradient(circle at top, rgba(56,189,248,0.15), transparent 30%), linear-gradient(180deg, #020617 0%, #060d19 50%, #020616 100%)" }}>
      <AdminNavbar />
      <h1 className="font-extrabold text-center tracking-tight text-amber-300 mb-8" style={{ fontSize: "clamp(2.2rem, 6vw, 3rem)" }}>Purchase Management</h1>

      <div className="mx-auto w-full max-w-6xl space-y-6">
        {/* ADD PURCHASE FORM */}
        <div className="premium-card p-4 sm:p-6 shadow-2xl border border-slate-700/70">
          <h2 className="font-semibold mb-4 uppercase text-slate-100 text-sm sm:text-base tracking-[0.14em]">📦 Record New Purchase</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block font-semibold mb-2 text-slate-300 text-xs uppercase">Item Name</label>
              <input
                type="text"
                placeholder="e.g. Milk, Fruits"
                value={form.itemName}
                onChange={(e) => setForm({ ...form, itemName: e.target.value })}
                className="premium-input w-full px-4 py-2 text-sm font-semibold"
              />
            </div>
            <div>
              <label className="block font-semibold mb-2 text-slate-300 text-xs uppercase">Quantity</label>
              <input
                type="text"
                placeholder="e.g. 10kg, 5L"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                className="premium-input w-full px-4 py-2 text-sm font-semibold"
              />
            </div>
            <div>
              <label className="block font-semibold mb-2 text-slate-300 text-xs uppercase">Cost (₹)</label>
              <input
                type="number"
                placeholder="Price"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="premium-input w-full px-4 py-2 text-sm font-semibold"
              />
            </div>
            <div>
              <label className="block font-semibold mb-2 text-slate-300 text-xs uppercase">Date</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="premium-input w-full px-4 py-2 text-sm font-semibold"
              />
            </div>
          </div>
          <button onClick={savePurchaseAction} className="mt-6 premium-button px-8 py-3 bg-gradient-to-r from-emerald-400 to-teal-500 text-slate-950 text-lg font-black shadow-lg transition-all w-full sm:w-auto">
            RECORD PURCHASE
          </button>
        </div>

        {/* LIST SECTION */}
        <div className="mb-6">
          <label className="block font-semibold mb-2 uppercase text-slate-100 text-lg sm:text-xl tracking-[0.14em]">History Search</label>
          <input 
            type="text" 
            placeholder="🔍 Search item or date (YYYY-MM-DD)..."
            className="premium-input w-full md:w-1/2 px-4 py-3 text-sm font-semibold"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="premium-card rounded-2xl shadow-2xl overflow-hidden border border-slate-700/70">
          <table className="w-full text-left">
            <thead className="bg-slate-900 text-slate-100">
              <tr>
                <th className="p-3 sm:p-4 uppercase font-black text-sm">Date</th>
                <th className="p-3 sm:p-4 uppercase font-black text-sm">Item</th>
                <th className="p-3 sm:p-4 uppercase font-black text-sm">Qty</th>
                <th className="p-3 sm:p-4 uppercase font-black text-sm text-right">Cost</th>
                <th className="p-3 sm:p-4 uppercase font-black text-sm text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {filteredPurchases.map((p, index) => (
                <tr key={p._id} className={`${index % 2 === 0 ? 'bg-slate-950/50' : 'bg-slate-900/50'} hover:bg-slate-800/50`}>
                  <td className="p-3 sm:p-4 text-sm font-semibold">{new Date(p.date).toLocaleDateString()}</td>
                  <td className="p-3 sm:p-4 text-sm font-bold text-cyan-300">{p.itemName}</td>
                  <td className="p-3 sm:p-4 text-sm">{p.quantity}</td>
                  <td className="p-3 sm:p-4 text-sm font-bold text-right text-rose-300">₹{p.price}</td>
                  <td className="p-3 sm:p-4 text-center">
                    <button onClick={() => setConfirm({ show: true, id: p._id })} className="bg-rose-500/20 text-rose-400 px-3 py-1 rounded-lg text-xs font-black border border-rose-500/50 hover:bg-rose-500 hover:text-white transition-all">DELETE</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODALS */}
      {alert.show && (
        <div className="fixed inset-0 flex items-center justify-center z-[100] bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white p-6 rounded-2xl max-w-sm w-full text-center">
            <h2 className="text-2xl font-bold mb-2 text-blue-600">Fruteria</h2>
            <p className="text-gray-700 mb-6">{alert.message}</p>
            <button onClick={() => setAlert({ show: false, message: "" })} className="w-full bg-blue-600 text-white py-2 rounded-xl font-bold">OK</button>
          </div>
        </div>
      )}

      {confirm.show && (
        <div className="fixed inset-0 flex items-center justify-center z-[100] bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white p-6 rounded-2xl max-w-sm w-full text-center">
            <h2 className="text-2xl font-bold mb-2 text-red-600">Delete Entry</h2>
            <p className="text-gray-700 mb-6">Remove this purchase record?</p>
            <div className="flex gap-4">
              <button onClick={() => deletePurchaseAction(confirm.id)} className="flex-1 bg-red-600 text-white py-2 rounded-xl font-bold">YES</button>
              <button onClick={() => setConfirm({ show: false, id: null })} className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-xl font-bold">NO</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Purchase;