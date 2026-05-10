import { useEffect, useState } from "react";
import axios from "axios";

const BillingScreen = () => {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [mobile, setMobile] = useState("");
  const [bill, setBill] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/products`);
        setProducts(res.data);
      } catch (error) {
        console.error("Error fetching products", error);
      }
    };
    fetchProducts();
  }, []);

  const addToCart = (product) => {
    const existing = cart.find((item) => item._id === product._id);
    if (existing) {
      setCart(
        cart.map((item) =>
          item._id === product._id ? { ...item, qty: item.qty + 1 } : item
        )
      );
    } else {
      setCart([...cart, { ...product, qty: 1 }]);
    }
  };

  const generateBill = async () => {
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/bills`, {
        customerMobile: mobile,
        items: cart,
      });
      setBill(res.data);
      setCart([]);
      setMobile("");
    } catch (error) {
      console.error("Error generating bill", error);
    }
  };

  return (
    <div className="p-10">
      <input
        className="border p-2 w-full mb-5"
        placeholder="Customer Mobile"
        value={mobile}
        onChange={(e) => setMobile(e.target.value)}
      />

      <div className="grid grid-cols-3 gap-4">
        {products.map((product) => (
          <button
            key={product._id}
            onClick={() => addToCart(product)}
            className="bg-green-500 text-white p-5 rounded-xl"
          >
            <h2>{product.name}</h2>
            <p>₹{product.price}</p>
          </button>
        ))}
      </div>

      <div className="mt-10">
        <h2 className="text-2xl mb-3">Cart</h2>

        {cart.map((item) => (
          <div key={item._id} className="flex justify-between">
            <span>
              {item.name} x {item.qty}
            </span>

            <span>₹{item.price * item.qty}</span>
          </div>
        ))}

        <button
          onClick={generateBill}
          className="bg-black text-white px-5 py-3 mt-5 rounded-xl"
        >
          Generate Bill
        </button>
      </div>

      {bill && (
        <div className="mt-5 bg-yellow-100 p-5 rounded-xl">
          <h2>Final Total: ₹{bill.finalTotal}</h2>

          <p>Discount: ₹{bill.discount}</p>

          <p>Reward Points Earned: {bill.rewardPoints}</p>
        </div>
      )}
    </div>
  );
};

export default BillingScreen;
