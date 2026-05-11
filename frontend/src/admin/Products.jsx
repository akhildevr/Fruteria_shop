import { useEffect, useState } from "react";
import { fetchProducts, addProduct, updateProduct, deleteProduct } from "../utils/api";
import AdminNavbar from "./AdminNavbar";

const Products = () => {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ id: "", name: "", price: "", category: "Juice" });
  const [editing, setEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [alert, setAlert] = useState({ show: false, message: "" });
  const [confirm, setConfirm] = useState({ show: false, id: null });

  useEffect(() => { fetchProductsData(); }, []);

  const fetchProductsData = async () => {
    try {
      const res = await fetchProducts();
      setProducts(res.data);
    } catch (error) {
      console.error("Fetch products failed:", error);
    }
  };

  const saveProductAction = async () => {
    if (!form.name || !form.price) return setAlert({ show: true, message: "Please fill all fields" });
    try {
      if (editing) {
        await updateProduct(form.id, form);
        setAlert({ show: true, message: "Product Updated Successfully" });
      } else {
        await addProduct(form);
        setAlert({ show: true, message: "Product Added Successfully" });
      }
      setForm({ id: "", name: "", price: "", category: "Juice" });
      setEditing(false);
      fetchProductsData();
    } catch (error) {
      setAlert({ show: true, message: "Error Saving Product" });
    }
  };

  const editProduct = (product) => {
    setEditing(true);
    setForm({ id: product._id, name: product.name, price: product.price, category: product.category });
  };

  const deleteProductAction = async (id) => {
    try {
      await deleteProduct(id);
      fetchProductsData();
      setConfirm({ show: false, id: null });
    } catch (error) {
      setAlert({ show: true, message: "Error deleting product" });
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen text-slate-100 px-3 py-4" style={{ background: "radial-gradient(circle at top, rgba(56,189,248,0.15), transparent 30%), linear-gradient(180deg, #020617 0%, #060d19 50%, #020616 100%)" }}>
      <AdminNavbar />
      <h1 className="font-extrabold text-center tracking-tight text-amber-300 mb-8" style={{ fontSize: "clamp(2.2rem, 6vw, 3rem)" }}>Product Management</h1>

      <div className="mx-auto w-full max-w-6xl space-y-6">
        {/* FORM */}
        <div className="premium-card p-4 sm:p-6 shadow-2xl border border-slate-700/70">
          <h2 className="font-semibold mb-2 uppercase text-slate-100 text-sm sm:text-base tracking-[0.14em]">
            {editing ? "✏️ Edit Item" : "➕ Add New Item"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            <div>
              <label className="block font-semibold mb-2 uppercase text-slate-100 text-sm sm:text-base">Name</label>
              <input
                type="text"
                placeholder="Juice/Shake Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="premium-input w-full px-4 py-3 text-[clamp(1rem,2.6vw,1.3rem)] font-semibold"
              />
            </div>
            <div>
              <label className="block font-semibold mb-2 uppercase text-slate-100 text-sm sm:text-base">Price (₹)</label>
              <input
                type="number"
                placeholder="Price"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="premium-input w-full px-4 py-3 text-[clamp(1rem,2.6vw,1.3rem)] font-semibold"
              />
            </div>
            <div>
              <label className="block font-semibold mb-2 uppercase text-slate-100 text-sm sm:text-base">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="premium-input w-full px-4 py-3 text-[clamp(1rem,2.6vw,1.3rem)] font-semibold"
              >
                <option>Juice</option>
                <option>Shake</option>
                <option>Mojito</option>
                <option>Ice Cream</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-6">
            <button onClick={saveProductAction} className="premium-button px-8 py-3 bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 text-slate-950 text-lg sm:text-xl font-black shadow-lg hover:from-cyan-300 hover:to-blue-400 transition-all">
              {editing ? "UPDATE PRODUCT" : "ADD PRODUCT"}
            </button>
            {editing && (
              <button onClick={() => { setEditing(false); setForm({ id: "", name: "", price: "", category: "Juice" }); }} className="premium-button-secondary px-8 py-3 bg-slate-900/95 text-slate-100 text-lg sm:text-xl font-black border border-slate-600 shadow-lg hover:border-slate-400 transition-all">
                CANCEL
              </button>
            )}
          </div>
        </div>

        {/* SEARCH */}
        <div className="mb-6">
          <label className="block font-semibold mb-2 uppercase text-slate-100 text-lg sm:text-xl tracking-[0.14em]">Quick Search</label>
          <input 
            type="text" 
            placeholder="🔍 Search name or category..."
            className="premium-input w-full md:w-1/2 px-4 py-3 text-[clamp(0.9rem,2.2vw,1.2rem)] font-semibold"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* TABLE */}
        <div className="premium-card rounded-2xl shadow-2xl overflow-hidden border border-slate-700/70">
          <table className="w-full text-left">
            <thead className="bg-slate-900 text-slate-100">
              <tr>
                <th className="p-3 sm:p-5 text-sm sm:text-lg font-black uppercase">Product</th>
                <th className="p-3 sm:p-5 text-sm sm:text-lg font-black uppercase">Category</th>
                <th className="p-3 sm:p-5 text-sm sm:text-lg font-black uppercase text-right">Price</th>
                <th className="p-3 sm:p-5 text-sm sm:text-lg font-black uppercase text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {filteredProducts.map((product, index) => (
                <tr key={product._id} className={`${index % 2 === 0 ? 'bg-slate-950/50' : 'bg-slate-900/50'} hover:bg-slate-800/50 transition-colors`}>
                  <td className="p-3 sm:p-5 text-lg sm:text-xl font-black text-slate-100">{product.name}</td>
                  <td className="p-3 sm:p-5 text-sm sm:text-base uppercase text-slate-400">{product.category}</td>
                  <td className="p-3 sm:p-5 text-lg sm:text-xl font-black text-right text-emerald-300">₹{product.price}</td>
                  <td className="p-3 sm:p-5 text-center">
                    <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-3">
                      <button onClick={() => editProduct(product)} className="premium-button bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 text-slate-950 px-4 py-2 rounded-xl font-bold hover:from-amber-300 hover:to-yellow-300 transition-all text-sm sm:text-base">EDIT</button>
                      <button onClick={() => setConfirm({ show: true, id: product._id })} className="premium-button bg-gradient-to-r from-rose-400 to-red-500 text-slate-950 px-4 py-2 rounded-xl font-bold hover:from-rose-300 hover:to-red-400 transition-all text-sm sm:text-base">DELETE</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CUSTOM ALERT */}
      {alert.show && (
        <div className="fixed inset-0 flex items-center justify-center z-[100] bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white p-6 rounded-2xl max-w-sm w-full shadow-2xl text-center border border-gray-100">
            <h2 className="text-2xl font-bold mb-2 text-orange-600">Fruteria</h2>
            <p className="text-gray-700 mb-6 font-medium">{alert.message}</p>
            <button onClick={() => setAlert({ show: false, message: "" })} className="w-full bg-orange-600 text-white py-2.5 rounded-xl font-bold hover:bg-orange-700 transition-colors">OK</button>
          </div>
        </div>
      )}

      {/* CUSTOM CONFIRM */}
      {confirm.show && (
        <div className="fixed inset-0 flex items-center justify-center z-[100] bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white p-6 rounded-2xl max-w-sm w-full shadow-2xl text-center border border-gray-100">
            <h2 className="text-2xl font-bold mb-2 text-red-600">Confirm Delete</h2>
            <p className="text-gray-700 mb-6 font-medium">Are you sure you want to delete this product?</p>
            <div className="flex gap-4">
              <button 
                onClick={() => deleteProductAction(confirm.id)} 
                className="flex-1 bg-red-600 text-white py-2.5 rounded-xl font-bold hover:bg-red-700 transition-colors"
              >
                YES
              </button>
              <button onClick={() => setConfirm({ show: false, id: null })} className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-xl font-bold hover:bg-gray-200 transition-colors">NO</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
