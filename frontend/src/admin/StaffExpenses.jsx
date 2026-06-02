import { useEffect, useState, useMemo } from "react";
import { fetchStaffExpenses, addStaffExpense, deleteStaffExpense } from "../utils/api";
import AdminNavbar from "./AdminNavbar";
import socket from "../utils/socket";

const StaffExpenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCommon, setIsCommon] = useState(false);
  const [form, setForm] = useState({ staffName: "", type: "Salary", amount: "", date: new Date().toISOString().split('T')[0], description: "" });
  const [alert, setAlert] = useState({ show: false, message: "" });
  const [confirm, setConfirm] = useState({ show: false, id: null });

  useEffect(() => {
    fetchExpenses();
    socket.on("staffExpenseUpdated", fetchExpenses);
    return () => socket.off("staffExpenseUpdated");
  }, []);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const res = await fetchStaffExpenses();
      setExpenses(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Error fetching staff expenses", error);
    } finally {
      setLoading(false);
    }
  };

  const saveExpense = async () => {
    const submission = { 
      ...form, 
      staffName: isCommon ? "Common" : form.staffName,
      amount: Number(form.amount)
    };
    if (!submission.staffName || !submission.date) {
      return setAlert({ show: true, message: "Please fill required fields" });
    }
    if (isNaN(submission.amount) || submission.amount <= 0) {
      return setAlert({ show: true, message: "Please fill required fields" });
    }
    try {
      await addStaffExpense(submission);
      setAlert({ show: true, message: "Expense Recorded" });
      setForm({ staffName: "", type: "Salary", amount: "", date: new Date().toISOString().split('T')[0], description: "" });
      setIsCommon(false);
      fetchExpenses();
    } catch (error) { // Catch and display more specific error from backend
      const errorMessage = error.response?.data?.message || error.message || "Error saving expense";
      setAlert({ show: true, message: errorMessage });
    }
  };

  const deleteExpense = async (id) => {
    try {
      await deleteStaffExpense(id);
      setConfirm({ show: false, id: null });
      fetchExpenses();
    } catch (error) {
      setAlert({ show: true, message: "Error deleting record" });
    }
  };

  const uniqueStaffNames = useMemo(() => {
    const names = new Set();
    (Array.isArray(expenses) ? expenses : []).forEach(e => {
      if (e.staffName && e.staffName !== "Common") {
        names.add(e.staffName);
      }
    });
    return Array.from(names).sort();
  }, [expenses]);

  const analysis = useMemo(() => {
    const byType = { Salary: 0, Food: 0, Room: 0, Other: 0 };
    const byStaff = {};
    (Array.isArray(expenses) ? expenses : []).forEach(e => {
      byType[e.type] = (byType[e.type] || 0) + e.amount;
      byStaff[e.staffName] = (byStaff[e.staffName] || 0) + e.amount;
    });
    return { byType, byStaff };
  }, [expenses]);

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-amber-300 font-bold text-2xl animate-pulse italic">Loading Staff Data...</div>;

  return (
    <div className="min-h-screen text-slate-100 px-3 py-4" style={{ background: "radial-gradient(circle at top, rgba(56,189,248,0.15), transparent 30%), linear-gradient(180deg, #020617 0%, #060d19 50%, #020616 100%)" }}>
      <AdminNavbar />
      <h1 className="font-extrabold text-center tracking-tight text-amber-300 mb-8" style={{ fontSize: "clamp(2.2rem, 6vw, 3rem)" }}>Staff Expenses</h1>

      <div className="mx-auto w-full max-w-6xl grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* FORM SECTION */}
        <div className="lg:col-span-1 space-y-6">
          <div className="premium-card p-6 border border-slate-700/70">
            <h2 className="font-semibold mb-4 uppercase text-slate-100 text-sm tracking-widest">📝 New Record</h2>
            
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <input type="checkbox" checked={isCommon} onChange={(e) => setIsCommon(e.target.checked)} id="common" className="w-4 h-4" />
                <label htmlFor="common" className="text-xs font-bold uppercase text-cyan-400 cursor-pointer">Common Staff Expense (Room/Food)</label>
              </div>

              {!isCommon && (
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Staff Name</label>
                  <select
                    value={form.staffName}
                    onChange={(e) => setForm({ ...form, staffName: e.target.value })}
                    className="premium-input w-full px-4 py-2 text-sm font-semibold bg-slate-900 border border-slate-700 rounded-lg text-slate-100"
                  >
                    <option value="" disabled>Select staff name</option>
                    {uniqueStaffNames.length === 0 ? (
                      <option value="" disabled>No staff names available</option>
                    ) : uniqueStaffNames.map((name) => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Type</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="premium-input w-full px-4 py-2 text-sm font-semibold bg-slate-900 border border-slate-700 rounded-lg text-slate-100">
                    <option>Salary</option>
                    <option>Food</option>
                    <option>Room</option>
                    <option>Advance</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Amount</label>
                  <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="₹" className="premium-input w-full px-4 py-2 text-sm font-semibold" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Date</label>
                <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="premium-input w-full px-4 py-2 text-sm font-semibold" />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Description (Optional)</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="premium-input w-full px-4 py-2 text-sm font-semibold h-20" placeholder="Notes..."></textarea>
              </div>

              <button onClick={saveExpense} className="w-full premium-button py-3 bg-gradient-to-r from-emerald-400 to-teal-500 text-slate-950 font-black rounded-xl">SAVE EXPENSE</button>
            </div>
          </div>

          {/* ANALYSIS SUMMARY */}
          <div className="premium-card p-6 border border-slate-700/70 bg-slate-950/40">
            <h2 className="font-semibold mb-4 uppercase text-amber-300 text-sm tracking-widest">📊 Category Summary</h2>
            <div className="space-y-2">
              {Object.entries(analysis.byType).map(([type, total]) => (
                <div key={type} className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">{type}</span>
                  <span className="font-bold text-slate-100">₹{total.toFixed(2)}</span>
                </div>
              ))}
              <div className="pt-2 border-t border-slate-700 flex justify-between items-center font-black text-emerald-400">
                <span>Grand Total</span>
                <span>₹{Object.values(analysis.byType).reduce((a, b) => a + b, 0).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* LIST & STAFF ANALYSIS SECTION */}
        <div className="lg:col-span-2 space-y-6">
          <div className="premium-card p-6 border border-slate-700/70">
            <h2 className="font-semibold mb-4 uppercase text-slate-100 text-sm tracking-widest">👤 Analysis by Staff</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {Object.entries(analysis.byStaff).map(([name, total]) => (
                <div key={name} className="bg-slate-900/80 p-3 rounded-2xl border border-slate-700/50">
                  <div className="text-[10px] font-black text-cyan-400 uppercase tracking-tighter truncate">{name}</div>
                  <div className="text-lg font-bold text-white">₹{total}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="premium-card rounded-2xl shadow-2xl overflow-hidden border border-slate-700/70">
            <div className="p-4 bg-slate-900 font-black text-sm uppercase tracking-widest text-slate-400 border-b border-slate-700">Expense History</div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-950/50 text-slate-400 text-[10px] uppercase font-bold">
                  <tr>
                    <th className="p-4">Date</th>
                    <th className="p-4">Name</th>
                    <th className="p-4">Description</th>
                    <th className="p-4">Type</th>
                    <th className="p-4 text-right">Amount</th>
                    <th className="p-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {expenses.map((e, index) => (
                    <tr key={e._id} className={`${index % 2 === 0 ? 'bg-slate-950/30' : 'bg-transparent'} hover:bg-slate-800/30 transition-colors`}>
                      <td className="p-4 text-xs font-semibold">{new Date(e.date).toLocaleDateString()}</td>
                      <td className="p-4">
                        <div className={`text-xs font-black ${e.staffName === "Common" ? "text-amber-400" : "text-cyan-300"}`}>{e.staffName}</div>
                      </td>
                      <td className="p-4 text-sm text-slate-300 max-w-xs break-words">{e.description || "—"}</td>
                      <td className="p-4">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700">{e.type}</span>
                      </td>
                      <td className="p-4 text-right font-bold text-rose-300">₹{e.amount}</td>
                      <td className="p-4 text-center">
                        <button onClick={() => setConfirm({ show: true, id: e._id })} className="text-rose-500 hover:text-rose-300 font-black text-[10px] uppercase">Delete</button>
                      </td>
                    </tr>
                  ))}
                  {expenses.length === 0 && (
                    <tr><td colSpan="6" className="p-10 text-center text-slate-500 italic">No records found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* MODALS */}
      {alert.show && (
        <div className="fixed inset-0 flex items-center justify-center z-[100] bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white p-6 rounded-2xl max-w-sm w-full text-center">
            <h2 className="text-2xl font-bold mb-2 text-blue-600">Fruteria</h2>
            <p className="text-gray-700 mb-6 font-medium">{alert.message}</p>
            <button onClick={() => setAlert({ show: false, message: "" })} className="w-full bg-blue-600 text-white py-2.5 rounded-xl font-bold">OK</button>
          </div>
        </div>
      )}

      {confirm.show && (
        <div className="fixed inset-0 flex items-center justify-center z-[100] bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white p-6 rounded-2xl max-w-sm w-full text-center">
            <h2 className="text-2xl font-bold mb-2 text-red-600">Delete Record</h2>
            <p className="text-gray-700 mb-6 font-medium">Permanently delete this staff expense?</p>
            <div className="flex gap-4">
              <button onClick={() => deleteExpense(confirm.id)} className="flex-1 bg-red-600 text-white py-2.5 rounded-xl font-bold">YES</button>
              <button onClick={() => setConfirm({ show: false, id: null })} className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-xl font-bold">NO</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffExpenses;