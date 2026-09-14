import { useEffect, useState, useMemo } from "react";
import { fetchStaffExpenses, addStaffExpense, deleteStaffExpense, fetchCategories } from "../utils/api";
import AdminNavbar from "./AdminNavbar";
import socket from "../utils/socket";

export const StaffExpensesContent = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCommon, setIsCommon] = useState(false);
  const [form, setForm] = useState({ staffName: "", type: "Salary", amount: "", date: new Date().toISOString().split('T')[0], description: "" });
  const [alert, setAlert] = useState({ show: false, message: "" });
  const [confirm, setConfirm] = useState({ show: false, id: null });
  const [staffNames, setStaffNames] = useState([]);

  useEffect(() => {
    fetchExpenses();
    fetchStaffNames();
    socket.on("staffExpenseUpdated", fetchExpenses);
    socket.on("categoryUpdated", fetchStaffNames);
    return () => {
      socket.off("staffExpenseUpdated", fetchExpenses);
      socket.off("categoryUpdated", fetchStaffNames);
    };
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

  const fetchStaffNames = async () => {
    try {
      const res = await fetchCategories();
      const data = Array.isArray(res.data) ? res.data : [];
      const names = data
        .filter(c => (c.page || "").toString().trim() === "Staff")
        .map(c => (c.name || "").toString().trim())
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b));
      setStaffNames(names);
    } catch (error) {
      console.error('Error fetching staff names from categories', error);
    }
  };

  const saveExpense = async () => {
    const submission = { 
      ...form, 
      staffName: isCommon ? "Common" : (form.staffName || "").trim(),
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
    } catch (error) {
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

  const uniqueStaffNames = staffNames;

  const analysis = useMemo(() => {
    const byType = { Salary: 0, Food: 0, Room: 0, Other: 0 };
    const byStaff = {};
    (Array.isArray(expenses) ? expenses : []).forEach(e => {
      byType[e.type] = (byType[e.type] || 0) + e.amount;
      byStaff[e.staffName] = (byStaff[e.staffName] || 0) + e.amount;
    });
    return { byType, byStaff };
  }, [expenses]);

  if (loading) return <div className="flex items-center justify-center text-amber-300 font-bold text-xl animate-pulse italic py-20">Loading Staff Data...</div>;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-black tracking-tight text-amber-300 uppercase">Management & Analysis</h2>
{/*         <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Management & Analysis</p> */}
      </div>

      <div className="mx-auto w-full max-w-6xl grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1 space-y-4">
          <div className="premium-card p-4 border border-slate-700/70 bg-slate-900/50 backdrop-blur-md">
            <h2 className="text-xs font-black mb-4 uppercase text-slate-100 tracking-widest">📝 New Record</h2>
            
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <input type="checkbox" checked={isCommon} onChange={(e) => setIsCommon(e.target.checked)} id="common" className="w-3.5 h-3.5 rounded border-slate-700 bg-slate-800 text-cyan-500 focus:ring-0 focus:ring-offset-0" />
                <label htmlFor="common" className="text-[10px] font-black uppercase text-cyan-400 cursor-pointer tracking-tight">Common Expense (Room/Food)</label>
              </div>

              {!isCommon && (
                <div>
                  <label className="block text-[9px] font-black uppercase text-slate-500 mb-1 tracking-wider">Staff Name</label>
                  <select
                    value={form.staffName}
                    onChange={(e) => setForm({ ...form, staffName: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-bold bg-slate-950 border border-slate-700 rounded-xl text-slate-100 focus:border-amber-400 outline-none transition-colors"
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

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[9px] font-black uppercase text-slate-500 mb-1 tracking-wider">Type</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full px-3 py-2 text-xs font-bold bg-slate-950 border border-slate-700 rounded-xl text-slate-100 focus:border-amber-400 outline-none transition-colors">
                    <option>Salary</option>
                    <option>Food</option>
                    <option>Room</option>
                    <option>Advance</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-black uppercase text-slate-500 mb-1 tracking-wider">Amount</label>
                  <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="₹" className="w-full px-3 py-2 text-xs font-bold bg-slate-950 border border-slate-700 rounded-xl text-slate-100 focus:border-amber-400 outline-none transition-colors" />
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-black uppercase text-slate-500 mb-1 tracking-wider">Date</label>
                <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full px-3 py-2 text-xs font-bold bg-slate-950 border border-slate-700 rounded-xl text-slate-100 focus:border-amber-400 outline-none transition-colors" />
              </div>

              <div>
                <label className="block text-[9px] font-black uppercase text-slate-500 mb-1 tracking-wider">Description (Optional)</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 text-xs font-bold bg-slate-950 border border-slate-700 rounded-xl text-slate-100 focus:border-amber-400 outline-none transition-colors h-16 resize-none" placeholder="Notes..."></textarea>
              </div>

              <button onClick={saveExpense} className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all uppercase tracking-widest">SAVE EXPENSE</button>
            </div>
          </div>

          <div className="premium-card p-4 border border-slate-700/70 bg-slate-950/40">
            <h5 className="text-xs font-black mb-4 uppercase text-amber-400 tracking-widest">📊 Category Summary</h5>
            <div className="space-y-2">
              {Object.entries(analysis.byType).map(([type, total]) => (
                <div key={type} className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-bold uppercase tracking-tighter">{type}</span>
                  <span className="font-black text-slate-100">₹{total.toLocaleString()}</span>
                </div>
              ))}
              <div className="pt-2 border-t border-slate-700 flex justify-between items-center font-black text-emerald-400 text-sm">
                <span className="uppercase tracking-tighter">Grand Total</span>
                <span>₹{Object.values(analysis.byType).reduce((a, b) => a + b, 0).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="premium-card p-4 border border-slate-700/70 bg-slate-900/30">
            <h3 className="text-xs font-black mb-4 uppercase text-slate-100 tracking-widest">👤 Analysis by Staff</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Object.entries(analysis.byStaff).map(([name, total]) => (
                <div key={name} className="bg-slate-950/60 p-3 rounded-xl border border-slate-700/50 flex flex-col justify-center">
                  <div className="text-[11px] font-black text-cyan-400 uppercase tracking-tight truncate mb-0.5">{name}</div>
                  <div className="text-sm font-black text-white">₹{total.toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="premium-card rounded-2xl shadow-2xl overflow-hidden border border-slate-700/70 bg-slate-950/20">
            <div className="p-3 bg-slate-900/80 font-black text-[10px] uppercase tracking-widest text-slate-400 border-b border-slate-700 flex justify-between items-center">
              <span>Expense History</span>
              <span className="text-slate-500 font-bold">{expenses.length} Records</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-950/50 text-slate-500 text-[12px] uppercase font-black tracking-wider">
                  <tr>
                    <th className="p-3">Date</th>
                    <th className="p-3">Name</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Notes</th>
                    <th className="p-3 text-right">Amount</th>
                    <th className="p-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {expenses.map((e, index) => (
                    <tr key={e._id} className={`${index % 2 === 0 ? 'bg-slate-900/20' : 'bg-transparent'} hover:bg-slate-800/40 transition-colors group`}>
                      <td className="p-3 text-[11px] font-bold text-slate-400">{new Date(e.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</td>
                      <td className="p-3">
                        <div className={`text-[11px] font-black uppercase ${e.staffName === "Common" ? "text-amber-400" : "text-cyan-300"}`}>{e.staffName}</div>
                      </td>
                      <td className="p-3">
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 uppercase">{e.type}</span>
                      </td>
                      <td className="p-3 text-[10px] font-medium text-slate-400 max-w-[120px] truncate">{e.description || "—"}</td>
                      <td className="p-3 text-right font-black text-rose-400 text-sm">₹{e.amount.toLocaleString()}</td>
                      <td className="p-3 text-center">
                        <button onClick={() => setConfirm({ show: true, id: e._id })} className="text-rose-500/50 group-hover:text-rose-500 transition-colors font-black text-[9px] uppercase tracking-tighter bg-rose-500/5 px-2 py-1 rounded-lg border border-rose-500/10">Delete</button>
                      </td>
                    </tr>
                  ))}
                  {expenses.length === 0 && (
                    <tr><td colSpan="6" className="p-10 text-center text-slate-600 font-bold uppercase tracking-widest text-xs italic">No records found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {alert.show && (
        <div className="fixed inset-0 flex items-center justify-center z-[100] bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl max-w-sm w-full text-center shadow-2xl">
            <h2 className="text-lg font-black mb-2 text-cyan-400 uppercase tracking-tighter italic">FRUTERIA</h2>
            <p className="text-slate-300 mb-6 font-bold text-sm">{alert.message}</p>
            <button onClick={() => setAlert({ show: false, message: "" })} className="w-full bg-cyan-500 text-slate-950 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-cyan-500/20">OK</button>
          </div>
        </div>
      )}

      {confirm.show && (
        <div className="fixed inset-0 flex items-center justify-center z-[100] bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl max-w-sm w-full text-center shadow-2xl">
            <h2 className="text-lg font-black mb-2 text-rose-500 uppercase tracking-tighter">Confirm Delete</h2>
            <p className="text-slate-300 mb-6 font-bold text-sm italic">Permanently remove this record?</p>
            <div className="flex gap-3">
              <button onClick={() => deleteExpense(confirm.id)} className="flex-1 bg-rose-500 text-white py-2.5 rounded-xl font-black text-xs uppercase tracking-widest">YES</button>
              <button onClick={() => setConfirm({ show: false, id: null })} className="flex-1 bg-slate-800 text-slate-300 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest">NO</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StaffExpenses = () => {
  return (
    <div className="min-h-screen text-slate-100 px-3 py-4" style={{ background: "radial-gradient(circle at top, rgba(56,189,248,0.15), transparent 30%), linear-gradient(180deg, #020617 0%, #060d19 50%, #020616 100%)" }}>
      <AdminNavbar />
      <StaffExpensesContent />
    </div>
  );
};

export default StaffExpenses;
