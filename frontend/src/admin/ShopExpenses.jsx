import { useEffect, useState, useMemo } from 'react';
import AdminNavbar from './AdminNavbar';
import socket from '../utils/socket';
import { fetchShopExpenses, addShopExpense, deleteShopExpense } from '../utils/api';

const ShopExpenses = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewTab, setViewTab] = useState('All'); // All, Shop, EMI, Room
  const [form, setForm] = useState({
    category: 'Shop',
    subcategory: 'Deposit',
    emiName: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: ''
  });
  const [alert, setAlert] = useState({ show: false, message: '' });

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

  useEffect(() => {
    fetchData();
    socket.on('shopExpenseUpdated', fetchData);
    return () => socket.off('shopExpenseUpdated');
  }, []);

  const fetchData = async () => {
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
  };

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
      fetchData();
    } catch (err) {
      setAlert({ show: true, message: 'Error deleting' });
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

  if (loading) return <div className="min-h-screen flex items-center justify-center text-amber-300 font-bold">Loading...</div>;

  return (
    <div className="min-h-screen text-slate-100 px-3 py-4">
      <AdminNavbar />
      <h1 className="font-extrabold text-center tracking-tight text-amber-300 mb-8">Shop Expenses</h1>

      <div className="mx-auto max-w-6xl grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 premium-card p-6 border border-slate-700/70">
          <h2 className="font-semibold mb-4 uppercase text-slate-100 text-sm tracking-widest">➕ New Record</h2>
          <div className="space-y-3">
            <label className="block text-xs font-black uppercase text-slate-400">Category</label>
            <select value={form.category} onChange={(e) => setForm({
              ...form,
              category: e.target.value,
              subcategory: e.target.value === 'EMI' ? '' : 'Deposit',
              emiName: ''
            })} className="premium-input w-full px-4 py-2">
              <option value="Shop">Shop</option>
              <option value="EMI">EMI</option>
              <option value="Room">Room</option>
            </select>

            {['Shop', 'Room'].includes(form.category) && (
              <>
                <label className="block text-xs font-black uppercase text-slate-400">Subcategory</label>
                <select value={form.subcategory} onChange={(e) => setForm({ ...form, subcategory: e.target.value })} className="premium-input w-full px-4 py-2">
                  <option value="Deposit">Deposit</option>
                  <option value="Rent">Rent</option>
                </select>
              </>
            )}

            {form.category === 'EMI' && (
              <>
                <label className="block text-xs font-black uppercase text-slate-400">EMI Name</label>
                <input type="text" value={form.emiName} onChange={(e) => setForm({ ...form, emiName: e.target.value })} className="premium-input w-full px-4 py-2" placeholder="EMI lender or loan name" />
              </>
            )}

            <label className="block text-xs font-black uppercase text-slate-400">Amount</label>
            <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="premium-input w-full px-4 py-2" placeholder="₹" />

            <label className="block text-xs font-black uppercase text-slate-400">Date</label>
            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="premium-input w-full px-4 py-2" />

            <label className="block text-xs font-black uppercase text-slate-400">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="premium-input w-full px-4 py-2 h-24" />

            <button onClick={save} className="w-full premium-button py-3 bg-gradient-to-r from-emerald-400 to-teal-500 text-slate-950 font-black rounded-xl">SAVE</button>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
            <div className="premium-card p-4 border border-slate-700/70">
              <div className="text-sm uppercase tracking-[0.2em] text-slate-500 mb-2">Overall EMI Paid</div>
              <div className="text-xl font-black text-emerald-400">₹{totals.emiTotal.toFixed(2)}</div>
            </div>
            <div className="premium-card p-4 border border-slate-700/70">
              <div className="text-sm uppercase tracking-[0.2em] text-slate-500 mb-2">Shop Rent Paid</div>
              <div className="text-xl font-black text-amber-300">₹{totals.shopRentTotal.toFixed(2)}</div>
            </div>
            <div className="premium-card p-4 border border-slate-700/70">
              <div className="text-sm uppercase tracking-[0.2em] text-slate-500 mb-2">Room Rent Paid</div>
              <div className="text-xl font-black text-sky-400">₹{totals.roomRentTotal.toFixed(2)}</div>
            </div>
            <div className="premium-card p-4 border border-slate-700/70">
              <div className="text-sm uppercase tracking-[0.2em] text-slate-500 mb-2">Shop Deposit Paid</div>
              <div className="text-xl font-black text-indigo-400">₹{totals.shopDepositTotal.toFixed(2)}</div>
            </div>
            <div className="premium-card p-4 border border-slate-700/70">
              <div className="text-sm uppercase tracking-[0.2em] text-slate-500 mb-2">Room Deposit Paid</div>
              <div className="text-xl font-black text-pink-400">₹{totals.roomDepositTotal.toFixed(2)}</div>
            </div>
          </div>

          <div className="premium-card p-4 border border-slate-700/70">
            <div className="mb-3 flex gap-3 flex-wrap">
              {['All', 'Shop', 'EMI', 'Room'].map(tab => (
                <button key={tab} onClick={() => setViewTab(tab)} className={`px-4 py-2 rounded-full font-semibold ${viewTab === tab ? 'bg-cyan-400 text-slate-900' : 'bg-slate-900/80 text-slate-200'}`}>
                  {tab}
                </button>
              ))}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-900 text-slate-100">
                  <tr>
                    <th className="p-3">Date</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Details</th>
                    <th className="p-3 text-right">Amount</th>
                    <th className="p-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {filtered.length === 0 ? (
                    <tr><td colSpan="6" className="p-6 text-center text-slate-400">No records</td></tr>
                  ) : filtered.map((it, idx) => (
                    <tr key={it._id} className={`${idx % 2 === 0 ? 'bg-slate-950/30' : 'bg-transparent'}`}>
                      <td className="p-3 text-sm">{new Date(it.date).toLocaleDateString()}</td>
                      <td className="p-3 text-sm font-bold">{it.category}</td>
                      <td className="p-3 text-sm">
                        {it.category === 'EMI' ? it.emiName || '—' : it.subcategory || '—'}
                        {it.description ? ` • ${it.description}` : ''}
                      </td>
                      <td className="p-3 text-right font-bold">₹{it.amount}</td>
                      <td className="p-3 text-center"><button onClick={() => remove(it._id)} className="text-rose-400">Delete</button></td>
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
          <div className="bg-white p-6 rounded-2xl max-w-sm w-full text-center">
            <p className="text-gray-700 mb-4 font-medium">{alert.message}</p>
            <button onClick={() => setAlert({ show: false, message: '' })} className="w-full bg-amber-500 text-slate-900 py-2.5 rounded-xl font-bold">OK</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShopExpenses;
