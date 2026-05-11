import { useEffect, useState } from "react";
import { fetchProducts, addProduct, updateProduct, deleteProduct } from "../utils/api";
import AdminNavbar from "./AdminNavbar";

const Products = () => {

  const [products, setProducts] = useState([]);

  const [form, setForm] = useState({
    id: "",
    name: "",
    price: "",
    category: "Juice"
  });

  const [editing, setEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");


  // FETCH PRODUCTS
  useEffect(() => {

    fetchProductsData();

  }, []);


  const fetchProductsData = async () => {
    try {
      console.log("🔄 [FRONTEND] Fetching products...");
      const res = await fetchProducts();
      console.log("✅ [FRONTEND] Products received:", res.data.length, "items");
      setProducts(res.data);
    } catch (error) {
      console.error("❌ [FRONTEND] Fetch products failed:", error.message);
    }
  };


  // SAVE PRODUCT
  const saveProduct = async () => {

    if (!form.name || !form.price) {

      return alert("Enter all fields");

    }

    try {

      // UPDATE
      if (editing) {
        console.log("✏️ [FRONTEND] Updating product...");
        await updateProduct(form.id, form);
        console.log("✅ [FRONTEND] Product updated successfully");
        alert("Product Updated");
      }
      // CREATE
      else {
        console.log("📝 [FRONTEND] Adding product...");
        await addProduct(form);
        console.log("✅ [FRONTEND] Product added successfully");
        alert("Product Added");
      }


      // RESET FORM
      setForm({
        id: "",
        name: "",
        price: "",
        category: "Juice"
      });

      setEditing(false);

      fetchProductsData();
    } catch (error) {
      console.error("❌ [FRONTEND] Save product failed:", error.message);
      alert("Error Saving Product");
    }
  };


  // EDIT PRODUCT
  const editProduct = (product) => {

    setEditing(true);

    setForm({

      id: product._id,

      name: product.name,

      price: product.price,

      category: product.category

    });

  };


  // DELETE PRODUCT
  const handleDeleteProduct = async (id) => {

    const confirmDelete =
      window.confirm(
        "Delete this product?"
      );

    if (!confirmDelete) return;
    try {
      console.log("🗑️ [FRONTEND] Deleting product...");
      await deleteProduct(id);
      console.log("✅ [FRONTEND] Product deleted successfully");
      fetchProductsData();
    } catch (error) {
      console.error("❌ [FRONTEND] Delete product failed:", error.message);
      alert("Error deleting product");
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (

    <div className="p-6">
      <AdminNavbar />

      <h1 className="text-2xl sm:text-3xl font-bold mb-6">
        Product Management
      </h1>


      {/* FORM */}

      <div className="bg-white shadow-lg rounded-2xl p-4 sm:p-6 mb-8">

        <h2 className="text-xl sm:text-2xl font-semibold mb-5">

          {editing
            ? "Edit Product"
            : "Add Product"}

        </h2>


        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* NAME */}

          <input
            type="text"
            placeholder="Product Name"
            value={form.name}
            onChange={(e) =>
              setForm({
                ...form,
                name: e.target.value
              })
            }
            className="border p-4 rounded-xl"
          />


          {/* PRICE */}

          <input
            type="number"
            placeholder="Price"
            value={form.price}
            onChange={(e) =>
              setForm({
                ...form,
                price: e.target.value
              })
            }
            className="border p-4 rounded-xl"
          />


          {/* CATEGORY */}

          <select
            value={form.category}
            onChange={(e) =>
              setForm({
                ...form,
                category: e.target.value
              })
            }
            className="border p-4 rounded-xl"
          >
            <option>Juice</option>
            <option>Shake</option>
            <option>Mojito</option>
            <option>Ice Cream</option>
          </select>

        </div>


        {/* BUTTONS */}

        <div className="flex flex-col sm:flex-row gap-4 mt-6">

          <button
            onClick={saveProduct}
            className="bg-green-500 text-white px-6 py-3 rounded-xl font-bold"
          >

            {editing
              ? "Update Product"
              : "Add Product"}

          </button>


          {editing && (

            <button
              onClick={() => {

                setEditing(false);

                setForm({
                  id: "",
                  name: "",
                  price: "",
                  category: "Juice"
                });

              }}
              className="bg-gray-500 text-white px-6 py-3 rounded-xl"
            >
              Cancel
            </button>

          )}

        </div>

      </div>

      <div className="mb-6">
        <input 
          type="text" 
          placeholder="🔍 Search products by name or category..." 
          className="w-full md:w-1/3 p-4 border rounded-xl shadow-sm focus:ring-2 focus:ring-green-500 outline-none"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>


      {/* PRODUCT TABLE */}

      <div className="bg-white shadow-lg rounded-2xl p-4 sm:p-6 overflow-x-auto">

        <table className="w-full">

          <thead>

            <tr className="border-b">

              <th className="text-left p-4">
                Product
              </th>

              <th className="text-left p-4">
                Price
              </th>

              <th className="text-left p-4">
                Category
              </th>

              <th className="text-left p-4">
                Actions
              </th>

            </tr>

          </thead>


          <tbody>

            {filteredProducts.map(product => (

              <tr
                key={product._id}
                className="border-b"
              >

                <td className="p-4">
                  {product.name}
                </td>

                <td className="p-4">
                  ₹{product.price}
                </td>

                <td className="p-4">
                  {product.category}
                </td>

                <td className="p-4 flex gap-3">

                  {/* EDIT */}

                  <button
                    onClick={() =>
                      editProduct(product)
                    }
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg"
                  >
                    Edit
                  </button>


                  {/* DELETE */}

                  <button
                    onClick={() =>
                      handleDeleteProduct(product._id)
                    }
                    className="bg-red-500 text-white px-4 py-2 rounded-lg"
                  >
                    Delete
                  </button>

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