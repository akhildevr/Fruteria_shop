import { useEffect, useMemo, useState } from "react";
import AdminNavbar from "./AdminNavbar";
import socket from "../utils/socket";
import {
  fetchCreditPurchases,
  addCreditPurchase,
  updateCreditPurchase,
  deleteCreditPurchase,
} from "../utils/api";


const CreditPurchase = () => {

  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    name: "",

    type: "Credit", // Credit | Purchase
    amount: "",
    date: new Date().toISOString().split("T")[0],
    description: "",
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [alert, setAlert] = useState({ show: false, message: "" });
  const [confirm, setConfirm] = useState({ show: false, id: null });

  const [editModal, setEditModal] = useState({ show: false, id: null });
  const [editForm, setEditForm] = useState({
    name: "",
    type: "Credit",
    amount: "",
    date: "",
    description: "",
  });


  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetchCreditPurchases();
      const data = Array.isArray(res.data) ? res.data : [];
      setEntries(data);
    } catch (e) {
      console.error("Fetch credit/purchase failed:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Avoid calling setState synchronously during effect render.
    const init = async () => {
      await fetchData();
    };

    init();

    socket.on("creditPurchaseUpdated", fetchData);
    return () => {
      socket.off("creditPurchaseUpdated", fetchData);
    };
  }, []);


  const filteredEntries = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    let base = entries;
    if (term) {
      base = base.filter((e) => {
        const dateStr = e?.date ? new Date(e.date).toISOString().split("T")[0] : "";
        return (
          (e.name || "").toLowerCase().includes(term) ||
          (e.type || "").toLowerCase().includes(term) ||
          (e.description || "").toLowerCase().includes(term) ||
          String(e.amount ?? "").toLowerCase().includes(term) ||
          dateStr.includes(term)
        );
      });
    }

    if (!fromDate && !toDate) return base;

    let fromMs, toMs;
    if (fromDate && !toDate) {
      fromMs = new Date(fromDate + "T00:00:00").getTime();
      toMs = new Date(fromDate + "T23:59:59").getTime();
    } else if (fromDate && toDate) {
      fromMs = new Date(fromDate + "T00:00:00").getTime();
      toMs = new Date(toDate + "T23:59:59").getTime();
    } else {
      fromMs = new Date(toDate + "T00:00:00").getTime();
      toMs = new Date(toDate + "T23:59:59").getTime();
    }

    return base.filter((e) => {
      const d = new Date(e.date).getTime();
      return d >= fromMs && d <= toMs;
    });
  }, [entries, fromDate, searchTerm, toDate]);

  const totalAmount = useMemo(() => {
    return filteredEntries.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [filteredEntries]);

  const save = async () => {
    const amountNum = Number(form.amount);
    if (!form.name || !form.type) {
      return setAlert({ show: true, message: "Please fill required fields" });
    }
    if (!form.date) {
      return setAlert({ show: true, message: "Please select date" });
    }
    if (!amountNum || amountNum <= 0) {
      return setAlert({ show: true, message: "Amount must be greater than zero" });
    }

    try {
      await addCreditPurchase({
        ...form,
        amount: amountNum,
        description: form.description || "",
      });

      setAlert({ show: true, message: "Saved successfully" });
      setForm({
        name: form.name,
        type: form.type,
        amount: "",
        date: new Date().toISOString().split("T")[0],
        description: "",
      });

      fetchData();
    } catch (e) {
      setAlert({ show: true, message: e?.response?.data?.message || "Error saving" });
    }
  };

  const remove = async (id) => {
    try {
      await deleteCreditPurchase(id);
      setConfirm({ show: false, id: null });
      fetchData();
    } catch (e) {
      setAlert({ show: true, message: e?.response?.data?.message || "Error deleting" });
    }
  };

  const openEdit = (entry) => {
    const dateStr = entry?.date
      ? new Date(entry.date).toISOString().split("T")[0]
      : "";

    setEditForm({
      name: entry?.name || "",
      type: entry?.type || "Credit",
      amount: String(entry?.amount ?? ""),
      date: dateStr,
      description: entry?.description || "",
    });
    setEditModal({ show: true, id: entry._id });
  };

  const update = async () => {
    const amountNum = Number(editForm.amount);

    if (!editForm.name || !editForm.type) {
      return setAlert({ show: true, message: "Please fill required fields" });
    }
    if (!editForm.date) {
      return setAlert({ show: true, message: "Please select date" });
    }
    if (!amountNum || amountNum <= 0) {
      return setAlert({ show: true, message: "Amount must be greater than zero" });
    }

    try {
      await updateCreditPurchase(editModal.id, {
        ...editForm,
        amount: amountNum,
        description: editForm.description || "",
      });
      setEditModal({ show: false, id: null });
      setEditForm({
        name: "",
        type: "Credit",
        amount: "",
        date: "",
        description: "",
      });
      fetchData();
    } catch (e) {
      setAlert({ show: true, message: e?.response?.data?.message || "Error updating" });
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-amber-300 font-bold">
        Loading...
      </div>
    );
  }

  const storedNames = Array.from(
    new Set(entries.map((e) => (e?.name || "").trim()).filter(Boolean))
  );

  return (
    <div className="min-h-screen text-slate-100 px-3 py-4" style={{ background: "radial-gradient(circle at top, rgba(56,189,248,0.15), transparent 30%), linear-gradient(180deg, #020617 0%, #060d19 50%, #020616 100%)" }}>
      <AdminNavbar />
      <h1 className="font-extrabold text-center tracking-tight text-amber-300 mb-8 uppercase">Credit / Purchase Entries</h1>

      <div className="mx-auto w-full max-w-6xl space-y-6">
        <div className="premium-card p-4 sm:p-6 shadow-2xl border border-slate-700/70">
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
                <label className="block font-semibold mb-2 text-slate-200 text-xs uppercase">Name</label>
                <select
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="premium-input w-full px-4 py-2 text-sm font-semibold text-slate-100"
                >

                <option value="" disabled>
                  Select
                </option>
                {storedNames.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>


            <div>
              <label className="block font-semibold mb-2 text-slate-200 text-xs uppercase">Credit / Purchase</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="premium-input w-full px-4 py-2 text-sm font-semibold text-slate-100"
              >

                <option value="Credit">Credit</option>
                <option value="Purchase">Purchase</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-2 text-slate-200 text-xs uppercase">Amount (₹)</label>
              <input
                type="number"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="premium-input w-full px-4 py-2 text-sm font-semibold text-slate-100"
                placeholder="₹"
              />
            </div>


            <div>
              <label className="block font-semibold mb-2 text-slate-200 text-xs uppercase">Date</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="premium-input w-full px-4 py-2 text-sm font-semibold text-slate-100"
              />
            </div>

          </div>

          <div className="mt-4">
            <label className="block font-semibold mb-2 text-slate-200 text-xs uppercase">Description</label>

            <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">

              <div className="lg:col-span-2">
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="premium-input w-full px-4 py-2 text-sm font-semibold text-slate-100"
                  placeholder="e.g. Fruits purchase, advance payment, etc."

                />
              </div>

              <div className="lg:col-span-1">
                <button
                  onClick={save}
                  className="premium-button px-8 py-3 bg-gradient-to-r from-emerald-400 to-teal-500 text-slate-950 text-lg font-black shadow-lg transition-all w-full sm:w-auto"
                >
                  SAVE ENTRY
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="premium-card p-4 sm:p-6 shadow-2xl border border-slate-700/70">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 mb-4">
            <div className="lg:col-span-1">
              <label className="block font-semibold mb-2 uppercase tracking-[0.14em] text-slate-100 text-sm">Search</label>
              <input
                type="text"
                placeholder="🔍 Name / Type / Description / Date"
                className="premium-input w-full px-4 py-3 text-sm font-semibold"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="lg:col-span-2">
              <label className="block font-semibold mb-2 uppercase tracking-[0.14em] text-slate-100 text-sm">Filter by Date</label>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                <div className="flex-1 w-full">
                  <span className="text-xs text-slate-400 mb-1 block">From</span>
                  <input
                    type="date"
                    className="premium-input w-full px-4 py-3 text-sm font-semibold text-slate-100"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                  />
                </div>
                <div className="flex-1 w-full">
                  <span className="text-xs text-slate-400 mb-1 block">To</span>
                  <input
                    type="date"
                    className="premium-input w-full px-4 py-3 text-sm font-semibold text-slate-100"
                    value={toDate}

                    onChange={(e) => setToDate(e.target.value)}
                  />
                </div>
                <button
                  onClick={() => {
                    setFromDate("");
                    setToDate("");
                  }}
                  className="premium-button-secondary bg-slate-900/95 text-slate-100 px-5 py-3 rounded-2xl font-bold border border-slate-600 shadow-lg hover:border-slate-400 transition-all text-sm whitespace-nowrap"
                >
                  CLEAR
                </button>
              </div>
            </div>
          </div>

          <div className="mt-2 pt-4 border-t border-slate-600 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-slate-900/50 p-3 rounded-lg">
              <p className="text-xs uppercase text-slate-400 font-semibold">Entries</p>
              <p className="text-lg font-bold text-emerald-300">{filteredEntries.length}</p>
            </div>
            <div className="bg-slate-900/50 p-3 rounded-lg sm:col-span-2">
              <p className="text-xs uppercase text-slate-400 font-semibold">Total Amount</p>
              <p className="text-lg font-bold text-violet-300">₹{totalAmount.toFixed(2)}</p>
            </div>
          </div>

          <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-700/70">
            <table className="w-full text-left">
              <thead className="bg-slate-900 text-slate-100">
                <tr>
                  <th className="p-3 sm:p-4 uppercase font-black text-sm">Date</th>
                  <th className="p-3 sm:p-4 uppercase font-black text-sm">Name</th>
                  <th className="p-3 sm:p-4 uppercase font-black text-sm">Type</th>
                  <th className="p-3 sm:p-4 uppercase font-black text-sm">Description</th>
                  <th className="p-3 sm:p-4 uppercase font-black text-sm text-right">Amount</th>
                  <th className="p-3 sm:p-4 uppercase font-black text-sm text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {filteredEntries.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-6 text-center text-slate-400 font-semibold">
                      No records
                    </td>
                  </tr>
                ) : (
                  filteredEntries.map((e, idx) => (
                    <tr
                      key={e._id}
                      className={`${idx % 2 === 0 ? "bg-slate-950/50" : "bg-slate-900/50"} hover:bg-slate-800/50`}
                    >
                      <td className="p-3 sm:p-4 text-sm font-semibold">
                        {e.date ? new Date(e.date).toLocaleDateString() : ""}
                      </td>
                      <td className="p-3 sm:p-4 text-sm font-bold text-cyan-300">{e.name}</td>
                      <td className="p-3 sm:p-4 text-sm">
                        <span
                          className={`px-2 py-1 rounded-lg text-[12px] font-bold uppercase border ${
                            e.type === "Credit"
                              ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                              : "bg-amber-500/20 text-amber-300 border-amber-500/30"
                          }`}
                        >
                          {e.type}
                        </span>
                      </td>
                      <td className="p-3 sm:p-4 text-sm text-slate-200">
                        {(e.description || "").slice(0, 60)}{(e.description || "").length > 60 ? "..." : ""}
                      </td>
                      <td className="p-3 sm:p-4 text-sm font-bold text-right text-rose-300">₹{Number(e.amount || 0)}</td>
                      <td className="p-3 sm:p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openEdit(e)}
                            className="bg-indigo-500/20 text-indigo-200 px-3 py-1 rounded-lg text-xs font-black border border-indigo-500/40 hover:bg-indigo-500 hover:text-white transition-all"
                          >
                            UPDATE
                          </button>
                          <button
                            onClick={() => setConfirm({ show: true, id: e._id })}
                            className="bg-rose-500/20 text-rose-400 px-3 py-1 rounded-lg text-xs font-black border border-rose-500/50 hover:bg-rose-500 hover:text-white transition-all"
                          >
                            DELETE
                          </button>
                        </div>
                      </td>

                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

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
            <p className="text-gray-700 mb-6">Remove this record?</p>
            <div className="flex gap-4">
              <button onClick={() => remove(confirm.id)} className="flex-1 bg-red-600 text-white py-2 rounded-xl font-bold">YES</button>
              <button onClick={() => setConfirm({ show: false, id: null })} className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-xl font-bold">NO</button>
            </div>
          </div>
        </div>
      )}

      {editModal.show && (
        <div className="fixed inset-0 flex items-center justify-center z-[100] bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white p-6 rounded-2xl max-w-lg w-full">
            <h2 className="block font-semibold mb-2 text-black text-xs uppercase">Update Entry</h2>

            <div className="space-y-4">
              <div>
                <label className="block font-semibold mb-2 text-slate-700 text-xs uppercase">Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  disabled
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-4 py-2 font-semibold bg-slate-100 text-slate-700 cursor-not-allowed opacity-90"
                />
              </div>

              <div>
                <label className="block font-semibold mb-2 text-slate-700 text-xs uppercase">Credit / Purchase</label>
                <select
                  value={editForm.type}
                  disabled
                  className="w-full border border-slate-300 rounded-xl px-4 py-2 font-semibold bg-slate-100 text-slate-700 cursor-not-allowed"
                >
                  <option value="Credit">Credit</option>
                  <option value="Purchase">Purchase</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-2 text-slate-700 text-xs uppercase">Amount (₹)</label>
                  <input
                    type="number"
                    value={editForm.amount}
                    onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-4 py-2 font-semibold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-2 text-slate-700 text-xs uppercase">Date</label>
                  <input
                    type="date"
                    value={editForm.date}
                    onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-4 py-2 font-semibold text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-2 text-slate-700 text-xs uppercase">Description</label>
                  <input
                    type="text"
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-4 py-2 font-semibold text-slate-900"
                    placeholder="e.g. Fruits purchase, advance payment, etc."
                  />
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={update}
                className="flex-1 bg-indigo-600 text-white py-2 rounded-xl font-bold"
              >
                UPDATE
              </button>
              <button
                onClick={() => {
                  setEditModal({ show: false, id: null });
                }}
                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-xl font-bold"
              >
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};


export default CreditPurchase;

