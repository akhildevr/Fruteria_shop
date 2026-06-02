import { useEffect, useState } from "react";
import { fetchCategories, addCategory, deleteCategory } from "../utils/api";
import AdminNavbar from "./AdminNavbar";
import socket from "../utils/socket";

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");
  const [page, setPage] = useState("");
  const [viewPage, setViewPage] = useState("Products");
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ show: false, message: "" });
  const [confirm, setConfirm] = useState({ show: false, id: null });
  const [pageOpen, setPageOpen] = useState({ Products: true, Staff: true });

  useEffect(() => {
    fetchCategoriesData();
    socket.on("categoryUpdated", fetchCategoriesData);

    return () => socket.off("categoryUpdated", fetchCategoriesData);
  }, []);

  const fetchCategoriesData = async () => {
    try {
      setLoading(true);
      const res = await fetchCategories();
      setCategories(res.data);
      // no per-category collapse state anymore
      setPageOpen(prev => ({ Products: prev.Products ?? true, Staff: prev.Staff ?? true }));
    } catch (error) {
      console.error("Fetch categories failed:", error);
      setAlert({ show: true, message: "Unable to load categories" });
    } finally {
      setLoading(false);
    }
  };

  const saveCategory = async () => {
    if (!name.trim()) return setAlert({ show: true, message: "Category name is required" });
    if (!page) return setAlert({ show: true, message: "Please select a page for the category" });
    try {
      await addCategory({ name: name.trim(), page });
      setAlert({ show: true, message: "Category added successfully" });
      setName(""); setPage("");
      fetchCategoriesData();
    } catch (error) {
      const message = error.response?.data?.error || error.message || "Error adding category";
      setAlert({ show: true, message });
    }
  };

  const removeCategory = async (id) => {
    try {
      await deleteCategory(id);
      setConfirm({ show: false, id: null });
      fetchCategoriesData();
    } catch (error) {
      setAlert({ show: true, message: "Error deleting category" });
    }
  };

  return (
    <div className="min-h-screen text-slate-100 px-3 py-4" style={{ background: "radial-gradient(circle at top, rgba(56,189,248,0.15), transparent 30%), linear-gradient(180deg, #020617 0%, #060d19 50%, #020616 100%)" }}>
      <AdminNavbar />
      <h1 className="font-extrabold text-center tracking-tight text-amber-300 mb-8" style={{ fontSize: "clamp(2.2rem, 6vw, 3rem)" }}>Category Management</h1>

      <div className="mx-auto w-full max-w-5xl space-y-6">
        <div className="premium-card p-6 border border-slate-700/70 shadow-2xl">
          <h2 className="font-semibold mb-4 uppercase text-slate-100 text-sm tracking-[0.14em]">➕ Add New Category</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold mb-2 uppercase text-slate-100 text-sm">Category Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. LIME / NAME"
                className="premium-input w-full px-4 py-3 text-sm sm:text-base font-semibold"
              />
            </div>
            <div>
              <label className="block font-semibold mb-2 uppercase text-slate-100 text-sm">For Page</label>
              <select
                value={page}
                onChange={(e) => setPage(e.target.value)}
                className="premium-input w-full px-4 py-3 text-sm sm:text-base font-semibold"
              >
                <option value="" disabled>SELECT PAGE</option>
                <option value="Products">PRODUCTS</option>
                <option value="Staff">STAFF</option>
              </select>
            </div>
            <div className="flex items-end">
              <button onClick={saveCategory} className="w-full premium-button px-4 py-3 bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 text-slate-950 font-black rounded-xl">SAVE CATEGORY</button>
            </div>
          </div>
        </div>

        <div className="premium-card p-6 border border-slate-700/70 shadow-2xl overflow-x-auto">
          <div className="mb-4 flex flex-wrap gap-3">
            {['All', 'Products', 'Staff'].map((item) => (
              <button
                key={item}
                onClick={() => setViewPage(item)}
                className={`px-4 py-2 rounded-full font-semibold transition-all ${viewPage === item ? "bg-cyan-400 text-slate-950 shadow-lg" : "bg-slate-900/90 text-slate-200 border border-slate-700 hover:bg-slate-800"}`}
              >
                {item}
              </button>
            ))}
          </div>
          <h2 className="font-semibold mb-4 uppercase text-slate-100 text-sm tracking-[0.14em]">Stored Categories</h2>

          {loading ? (
            <div className="text-slate-300">Loading categories...</div>
          ) : categories.length === 0 ? (
            <div className="text-slate-400">No categories found. Add one above.</div>
          ) : (
            <div className="space-y-6">
              {(viewPage === 'All' ? ['Products', 'Staff'] : [viewPage]).map((pageName) => {
                const pageCats = categories.filter(c => c.page === pageName);
                const pageIsOpen = pageOpen[pageName] ?? true;

                return (
                  <div key={pageName} className="premium-card p-0 overflow-hidden border border-slate-700/70 shadow-2xl">
                    <button
                      type="button"
                      onClick={() => setPageOpen(prev => ({ ...prev, [pageName]: !pageIsOpen }))}
                      className="w-full flex items-center justify-between bg-slate-950/90 px-5 py-4 text-left text-slate-100 hover:bg-slate-900 transition-colors"
                    >
                      <div>
                        <div className="text-lg sm:text-xl font-black uppercase tracking-[0.2em]">{pageName}</div>
                        <div className="text-sm text-slate-400">{pageCats.length} stored {pageName === 'Staff' ? 'names' : 'categories'}</div>
                      </div>
                      <span className="text-2xl">{pageIsOpen ? '−' : '+'}</span>
                    </button>

                    {pageIsOpen && (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead className="bg-slate-900 text-slate-100">
                            <tr>
                              <th className="p-3 sm:p-4 uppercase font-black text-sm sm:text-base">{pageName === 'Staff' ? 'Name' : 'Category'}</th>
                              <th className="p-3 sm:p-4 uppercase font-black text-sm sm:text-base text-center">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-700">
                            {pageCats.length === 0 ? (
                              <tr>
                                <td colSpan="2" className="p-4 text-center text-slate-400">No entries for {pageName}.</td>
                              </tr>
                            ) : (
                              pageCats.map((category, index) => (
                                <tr key={category._id} className={`${index % 2 === 0 ? 'bg-slate-950/50' : 'bg-slate-900/50'} hover:bg-slate-800/50 transition-colors`}>
                                  <td className="p-3 sm:p-4 font-semibold text-slate-100 text-sm sm:text-base">{category.name}</td>
                                  <td className="p-3 sm:p-4 text-center">
                                    <button onClick={() => setConfirm({ show: true, id: category._id })} className="text-rose-400 hover:text-rose-300 font-black text-sm uppercase">DELETE</button>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {alert.show && (
        <div className="fixed inset-0 flex items-center justify-center z-[100] bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white p-6 rounded-2xl max-w-sm w-full text-center shadow-2xl">
            <h2 className="text-2xl font-bold mb-2 text-amber-500">Fruteria</h2>
            <p className="text-gray-700 mb-6 font-medium">{alert.message}</p>
            <button onClick={() => setAlert({ show: false, message: "" })} className="w-full bg-amber-500 text-slate-950 py-2.5 rounded-xl font-bold">OK</button>
          </div>
        </div>
      )}

      {confirm.show && (
        <div className="fixed inset-0 flex items-center justify-center z-[100] bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white p-6 rounded-2xl max-w-sm w-full text-center shadow-2xl">
            <h2 className="text-2xl font-bold mb-2 text-red-600">Confirm Delete</h2>
            <p className="text-gray-700 mb-6 font-medium">Delete this category permanently?</p>
            <div className="flex gap-4">
              <button onClick={() => removeCategory(confirm.id)} className="flex-1 bg-red-600 text-white py-2.5 rounded-xl font-bold">YES</button>
              <button onClick={() => setConfirm({ show: false, id: null })} className="flex-1 bg-slate-200 text-slate-800 py-2.5 rounded-xl font-bold">NO</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Categories;
