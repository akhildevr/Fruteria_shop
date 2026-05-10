import { useEffect, useState } from "react";
import axios from "axios";

const Products = () => {

  const [products, setProducts] = useState([]);

  const [form, setForm] = useState({
    name: "",
    price: "",
    category: "Juice"
  });

  useEffect(() => {

    fetchProducts();

  }, []);


  // FETCH PRODUCTS
  const fetchProducts = async () => {

    const res = await axios.get(
      `${import.meta.env.VITE_API_URL}/products`
    );

    setProducts(res.data);
  };


  // ADD PRODUCT
  const addProduct = async () => {

    if (!form.name || !form.price) {
      return alert("Enter all fields");
    }

    await axios.post(
      `${import.meta.env.VITE_API_URL}/products`,
      form
    );

    alert("Product Added");

    setForm({
      name: "",
      price: "",
      category: "Juice"
    });

    fetchProducts();
  };


  // DELETE PRODUCT
  const deleteProduct = async (id) => {

    const confirmDelete =
      window.confirm(
        "Delete this item?"
      );

    if (!confirmDelete) return;

    await axios.delete(
      `${import.meta.env.VITE_API_URL}/products/${id}`
    );

    fetchProducts();
  };


  return (

    <div className="p-5">

      <h1 className="text-3xl font-bold mb-5">
        Product Management
      </h1>


      {/* ADD PRODUCT FORM */}

      <div className="bg-white shadow p-5 rounded-xl mb-10">

        <h2 className="text-xl mb-4">
          Add New Juice
        </h2>

        <div className="grid grid-cols-3 gap-4">

          <input
            type="text"
            placeholder="Juice Name"
            value={form.name}
            onChange={(e) =>
              setForm({
                ...form,
                name: e.target.value
              })
            }
            className="border p-3 rounded-lg"
          />

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
            className="border p-3 rounded-lg"
          />

          <select
            value={form.category}
            onChange={(e) =>
              setForm({
                ...form,
                category: e.target.value
              })
            }
            className="border p-3 rounded-lg"
          >
            <option>Juice</option>
            <option>Shake</option>
            <option>Mojito</option>
          </select>

        </div>

        <button
          onClick={addProduct}
          className="bg-green-500 text-white px-5 py-3 rounded-xl mt-5"
        >
          Add Product
        </button>

      </div>


      {/* PRODUCT LIST */}

      <div className="bg-white shadow rounded-xl p-5">

        <table className="w-full">

          <thead>

            <tr className="border-b">

              <th className="text-left p-3">
                Name
              </th>

              <th className="text-left p-3">
                Price
              </th>

              <th className="text-left p-3">
                Category
              </th>

              <th className="text-left p-3">
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

                <td className="p-3">
                  {product.name}
                </td>

                <td className="p-3">
                  ₹{product.price}
                </td>

                <td className="p-3">
                  {product.category}
                </td>

                <td className="p-3">

                  <button
                    onClick={() =>
                      deleteProduct(product._id)
                    }
                    className="bg-red-500 text-white px-3 py-2 rounded-lg"
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