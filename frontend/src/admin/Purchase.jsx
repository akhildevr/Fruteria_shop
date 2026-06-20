import { useEffect, useState } from "react";
import { fetchPurchases, addPurchase, deletePurchase } from "../utils/api";
import AdminNavbar from "./AdminNavbar";
import socket from "../utils/socket";

const Purchase = () => {
  const [purchases, setPurchases] = useState([]);
  const [form, setForm] = useState({ itemName: "", quantity: "", unit: "", price: "", date: new Date().toISOString().split('T')[0] });
  const [searchTerm, setSearchTerm] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [alert, setAlert] = useState({ show: false, message: "" });
  const [confirm, setConfirm] = useState({ show: false, id: null });
  const [loading, setLoading] = useState(true);
  const shopName = import.meta.env.VITE_SHOP_NAME || "Shop";

  useEffect(() => { 
    const init = async () => {
      await fetchPurchasesData();
    };
    init();

    socket.on("purchaseUpdated", fetchPurchasesData);

    return () => {
      socket.off("purchaseUpdated");
    };
  }, []);

  const fetchPurchasesData = async () => {
    try {
      setLoading(true);
      const res = await fetchPurchases();
      setPurchases(res.data);
    } catch (error) {
      console.error("Fetch purchases failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const savePurchaseAction = async () => {
    if (!form.itemName || !form.quantity || !form.unit || !form.price || !form.date) {
      return setAlert({ show: true, message: "Please fill all fields" });
    }
    try {
      const submissionData = {
        ...form,
        quantity: `${form.quantity} ${form.unit}`
      };
      await addPurchase(submissionData);
      setAlert({ show: true, message: "Purchase Recorded Successfully" });
      setForm({ itemName: "", quantity: "", unit: "", price: "", date: new Date().toISOString().split('T')[0] });
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

  // Base purchases to display (apply search + date filter)
  const filteredPurchases = (() => {
    const searchFiltered = purchases.filter(p =>
      p.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.date.includes(searchTerm)
    );

    // Apply date filter on top of search
    if (!fromDate && !toDate) {
      return searchFiltered;
    }

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

    return searchFiltered.filter((p) => {
      const d = new Date(p.date).getTime();
      return d >= fromMs && d <= toMs;
    });
  })();

  const totalPurchaseCost = filteredPurchases.reduce((sum, p) => sum + (Number(p.price) || 0), 0);

  const printPurchaseReport = () => {
    // For print, only use date filter (not search)
    const reportPurchases = (() => {
      if (!fromDate && !toDate) {
        return purchases;
      }

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

      return purchases.filter((p) => {
        const d = new Date(p.date).getTime();
        return d >= fromMs && d <= toMs;
      });
    })();

    const reportCost = reportPurchases.reduce((sum, p) => sum + (Number(p.price) || 0), 0);
    const reportRows = reportPurchases.map((p, i) => {
      const orderDate = new Date(p.date);
      const day = String(orderDate.getDate()).padStart(2, '0');
      const month = orderDate.toLocaleString('en-GB', { month: 'short' }).toUpperCase();
      const year = orderDate.getFullYear();
      return `
        <tr>
          <td>${day}-${month}-${year}</td>
          <td>${p.itemName}</td>
          <td>${p.quantity}</td>
          <td class="text-right">₹${p.price}</td>
        </tr>`;
    }).join("");

    const dateRangeLabel = fromDate ? (toDate ? `${fromDate} - ${toDate}` : fromDate) : (toDate ? toDate : "All Dates");

    const html = `
      <html>
        <head>
          <title>${shopName} Purchase Report</title>
          <style>
            @page { size: auto; margin: 0mm; }
            body { font-family: Arial, sans-serif; color: #111; margin: 0; font-size: 11px; line-height: 1.25; }
            .report-container { padding: 20mm; }
            .header { text-align: center; margin-bottom: 18px; }
            .header h1 { margin: 0; font-size: 24px; letter-spacing: 1px; }
            .header p { margin: 4px 0 0; font-size: 12px; color: #333; }
            .summary { width: 100%; margin-bottom: 16px; border-collapse: collapse; }
            .summary td { padding: 6px 8px; font-size: 12px; vertical-align: bottom; }
            .summary .label { font-weight: bold; width: 140px; }
            .report-table { width: 100%; border-collapse: collapse; font-size: 11px; }
            .report-table th { border: 1px solid #ccc; border-bottom: 2px solid #888; padding: 6px 8px; vertical-align: bottom; background: #f5f5f5; text-align: left; }
            .report-table td { padding: 6px 8px; vertical-align: bottom; border-left: 1px solid #ccc; border-right: 1px solid #ccc; }
            .report-table .text-right { text-align: right; }
            .report-table .bold { font-weight: bold; }
            .footer { margin-top: 18px; font-size: 11px; }
          </style>
        </head>
        <body>
          <div class="report-container">
            <div class="header">
              <h1>${shopName.toUpperCase()}</h1>
              <p>Purchase Report</p>
            </div>
            <table class="summary">
              <tr><td class="label">Date</td><td>${dateRangeLabel}</td></tr>
              <tr><td class="label">Total Entries</td><td>${reportPurchases.length}</td></tr>
              <tr><td class="label">Total Cost</td><td>₹${reportCost.toFixed(2)}</td></tr>
            </table>
            <table class="report-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Item</th>
                  <th>Quantity</th>
                  <th class="text-right">Cost</th>
                </tr>
              </thead>
              <tbody>
                ${reportRows}
                <tr>
                  <td colspan="3" class="text-right bold">Grand Total</td>
                  <td class="text-right bold">₹${reportCost.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
            <div class="footer">
              <p>Report generated on: ${new Date().toLocaleString()}</p>
            </div>
          </div>
        </body>
      </html>`;

    const printWindow = window.open("", "_blank");
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  if (loading) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-amber-300 font-bold text-2xl animate-pulse uppercase tracking-widest italic">Loading Purchases...</div>;
  }

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
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Qty"
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  className="premium-input flex-1 px-4 py-2 text-sm font-semibold"
                />
                <select
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}
                  className="premium-input px-2 py-2 text-sm font-semibold bg-slate-900 border border-slate-700 rounded-lg outline-none focus:border-cyan-400 transition-all text-slate-100 cursor-pointer"
                >
                  <option value="">unit</option>
                  <option value="KG">KG</option>
                  <option value="G">G</option>
                  <option value="Ltr">Ltr</option>
                  <option value="PCS">PCS</option>
                </select>
              </div>
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
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-6"></div>
          <button onClick={savePurchaseAction} className="mt-14 premium-button px-8 py-3 bg-gradient-to-r from-emerald-400 to-teal-500 text-slate-950 text-lg font-black shadow-lg transition-all w-full sm:w-auto">
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

        {/* DATE FILTER */}
        <div className="premium-card p-4 sm:p-6 shadow-2xl border border-slate-700/70 mb-6">
          <label className="block text-sm sm:text-base font-semibold text-slate-100 mb-2 uppercase tracking-[0.14em]">Filter by Date Range (From - To)</label>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
            <div className="flex-1 w-full">
              <span className="text-xs text-slate-400 mb-1 block">From Date</span>
              <input
                type="date"
                className="premium-input w-full px-4 py-3 text-[clamp(0.9rem,2.2vw,1.2rem)] font-semibold"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>
            <div className="flex-1 w-full">
              <span className="text-xs text-slate-400 mb-1 block">To Date</span>
              <input
                type="date"
                className="premium-input w-full px-4 py-3 text-[clamp(0.9rem,2.2vw,1.2rem)] font-semibold"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-3 mt-4">
            <button
              onClick={() => {
                setFromDate("");
                setToDate("");
              }}
              className="premium-button-secondary bg-slate-900/95 text-slate-100 px-5 py-3 rounded-2xl font-bold border border-slate-600 shadow-lg hover:border-slate-400 transition-all text-sm sm:text-base whitespace-nowrap flex-1"
            >
              CLEAR
            </button>
            <button
              onClick={printPurchaseReport}
              disabled={!fromDate}
              className={`premium-button bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 px-5 py-3 rounded-2xl font-bold shadow-lg transition-all text-sm sm:text-base whitespace-nowrap flex-1 ${!fromDate ? 'opacity-40 cursor-not-allowed' : 'hover:from-cyan-300 hover:to-blue-400'}`}
            >
              PRINT REPORT 🖨️
            </button>
          </div>

          {fromDate && (
            <div className="mt-4 pt-4 border-t border-slate-600 grid grid-cols-3 gap-3">
              <div className="bg-slate-900/50 p-3 rounded-lg">
                <p className="text-xs uppercase text-slate-400 font-semibold">Date Range</p>
                <p className="text-lg font-bold text-amber-300">
                  {fromDate}{toDate ? ` - ${toDate}` : ""}
                </p>
              </div>
              <div className="bg-slate-900/50 p-3 rounded-lg">
                <p className="text-xs uppercase text-slate-400 font-semibold">Total Entries</p>
                <p className="text-lg font-bold text-emerald-300">{filteredPurchases.length}</p>
              </div>
              <div className="bg-slate-900/50 p-3 rounded-lg">
                <p className="text-xs uppercase text-slate-400 font-semibold">Total Cost</p>
                <p className="text-lg font-bold text-violet-300">₹{totalPurchaseCost.toFixed(2)}</p>
              </div>
            </div>
          )}
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
              {filteredPurchases.length > 0 && (
                <tr className="bg-slate-900/80 font-black border-t-2 border-slate-700">
                  <td colSpan="3" className="p-3 sm:p-4 text-right text-xs sm:text-sm uppercase tracking-[0.2em] text-slate-400">Total Purchase Cost</td>
                  <td className="p-3 sm:p-4 text-right text-base sm:text-lg text-amber-300">₹{totalPurchaseCost.toFixed(2)}</td>
                  <td></td>
                </tr>
              )}
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