import { useEffect, useMemo, useState } from "react";
import { fetchProducts, fetchCustomer, createOrder } from "../utils/api";

const BillingScreen = () => {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState([]);
  const [mobile, setMobile] = useState("");
  const [walletPoints, setWalletPoints] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [alert, setAlert] = useState({ show: false, message: "" });

  useEffect(() => {
    fetchProductsData();
  }, []);

  const fetchProductsData = async () => {
    try {
      const res = await fetchProducts();
      setProducts(res.data);
    } catch (error) {
      console.error("Fetch products failed:", error);
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter(product =>
      product.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [products, search]);

  const fetchCustomerData = async (number) => {
    try {
      const res = await fetchCustomer(number);
      setWalletPoints(res.data.rewardPoints || 0);
    } catch {
      setWalletPoints(0);
    }
  };

  const handleMobileChange = (e) => {
    const value = e.target.value;
    setMobile(value);
    if (value.length >= 10) {
      fetchCustomerData(value);
    }
  };

  const addToCart = (product) => {
    const existing = cart.find(item => item._id === product._id);
    if (existing) {
      setCart(cart.map(item =>
        item._id === product._id ? { ...item, qty: item.qty + 1 } : item
      ));
    } else {
      setCart([...cart, { ...product, qty: 1 }]);
    }
    setSearch("");
  };

  const increaseQty = (id) => {
    setCart(cart.map(item =>
      item._id === id ? { ...item, qty: item.qty + 1 } : item
    ));
  };

  const decreaseQty = (id) => {
    const updated = cart.map(item =>
      item._id === id ? { ...item, qty: item.qty - 1 } : item
    );
    setCart(updated.filter(item => item.qty > 0));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const rewardUsed = walletPoints > 20 ? Math.min(walletPoints, subtotal) : 0;
  const amountAfterReward = subtotal - rewardUsed;
  const rewardPoints = amountAfterReward <= 500 ? Math.floor(amountAfterReward * 0.05) : 0;
  const discount = amountAfterReward > 500 ? amountAfterReward * 0.05 : 0;
  const finalTotal = amountAfterReward - discount;
  const totalItems = cart.reduce((a, b) => a + b.qty, 0);

  const padText = (text, length) => text.toString().padEnd(length).slice(0, length);
  const formatLine = (label, value, labelWidth = 13) => `${label.padEnd(labelWidth)} : ${value}`;
  const formatItemRow = (item) => {
    const name = padText(item.name, 16);
    const qty = padText(`${item.qty} x ${item.price}`, 9);
    const total = `₹${item.qty * item.price}`;
    return `${name}${qty}${total}`;
  };

  const generateReceipt = () => {
    const date = new Date();
    const isGuest = mobile.length < 10;
    const lines = [
      "================================",
      "          FRUTERIA",
      "================================",
      formatLine("Date", date.toLocaleDateString()),
      formatLine("Time", date.toLocaleTimeString()),
      formatLine("Mobile", mobile || "Guest"),
      "--------------------------------",
      "Item            Qty      Price",
      "--------------------------------",
      ...cart.map(item => formatItemRow(item)),
      "--------------------------------",
      formatLine("Total Items", ` ${totalItems}`),
      formatLine("Subtotal", ` ₹${subtotal}`),
    ];

    if (!isGuest) {
      lines.push(formatLine("Reward Used", `-₹${rewardUsed}`));
    }

    lines.push(formatLine("Discount", ` ₹${discount}`));

    if (!isGuest) {
      lines.push(formatLine("Reward Added", `+${rewardPoints}`));
    }

    lines.push(
      "--------------------------------",
      formatLine("Final Total", `₹${finalTotal}`),
      "================================",
      "      THANK YOU VISIT AGAIN",
      "================================"
    );

    return `\n${lines.join("\n")}\n`;
  };

  const printBill = () => {
    const receipt = generateReceipt();
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`<pre style="font-size:16px">${receipt}</pre>`);
    printWindow.print();
  };

  const saveOrderAction = async () => {
    if (cart.length === 0) return setAlert({ show: true, message: "Add products to cart first!" });
    try {
      setLoading(true);
      printBill();
      await createOrder({ mobile, items: cart });
      setAlert({ show: true, message: "Order Saved Successfully!" });
      clearBill();
    } catch (error) {
      setAlert({ show: true, message: "Error saving order. Try again." });
    } finally {
      setLoading(false);
    }
  };

  const clearBill = () => {
    setCart([]);
    setSearch("");
    setMobile("");
    setWalletPoints(0);
  };

  return (
    <div className="min-h-screen bg-[#e5e7eb] p-4 text-black">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-2xl p-6 border-2 border-gray-400">
        <h1 className="text-6xl font-black text-orange-600 mb-8 text-center tracking-tighter">FRUTERIA</h1>

        {/* MOBILE SECTION */}
        <div className="bg-gray-100 p-6 rounded-2xl mb-6 border-2 border-gray-300">
          <label className="block text-xl font-bold text-black mb-2 uppercase tracking-wide">Customer Mobile</label>
          <input
            type="tel"
            value={mobile}
            onChange={handleMobileChange}
            placeholder="Enter Mobile Number"
            className="w-full bg-white border-4 border-black p-5 rounded-xl text-3xl font-black focus:bg-yellow-50 outline-none transition-all"
            maxLength={10}
          />
          {walletPoints > 0 && (
            <div className="mt-4 bg-yellow-400 p-4 rounded-xl border-2 border-black">
              <span className="text-xl font-bold">Reward Wallet: <span className="text-3xl">{walletPoints}</span> Points</span>
            </div>
          )}
        </div>

        {/* SEARCH SECTION */}
        <div className="relative mb-8">
          <label className="block text-xl font-bold text-black mb-2 uppercase tracking-wide">Search & Add Product</label>
          <input
            type="text"
            value={search}
            onFocus={() => setShowDropdown(true)}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 Type Product Name..."
            className="w-full bg-white border-4 border-black p-5 rounded-xl text-2xl font-bold focus:bg-blue-50 outline-none transition-all"
          />
          {showDropdown && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)}></div>
              <div className="absolute left-0 right-0 top-full mt-2 bg-white border-4 border-black rounded-2xl shadow-2xl z-50 max-h-96 overflow-y-auto">
                {filteredProducts.length > 0 ? (
                  filteredProducts.map(product => (
                    <div
                      key={product._id}
                      className="flex justify-between items-center p-5 border-b-2 border-gray-200 hover:bg-green-100 cursor-pointer transition-colors"
                      onClick={() => { addToCart(product); setShowDropdown(false); }}
                    >
                      <div>
                        <h2 className="font-black text-2xl text-black">{product.name}</h2>
                        <p className="text-lg font-bold text-gray-700">{product.category} • ₹{product.price}</p>
                      </div>
                      <div className="bg-black text-white font-black px-6 py-2 rounded-xl text-xl">ADD +</div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-2xl font-bold text-gray-500">No products found</div>
                )}
              </div>
            </>
          )}
        </div>

        {/* CART SECTION */}
        <div className="bg-black text-white rounded-3xl p-6 shadow-xl">
          <h2 className="text-3xl font-black mb-6 border-b-4 border-orange-500 pb-2 uppercase tracking-tighter !text-white">Cart Items</h2>
          {cart.length === 0 ? (
            <p className="text-2xl text-center py-10 font-bold opacity-50">YOUR CART IS EMPTY</p>
          ) : (
            <div className="space-y-4">
              {cart.map(item => (
                <div key={item._id} className="bg-zinc-800 text-white p-4 rounded-2xl grid grid-cols-[1fr_auto_auto] items-center gap-4 border border-zinc-700">
                  <div>
                    <h3 className="text-2xl font-black leading-none !text-white">{item.name}</h3>
                    <p className="text-lg font-bold text-orange-400">₹{item.price}</p>
                  </div>
                  <div className="flex items-center gap-4 bg-gray-200 p-2 rounded-xl border-2 border-black">
                    <button onClick={() => decreaseQty(item._id)} className="bg-red-600 text-white w-10 h-10 rounded-lg text-2xl font-black">-</button>
                    <span className="text-2xl font-black w-8 text-center">{item.qty}</span>
                    <button onClick={() => increaseQty(item._id)} className="bg-green-500 text-white w-10 h-10 rounded-lg text-2xl font-black">+</button>
                  </div>
                  <div className="text-2xl font-black min-w-[100px] text-right">₹{item.qty * item.price}</div>
                </div>
              ))}
            </div>
          )}

          {/* TOTALS */}
          <div className="mt-8 pt-6 border-t-4 border-dashed border-gray-600 space-y-3">
            <div className="flex justify-between text-xl font-bold"><span>Items:</span><span>{totalItems}</span></div>
            <div className="flex justify-between text-xl font-bold"><span>Subtotal:</span><span>₹{subtotal}</span></div>
            {rewardUsed > 0 && <div className="flex justify-between text-xl font-bold text-yellow-400"><span>Reward Used:</span><span>-₹{rewardUsed}</span></div>}
            {discount > 0 && <div className="flex justify-between text-xl font-bold text-red-400"><span>Discount:</span><span>-₹{discount}</span></div>}
            {mobile.length >= 10 && <div className="flex justify-between text-xl font-bold text-green-400"><span>Reward Earned:</span><span>+{rewardPoints}</span></div>}
            <div className="flex justify-between text-5xl font-black mt-6 bg-white text-black p-6 rounded-2xl border-4 border-yellow-400 shadow-inner">
              <span>TOTAL</span>
              <span>₹{finalTotal}</span>
            </div>
          </div>

          {/* ACTIONS */}
          <div className="grid grid-cols-1 gap-4 mt-8">
            <button onClick={saveOrderAction} disabled={loading} className="bg-green-500 hover:bg-green-400 text-black text-3xl font-black py-8 rounded-3xl shadow-xl active:scale-95 transition-all">
              {loading ? "SAVING..." : "✅ SAVE & PRINT BILL"}
            </button>
            <button onClick={clearBill} className="bg-red-600 hover:bg-red-500 text-white text-xl font-black py-4 rounded-2xl shadow-lg active:scale-95 transition-all">
              🗑️ CLEAR ALL
            </button>
          </div>
        </div>
      </div>

      {/* CUSTOM ALERT MODAL */}
      {alert.show && (
        <div className="fixed inset-0 flex items-center justify-center z-[100] bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white p-6 rounded-2xl max-w-sm w-full shadow-2xl text-center border border-gray-100">
            <h2 className="text-2xl font-bold mb-2 text-orange-600">Fruteria</h2>
            <p className="text-gray-700 mb-6 font-medium">{alert.message}</p>
            <button 
              onClick={() => setAlert({ show: false, message: "" })}
              className="w-full bg-orange-600 text-white py-2.5 rounded-xl font-bold hover:bg-orange-700 transition-colors"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillingScreen;
