import { useEffect, useState } from "react";
import { fetchProducts, addProduct, updateProduct, deleteProduct } from "../utils/api";
import AdminNavbar from "./AdminNavbar";

const Products = () => {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ id: "", name: "", price: "", category: "Juice" });
  const [editing, setEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

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
    if (!form.name || !form.price) return alert("Enter all fields");
    try {
      if (editing) {
        await updateProduct(form.id, form);
        alert("Product Updated");
      } else {
        await addProduct(form);
        alert("Product Added");
      }
      setForm({ id: "", name: "", price: "", category: "Juice" });
      setEditing(false);
      fetchProductsData();
    } catch (error) {
      alert("Error Saving Product");
    }
  };

  const editProduct = (product) => {
    setEditing(true);
    setForm({ id: product._id, name: product.name, price: product.price, category: product.category });
  };

  const deleteProductAction = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    try {
      await deleteProduct(id);
      fetchProductsData();
    } catch (error) {
      alert("Error deleting product");
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-100 p-6 text-black">
      <AdminNavbar />
      <h1 className="text-4xl font-black mb-8 border-b-4 border-black pb-2 uppercase tracking-tighter">Product Management</h1>

      {/* FORM */}
      <div className="bg-white shadow-xl rounded-3xl p-8 mb-10 border-4 border-black">
        <h2 className="text-3xl font-black mb-6 uppercase italic">
          {editing ? "✏️ Edit Item" : "➕ Add New Item"}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block font-black mb-1 uppercase">Name</label>
            <input
              type="text"
              placeholder="Juice/Shake Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full bg-gray-50 border-4 border-black p-4 rounded-xl text-xl font-bold focus:bg-white outline-none"
            />
          </div>
          <div>
            <label className="block font-black mb-1 uppercase">Price (₹)</label>
            <input
              type="number"
              placeholder="Price"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              className="w-full bg-gray-50 border-4 border-black p-4 rounded-xl text-xl font-bold focus:bg-white outline-none"
            />
          </div>
          <div>
            <label className="block font-black mb-1 uppercase">Category</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full bg-gray-50 border-4 border-black p-4 rounded-xl text-xl font-bold focus:bg-white outline-none"
            >
              <option>Juice</option>
              <option>Shake</option>
              <option>Mojito</option>
              <option>Ice Cream</option>
            </select>
          </div>
        </div>

        <div className="flex gap-4 mt-8">
          <button onClick={saveProductAction} className="bg-green-500 hover:bg-green-400 text-black px-10 py-4 rounded-2xl text-2xl font-black shadow-lg active:scale-95 transition-all">
            {editing ? "UPDATE PRODUCT" : "ADD PRODUCT"}
          </button>
          {editing && (
            <button onClick={() => { setEditing(false); setForm({ id: "", name: "", price: "", category: "Juice" }); }} className="bg-gray-400 hover:bg-gray-300 text-black px-10 py-4 rounded-2xl text-2xl font-black shadow-lg">
              CANCEL
            </button>
          )}
        </div>
      </div>

      {/* SEARCH */}
      <div className="mb-8">
        <label className="block font-black mb-2 uppercase text-xl">Quick Search</label>
        <input 
          type="text" 
          placeholder="🔍 Search name or category..."
          className="w-full md:w-1/2 bg-white border-4 border-black p-5 rounded-2xl text-2xl font-bold shadow-md outline-none"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border-4 border-black">
        <table className="w-full text-left">
          <thead className="bg-black text-white">
            <tr>
              <th className="p-5 text-xl font-black uppercase">Product</th>
              <th className="p-5 text-xl font-black uppercase">Category</th>
              <th className="p-5 text-xl font-black uppercase text-right">Price</th>
              <th className="p-5 text-xl font-black uppercase text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y-4 divide-gray-100 font-bold">
            {filteredProducts.map((product, index) => (
              <tr key={product._id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors`}>
                <td className="p-5 text-2xl font-black">{product.name}</td>
                <td className="p-5 text-lg uppercase opacity-60">{product.category}</td>
                <td className="p-5 text-2xl font-black text-right text-green-700">₹{product.price}</td>
                <td className="p-5 text-center">
                  <div className="flex justify-center gap-3">
                    <button onClick={() => editProduct(product)} className="bg-blue-600 text-white px-6 py-2 rounded-xl font-black hover:bg-blue-500 active:scale-90 transition-all">EDIT</button>
                    <button onClick={() => deleteProductAction(product._id)} className="bg-red-600 text-white px-6 py-2 rounded-xl font-black hover:bg-red-500 active:scale-90 transition-all">DELETE</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Products;
