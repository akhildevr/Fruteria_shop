import { useEffect, useMemo, useState } from "react";
import { fetchProducts, fetchCustomer, createOrder } from "../utils/api";
import socket from "../utils/socket";

const BillingScreen = () => {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState([]);
  const [mobile, setMobile] = useState("");
  const [walletPoints, setWalletPoints] = useState(0);
  const [loading, setLoading] = useState(false);
  const [productLoading, setProductLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const [orderSaved, setOrderSaved] = useState(false);
  const [alert, setAlert] = useState({ show: false, message: "" });
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [cashGiven, setCashGiven] = useState("");
  const [showMobileField, setShowMobileField] = useState(() => {
    const saved = localStorage.getItem("showMobileFieldInBilling");
    return saved !== null ? JSON.parse(saved) : true;
  });
  const shopName = import.meta.env.VITE_SHOP_NAME || "Shop";

  useEffect(() => {
    const cachedProducts = localStorage.getItem("fruteria_products");
    if (cachedProducts) {
      setProducts(JSON.parse(cachedProducts));
      setProductLoading(false);
      // Fetch fresh data in background without loading state
      fetchProductsData(false);
    } else {
      // No cache, fetch with loading state
      fetchProductsData(true);
    }

    const handleStorageChange = () => {
      const saved = localStorage.getItem("showMobileFieldInBilling");
      if (saved !== null) {
        setShowMobileField(JSON.parse(saved));
      }
    };

    socket.on("productUpdated", () => fetchProductsData(false));
    window.addEventListener("storage", handleStorageChange);

    return () => {
      socket.off("productUpdated");
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const fetchProductsData = async (showLoading = true) => {
    try {
      if (showLoading) setProductLoading(true);
      const res = await fetchProducts();
      setProducts(res.data);
      localStorage.setItem("fruteria_products", JSON.stringify(res.data));
    } catch (error) {
      console.error("Fetch products failed:", error);
    } finally {
      if (showLoading) setProductLoading(false);
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
    setOrderSaved(false);
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
    setOrderSaved(false);
  };

  const increaseQty = (id) => {
    setCart(cart.map(item =>
      item._id === id ? { ...item, qty: item.qty + 1 } : item
    ));
    setOrderSaved(false);
  };

  const decreaseQty = (id) => {
    const updated = cart.map(item =>
      item._id === id ? { ...item, qty: item.qty - 1 } : item
    );
    setCart(updated.filter(item => item.qty > 0));
    setOrderSaved(false);
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const rewardUsed = walletPoints > 20 ? Math.min(walletPoints, subtotal) : 0;
  const amountAfterReward = subtotal - rewardUsed;
  const discount = amountAfterReward >= 500 ? amountAfterReward * 0.05 : 0;
  const finalTotal = amountAfterReward - discount;
  const rewardPoints = amountAfterReward < 500 ? Math.floor(finalTotal * 0.05) : 0;
  const totalItems = cart.reduce((a, b) => a + b.qty, 0);
  const balance = cashGiven ? parseFloat(cashGiven) - finalTotal : 0;

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
      `          ${shopName.toUpperCase()}`,
      "================================",
      formatLine("Date", date.toLocaleDateString()),
      formatLine("Time", date.toLocaleTimeString()),
      formatLine("Mobile", mobile || "Guest"),
      formatLine("Payment", paymentMethod),
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
      ...(paymentMethod === "Cash" && cashGiven ? [
        formatLine("Cash Given", `₹${cashGiven}`),
        ...(balance > 0 ? [formatLine("Balance", ` ₹${balance.toFixed(2)}`)] : []),
      ] : []),
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
    clearBill();
  };

  const saveOrderAction = async () => {
    if (cart.length === 0) return setAlert({ show: true, message: "Add products to cart first!" });
    try {
      if (paymentMethod === "Cash" && (!cashGiven || parseFloat(cashGiven) < finalTotal)) {
        return setAlert({ show: true, message: "Insufficient cash received!" });
      }
      setLoading(true);
      await createOrder({ mobile, items: cart, paymentMethod });
      setOrderSaved(true);
      setAlert({ show: true, message: "Order Saved Successfully!" });
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
    setOrderSaved(false);
    setPaymentMethod("Cash");
    setCashGiven("");
  };

  return (
    <div className="min-h-screen text-slate-100 px-3 py-4" style={{ background: "radial-gradient(circle at top, rgba(56,189,248,0.15), transparent 30%), linear-gradient(180deg, #020617 0%, #060d19 50%, #020616 100%)" }}>
      <div className="mx-auto w-full max-w-3xl premium-card p-4 sm:p-6 md:p-8">
        <h1 className="font-extrabold text-center tracking-tight text-amber-300" style={{ fontSize: "clamp(2.2rem, 6vw, 3rem)" }}>{shopName.toUpperCase()}</h1>
        {/* <p className="text-center uppercase tracking-[0.4em] text-slate-300/70 mb-10 text-sm sm:text-base">Premium billing experience</p> */}

        {/* MOBILE SECTION */}
        {showMobileField && (
          <div className="bg-slate-950/90 p-4 sm:p-6 rounded-[2rem] mb-6 border border-slate-700/70 shadow-xl">
            <label className="block text-lg sm:text-xl font-semibold text-slate-100 mb-3 uppercase tracking-[0.14em]">Customer Mobile</label>
            <input
              type="tel"
              value={mobile}
              onChange={handleMobileChange}
              placeholder="Enter Mobile Number"
              className="premium-input w-full px-5 py-4 text-[clamp(1rem,2.6vw,1.5rem)] font-semibold placeholder:text-slate-500"
              maxLength={10}
            />
            {walletPoints > 0 && (
              <div className="mt-4 bg-slate-900/80 p-4 rounded-3xl border border-slate-600/70 shadow-inner">
                <span className="text-base sm:text-xl font-semibold text-amber-200">Reward Wallet: <span className="text-2xl sm:text-3xl font-black text-white">{walletPoints}</span> Points</span>
              </div>
            )}
          </div>
        )}

        {/* SEARCH SECTION */}
        <div className="relative mb-8">
          <label className="block text-lg sm:text-xl font-semibold text-slate-100 mb-2 uppercase tracking-[0.14em]">Search Items</label>
          <input
            type="text"
            value={search}
            onFocus={() => setShowDropdown(true)}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 Type product name..."
            className="premium-input w-full px-5 py-4 text-[clamp(1rem,2.6vw,1.5rem)] font-semibold"
          />
          {showDropdown && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)}></div>
              <div className="absolute left-0 right-0 top-full mt-2 bg-slate-950/95 border border-slate-700 rounded-[1.75rem] shadow-2xl z-50 max-h-96 overflow-y-auto backdrop-blur-xl">
                {productLoading ? (
                  <div className="p-6 text-center text-base sm:text-lg font-bold text-slate-400">Loading items…</div>
                ) : filteredProducts.length > 0 ? (
                  filteredProducts.map(product => (
                    <div
                      key={product._id}
                      className="flex justify-between items-center p-3 sm:p-4 border-b border-slate-700 hover:bg-slate-900 cursor-pointer transition-colors"
                      onClick={() => { addToCart(product); setShowDropdown(false); }}
                    >
                      <div className="min-w-0 pr-3 sm:pr-4">
                        <h2 className="font-black text-sm sm:text-base text-slate-100 truncate">{product.name}</h2>
                        <p className="text-xs sm:text-sm font-medium text-slate-400">{product.category} • ₹{product.price}</p>
                      </div>
                      <div className="bg-amber-400 text-slate-950 font-black px-3 py-1.5 sm:px-4 sm:py-2 rounded-2xl text-xs sm:text-sm">ADD +</div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-base sm:text-lg font-bold text-slate-400">No products found</div>
                )}
              </div>
            </>
          )}
        </div>

        {/* CART SECTION */}
        <div className="premium-card p-4 sm:p-6 shadow-2xl border border-slate-700/70">
          <h2 className="text-2xl sm:text-3xl font-extrabold mb-6 border-b-4 border-cyan-400/40 pb-2 uppercase tracking-[0.18em] text-slate-100">Cart Items</h2>
          {cart.length === 0 ? (
            <p className="text-lg sm:text-xl text-center py-10 font-semibold text-slate-400">YOUR CART IS EMPTY</p>
          ) : (
            <div className="space-y-4">
              {cart.map(item => (
                <div key={item._id} className="bg-slate-900/95 text-slate-100 p-3 sm:p-4 rounded-[1.5rem] grid grid-cols-1 sm:grid-cols-[1fr_minmax(150px,220px)_auto] items-center gap-3 sm:gap-4 border border-slate-700/80">
                  <div className="min-w-0">
                    <h3 className="text-sm sm:text-base font-semibold leading-tight truncate">{item.name}</h3>
                    <p className="text-sm font-medium text-amber-300">₹{item.price}</p>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 bg-slate-800/90 p-2 sm:p-3 rounded-3xl border border-slate-700 justify-between sm:justify-center w-full sm:w-auto mx-auto">
                    <button onClick={() => decreaseQty(item._id)} className="bg-rose-500 hover:bg-rose-400 text-white w-9 h-9 sm:w-10 sm:h-10 rounded-2xl text-sm font-black transition-all">-</button>
                    <span className="text-sm sm:text-base font-semibold text-slate-100 w-9 sm:w-10 text-center">{item.qty}</span>
                    <button onClick={() => increaseQty(item._id)} className="bg-emerald-500 hover:bg-emerald-400 text-white w-9 h-9 sm:w-10 sm:h-10 rounded-2xl text-sm font-black transition-all">+</button>
                  </div>
                  <div className="text-sm sm:text-base font-semibold min-w-[100px] text-right text-slate-100">₹{item.qty * item.price}</div>
                </div>
              ))}
            </div>
          )}

          {/* TOTALS */}
          <div className="mt-8 pt-6 border-t border-slate-700 space-y-3 text-sm sm:text-base text-slate-100">
            <div className="flex flex-col sm:flex-row justify-between gap-3 font-semibold"><span>Items:</span><span>{totalItems}</span></div>
            <div className="flex flex-col sm:flex-row justify-between gap-3 font-semibold"><span>Subtotal:</span><span>₹{subtotal}</span></div>
            {rewardUsed > 0 && <div className="flex flex-col sm:flex-row justify-between gap-3 font-semibold text-amber-300"><span>Reward Used:</span><span>-₹{rewardUsed}</span></div>}
            {discount > 0 && <div className="flex flex-col sm:flex-row justify-between gap-3 font-semibold text-rose-300"><span>Discount:</span><span>₹{discount}</span></div>}
            {mobile.length >= 10 && <div className="flex flex-col sm:flex-row justify-between gap-3 font-semibold text-emerald-300"><span>Reward Earned:</span><span>+{rewardPoints}</span></div>}
            <div className="flex flex-col sm:flex-row justify-between text-xl font-black mt-6 bg-gradient-to-r from-amber-300 via-amber-200 to-slate-100 text-slate-950 p-4 sm:p-5 rounded-[1.75rem] shadow-[0_20px_60px_-30px_rgba(250,204,21,0.9)]">
              <span>TOTAL</span>
              <span>₹{finalTotal}</span>
            </div>
          </div>

          {/* PAYMENT SECTION */}
          <div className="mt-6 p-4 bg-slate-950/50 rounded-[1.75rem] border border-slate-700/70 space-y-4 shadow-inner">
            <div className="flex items-center justify-between gap-4">
              <label className="text-sm sm:text-base font-bold text-slate-100 uppercase tracking-wider">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="bg-slate-900 text-slate-100 px-4 py-2 rounded-xl border border-slate-700 outline-none focus:border-cyan-400 font-bold transition-all cursor-pointer text-sm"
              >
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
              </select>
            </div>

            {paymentMethod === "Cash" && (
              <div className="space-y-4 pt-4 border-t border-slate-700/50">
                <div className="flex items-center justify-between gap-4">
                  <label className="text-sm sm:text-base font-bold text-slate-100 uppercase tracking-wider">Cash Received</label>
                  <input
                    type="number"
                    value={cashGiven}
                    min="0"
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val < 0) return;
                      setCashGiven(val);
                    }}
                    placeholder="₹0"
                    className="bg-slate-900 text-emerald-400 px-4 py-2 rounded-xl border border-slate-700 outline-none focus:border-emerald-500 font-black text-right w-32 text-lg"
                    style={{
                      WebkitAppearance: 'none',
                      MozAppearance: 'textfield',
                      margin: 0,
                    }}
                  />
                </div>
                {balance > 0 && (
                  <div className="flex items-center justify-between gap-4">
                    <label className="text-sm sm:text-base font-bold text-slate-100 uppercase tracking-wider">Balance to Give</label>
                    <span className="text-xl font-black text-amber-300">
                      ₹{balance.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ACTIONS */}
          <div className="grid grid-cols-1 gap-4 mt-8">
            {!orderSaved && (
              <button onClick={saveOrderAction} disabled={loading} className="premium-button w-full bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 text-slate-950 text-base sm:text-xl font-black py-4 rounded-[1.75rem] shadow-xl hover:from-cyan-300 hover:to-blue-400 transition-all duration-300">
                {loading ? "SAVING..." : "✅ SAVE ORDER"}
              </button>
            )}
            {orderSaved && (
              <button onClick={printBill} className="premium-button w-full bg-gradient-to-r from-amber-400 via-amber-300 to-slate-100 text-slate-950 text-base sm:text-xl font-black py-4 rounded-[1.75rem] shadow-xl hover:from-amber-300 hover:to-slate-200 transition-all duration-300">
                🖨️ PRINT ORDER
              </button>
            )}
            {cart.length !=0 && (
              <button onClick={clearBill} className="premium-button-secondary w-full bg-slate-900/95 text-slate-100 text-base sm:text-xl font-black py-4 rounded-[1.75rem] border border-slate-600 shadow-lg hover:border-slate-400 transition-all duration-300">
                🗑️ CLEAR ALL
              </button>
            )}
          </div>
        </div>
      </div>

      {/* CUSTOM ALERT MODAL */}
      {alert.show && (
        <div className="fixed inset-0 flex items-center justify-center z-[100] bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white p-6 rounded-2xl max-w-sm w-full shadow-2xl text-center border border-gray-100">
            <h2 className="text-2xl font-bold mb-2 text-orange-600">{shopName}</h2>
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
