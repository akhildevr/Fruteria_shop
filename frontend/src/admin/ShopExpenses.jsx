import { useEffect, useState, useMemo, useCallback } from 'react';
import AdminNavbar from './AdminNavbar';
import socket from '../utils/socket';
import { fetchShopExpenses, addShopExpense, deleteShopExpense } from '../utils/api';

export const ShopExpensesContent = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewTab, setViewTab] = useState('All');
  const [form, setForm] = useState({
    category: 'Shop',
    subcategory: 'Deposit',
    emiName: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: ''
  });
  const [alert, setAlert] = useState({ show: false, message: '' });
  const [confirm, setConfirm] = useState({ show: false, id: null });

  const normalizeItem = (item) => {
    const category = item.category || (item.type === 'EMI' ? 'EMI' : item.type === 'Room Rent' ? 'Room' : 'Shop');
    const subcategory = item.subcategory || (item.type === 'Room Rent' ? 'Rent' : item.type === 'Rent' ? 'Rent' : undefined);
    return {
      ...item,
      category,
      subcategory,
      emiName: item.emiName || '',
      startMonth: item.startMonth || '',
      endMonth: item.endMonth || ''
    };
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchShopExpenses();
      const data = Array.isArray(res.data) ? res.data : [];
      setItems(data.map(normalizeItem));
    } catch (err) {
      console.error('Error fetching shop expenses', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initialize = async () => {
      await fetchData();
    };
    initialize();
    socket.on('shopExpenseUpdated', fetchData);
    return () => socket.off('shopExpenseUpdated');
  }, [fetchData]);

  const save = async () => {
    const submission = { ...form, amount: Number(form.amount) };
    if (!submission.category || !submission.date || isNaN(submission.amount) || submission.amount <= 0) {
      return setAlert({ show: true, message: 'Please fill required fields' });
    }
    if (submission.category === 'EMI') {
      if (!submission.emiName.trim()) {
        return setAlert({ show: true, message: 'Please provide EMI name' });
      }
    }
    if (['Shop', 'Room'].includes(submission.category) && !['Deposit', 'Rent'].includes(submission.subcategory)) {
      return setAlert({ show: true, message: 'Please select a subcategory' });
    }
    if (submission.category === 'EMI') {
      delete submission.subcategory;
    }
    try {
      await addShopExpense(submission);
      setAlert({ show: true, message: 'Saved' });
      setForm({
        category: 'Shop',
        subcategory: 'Deposit',
        emiName: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        description: ''
      });
      fetchData();
    } catch (err) {
      setAlert({ show: true, message: err.response?.data?.message || err.message || 'Error saving' });
    }
  };

  const remove = async (id) => {
    try {
      await deleteShopExpense(id);
      setConfirm({ show: false, id: null });
      fetchData();
    } catch (err) {
      console.error('Error deleting shop expense', err);
      setAlert({ show: true, message: err.response?.data?.message || err.message || 'Error deleting' });
    }
  };

  const filtered = useMemo(() => {
    if (viewTab === 'All') return items;
    return items.filter(i => i.category === viewTab);
  }, [items, viewTab]);

  const totals = useMemo(() => {
    let emiTotal = 0;
    let shopRentTotal = 0;
    let roomRentTotal = 0;
    let shopDepositTotal = 0;
    let roomDepositTotal = 0;
    items.forEach((item) => {
      if (item.category === 'EMI') {
        emiTotal += Number(item.amount) || 0;
      }
      if (item.category === 'Shop') {
        if (item.subcategory === 'Rent') shopRentTotal += Number(item.amount) || 0;
        if (item.subcategory === 'Deposit') shopDepositTotal += Number(item.amount) || 0;
      }
      if (item.category === 'Room') {
        if (item.subcategory === 'Rent') roomRentTotal += Number(item.amount) || 0;
        if (item.subcategory === 'Deposit') roomDepositTotal += Number(item.amount) || 0;
      }
    });
    return { emiTotal, shopRentTotal, roomRentTotal, shopDepositTotal, roomDepositTotal };
  }, [items]);

  if (loading) return <div className="flex items-center justify-center text-amber-300 font-bold py-20 text-xl animate-pulse italic">Loading Shop Data...</div>;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-black tracking-tight text-amber-300 uppercase">Infrastructure & Management</h2>
{/*         <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Infrastructure & EMI Management</p> */}
      </div>

      <div className="mx-auto max-w-6xl grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1 premium-card p-4 border border-slate-700/70 bg-slate-900/50 backdrop-blur-md">
          <h2 className="text-xs font-black mb-4 uppercase text-slate-100 tracking-widest">➕ New Record</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-[9px] font-black uppercase text-slate-500 mb-1 tracking-wider">Category</label>
              <select value={form.category} onChange={(e) => setForm({
                ...form,
                category: e.target.value,
                subcategory: e.target.value === 'EMI' ? '' : 'Deposit',
                emiName: ''
              })} className="w-full px-3 py-2 text-xs font-bold bg-slate-950 border border-slate-700 rounded-xl text-slate-100 focus:border-amber-400 outline-none transition-colors">
                <option value="Shop">Shop</option>
                <option value="EMI">EMI</option>
                <option value="Room">Room</option>
              </select>
            </div>

            {['Shop', 'Room'].includes(form.category) && (
              <div>
                <label className="block text-[9px] font-black uppercase text-slate-500 mb-1 tracking-wider">Subcategory</label>
                <select value={form.subcategory} onChange={(e) => setForm({ ...form, subcategory: e.target.value })} className="w-full px-3 py-2 text-xs font-bold bg-slate-950 border border-slate-700 rounded-xl text-slate-100 focus:border-amber-400 outline-none transition-colors">
                  <option value="Deposit">Deposit</option>
                  <option value="Rent">Rent</option>
                </select>
              </div>
            )}

            {form.category === 'EMI' && (
              <div>
                <label className="block text-[9px] font-black uppercase text-slate-500 mb-1 tracking-wider">EMI Name</label>
                <input type="text" value={form.emiName} onChange={(e) => setForm({ ...form, emiName: e.target.value })} className="w-full px-3 py-2 text-xs font-bold bg-slate-950 border border-slate-700 rounded-xl text-slate-100 focus:border-amber-400 outline-none transition-colors" placeholder="Lender name" />
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[9px] font-black uppercase text-slate-500 mb-1 tracking-wider">Amount</label>
                <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="w-full px-3 py-2 text-xs font-bold bg-slate-950 border border-slate-700 rounded-xl text-slate-100 focus:border-amber-400 outline-none transition-colors" placeholder="₹" />
              </div>
              <div>
                <label className="block text-[9px] font-black uppercase text-slate-500 mb-1 tracking-wider">Date</label>
                <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full px-3 py-2 text-xs font-bold bg-slate-950 border border-slate-700 rounded-xl text-slate-100 focus:border-amber-400 outline-none transition-colors" />
              </div>
            </div>

            <div>
              <label className="block text-[9px] font-black uppercase text-slate-500 mb-1 tracking-wider">Description</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 text-xs font-bold bg-slate-950 border border-slate-700 rounded-xl text-slate-100 focus:border-amber-400 outline-none transition-colors h-16 resize-none" placeholder="Notes..." />
            </div>

            <button onClick={save} className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all uppercase tracking-widest">SAVE RECORD</button>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            <div className="premium-card p-3 border border-slate-700/70 bg-slate-900/30 flex flex-col justify-center">
              <div className="text-[12px] uppercase tracking-widest text-slate-500 font-black mb-1">Total EMI</div>
              <div className="text-sm font-black text-emerald-400">₹{totals.emiTotal.toLocaleString()}</div>
            </div>
            <div className="premium-card p-3 border border-slate-700/70 bg-slate-900/30 flex flex-col justify-center">
              <div className="text-[12px] uppercase tracking-widest text-slate-500 font-black mb-1">Shop Rent</div>
              <div className="text-sm font-black text-amber-300">₹{totals.shopRentTotal.toLocaleString()}</div>
            </div>
            <div className="premium-card p-3 border border-slate-700/70 bg-slate-900/30 flex flex-col justify-center">
              <div className="text-[12px] uppercase tracking-widest text-slate-500 font-black mb-1">Room Rent</div>
              <div className="text-sm font-black text-sky-400">₹{totals.roomRentTotal.toLocaleString()}</div>
            </div>
            <div className="premium-card p-3 border border-slate-700/70 bg-slate-900/30 flex flex-col justify-center">
              <div className="text-[12px] uppercase tracking-widest text-slate-500 font-black mb-1">Shop Dep.</div>
              <div className="text-sm font-black text-indigo-400">₹{totals.shopDepositTotal.toLocaleString()}</div>
            </div>
            <div className="premium-card p-3 border border-slate-700/70 bg-slate-900/30 flex flex-col justify-center">
              <div className="text-[12px] uppercase tracking-widest text-slate-500 font-black mb-1">Room Dep.</div>
              <div className="text-sm font-black text-pink-400">₹{totals.roomDepositTotal.toLocaleString()}</div>
            </div>
          </div>

          <div className="premium-card p-4 border border-slate-700/70 bg-slate-950/20">
            <div className="mb-4 flex gap-2 flex-wrap">
              {['All', 'Shop', 'EMI', 'Room'].map(tab => (
                <button key={tab} onClick={() => setViewTab(tab)} className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${viewTab === tab ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-900/20' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'}`}>
                  {tab}
                </button>
              ))}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-950/50 text-slate-500 text-[12px] uppercase font-black tracking-wider">
                  <tr>
                    <th className="p-3">Date</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Details</th>
                    <th className="p-3 text-right">Amount</th>
                    <th className="p-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filtered.length === 0 ? (
                    <tr><td colSpan="6" className="p-10 text-center text-slate-600 font-bold uppercase tracking-widest text-xs italic">No records found</td></tr>
                  ) : filtered.map((it, idx) => (
                    <tr key={it._id} className={`${idx % 2 === 0 ? 'bg-slate-900/20' : 'bg-transparent'} hover:bg-slate-800/40 transition-colors group`}>
                      <td className="p-3 text-[11px] font-bold text-slate-400">{new Date(it.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</td>
                      <td className="p-3">
                        <div className="text-[11px] font-black uppercase text-amber-400">{it.category}</div>
                      </td>
                      <td className="p-3 text-[11px] font-medium text-slate-300 max-w-[150px] truncate">
                        {it.category === 'EMI' ? it.emiName || '—' : it.subcategory || '—'}
                        {it.description ? ` • ${it.description}` : ''}
                      </td>
                      <td className="p-3 text-right font-black text-rose-400 text-xs">₹{it.amount.toLocaleString()}</td>
                      <td className="p-3 text-center"><button onClick={() => setConfirm({ show: true, id: it._id })} className="text-rose-500/50 group-hover:text-rose-500 transition-colors font-black text-[11px] uppercase tracking-tighter bg-rose-500/5 px-2 py-1 rounded-lg border border-rose-500/10">Delete</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {alert.show && (
        <div className="fixed inset-0 flex items-center justify-center z-[100] bg-black/60 p-4">
          <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl max-w-sm w-full text-center shadow-2xl">
             <h2 className="text-lg font-black mb-2 text-cyan-400 uppercase tracking-tighter italic">FRUTERIA</h2>
            <p className="text-slate-300 mb-6 font-bold text-sm">{alert.message}</p>
            <button onClick={() => setAlert({ show: false, message: '' })} className="w-full bg-cyan-500 text-slate-950 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-cyan-500/20">OK</button>
          </div>
        </div>
      )}

      {confirm.show && (
        <div className="fixed inset-0 flex items-center justify-center z-[100] bg-black/60 p-4">
          <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl max-w-sm w-full text-center shadow-2xl">
            <h2 className="text-lg font-black mb-2 text-rose-500 uppercase tracking-tighter">Confirm Delete</h2>
            <p className="text-slate-300 mb-6 font-bold text-sm italic">Are you sure? This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirm({ show: false, id: null })} className="flex-1 bg-slate-800 text-slate-300 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest">CANCEL</button>
              <button onClick={() => remove(confirm.id)} className="flex-1 bg-rose-500 text-white py-2.5 rounded-xl font-black text-xs uppercase tracking-widest">DELETE</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ShopExpenses = () => {
  return (
    <div className="min-h-screen text-slate-100 px-3 py-4">
      <AdminNavbar />
      <ShopExpensesContent />
    </div>
  );
};

export default ShopExpenses;
