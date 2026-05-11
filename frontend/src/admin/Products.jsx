import { useEffect, useState } from "react";
import axios from "axios";
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


  // FETCH PRODUCTS
  useEffect(() => {

    fetchProducts();

  }, []);


  const fetchProducts = async () => {
    try {
      console.log("🔄 [FRONTEND] GET /api/products - Fetching products...");
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/products`
      );
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
        console.log("✏️ [FRONTEND] PUT /api/products/" + form.id + " - Updating product...");
        await axios.put(
          `${import.meta.env.VITE_API_URL}/api/products/${form.id}`,
          form
        );
        console.log("✅ [FRONTEND] Product updated successfully");
        alert("Product Updated");
      }
      // CREATE
      else {
        console.log("📝 [FRONTEND] POST /api/products - Creating product...");
        await axios.post(
          `${import.meta.env.VITE_API_URL}/api/products`,
          form
        );
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

      fetchProducts();
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
  const deleteProduct = async (id) => {

    const confirmDelete =
      window.confirm(
        "Delete this product?"
      );

    if (!confirmDelete) return;
    try {
      console.log("🗑️ [FRONTEND] DELETE /api/products/" + id + " - Deleting product...");
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/api/products/${id}`
      );
      console.log("✅ [FRONTEND] Product deleted successfully");
      fetchProducts();
    } catch (error) {
      console.error("❌ [FRONTEND] Delete product failed:", error.message);
      alert("Error deleting product");
    }
  };


  return (

    <div className="p-6">
      <AdminNavbar />

      <h1 className="text-3xl font-bold mb-6">
        Product Management
      </h1>


      {/* FORM */}

      <div className="bg-white shadow-lg rounded-2xl p-6 mb-8">

        <h2 className="text-2xl font-semibold mb-5">

          {editing
            ? "Edit Product"
            : "Add Product"}

        </h2>


        <div className="grid grid-cols-3 gap-4">

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

        <div className="flex gap-4 mt-6">

          <button
            onClick={saveProduct}
            className="bg-green-500 text-white px-6 py-3 rounded-xl"
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


      {/* PRODUCT TABLE */}

      <div className="bg-white shadow-lg rounded-2xl p-6">

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

            {products.map(product => (

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
                      deleteProduct(product._id)
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