import { useEffect, useMemo, useState } from "react";
import axios from "axios";

const BillingScreen = () => {

  const [products, setProducts] = useState([]);

  const [search, setSearch] = useState("");

  const [cart, setCart] = useState([]);

  const [mobile, setMobile] = useState("");

  const [walletPoints, setWalletPoints] = useState(0);

  const [loading, setLoading] = useState(false);


  // FETCH PRODUCTS
  useEffect(() => {

    fetchProducts();

  }, []);

  const fetchProducts = async () => {

    const res = await axios.get(
      `${import.meta.env.VITE_API_URL}/api/products`
    );

    setProducts(res.data);
  };


  // SEARCH FILTER
  const filteredProducts = useMemo(() => {

    return products.filter(product =>
      product.name
        .toLowerCase()
        .includes(search.toLowerCase())
    );

  }, [products, search]);


  // FETCH CUSTOMER REWARD POINTS
  const fetchCustomer = async (number) => {

    try {

      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/customers/${number}`
      );

      setWalletPoints(
        res.data.rewardPoints || 0
      );

    } catch {

      setWalletPoints(0);

    }
  };


  // MOBILE INPUT
  const handleMobileChange = (e) => {

    const value = e.target.value;

    setMobile(value);

    if (value.length >= 10) {

      fetchCustomer(value);

    }
  };


  // ADD PRODUCT TO CART
  const addToCart = (product) => {

    const existing = cart.find(
      item => item._id === product._id
    );

    if (existing) {

      setCart(cart.map(item =>

        item._id === product._id

          ? {
              ...item,
              qty: item.qty + 1
            }

          : item
      ));

    } else {

      setCart([
        ...cart,
        {
          ...product,
          qty: 1
        }
      ]);

    }

    setSearch("");
  };


  // INCREASE QTY
  const increaseQty = (id) => {

    setCart(cart.map(item =>

      item._id === id

        ? {
            ...item,
            qty: item.qty + 1
          }

        : item
    ));
  };


  // DECREASE QTY
  const decreaseQty = (id) => {

    const updated = cart.map(item =>

      item._id === id

        ? {
            ...item,
            qty: item.qty - 1
          }

        : item
    );

    setCart(
      updated.filter(item => item.qty > 0)
    );
  };


  // CALCULATIONS
  const subtotal = cart.reduce(

    (sum, item) =>
      sum + item.price * item.qty,

    0
  );

  const rewardUsed =
    walletPoints > 10
      ? Math.min(walletPoints, subtotal)
      : 0;

  const amountAfterReward =
    subtotal - rewardUsed;

  const rewardPoints =
    amountAfterReward <= 500
      ? Math.floor(amountAfterReward * 0.10)
      : 0;

  const discount =
    amountAfterReward > 500
      ? amountAfterReward * 0.10
      : 0;

  const finalTotal =
    amountAfterReward - discount;

  const totalItems = cart.reduce(
    (a, b) => a + b.qty,
    0
  );


  // GENERATE RECEIPT
  const generateReceipt = () => {

    const date = new Date();

    return `
================================
          FRUTERIA
================================

Date : ${date.toLocaleDateString()}
Time : ${date.toLocaleTimeString()}

Mobile : ${mobile}

--------------------------------
Item            Qty     Price
--------------------------------

${cart.map(item => `
${item.name}
${item.qty} x ${item.price}    ₹${item.qty * item.price}
`).join("")}

--------------------------------

Total Items : ${totalItems}

Subtotal : ₹${subtotal}

Reward Used : -₹${rewardUsed}

Discount : ₹${discount}

Reward Added : +${rewardPoints}

--------------------------------

Final Total : ₹${finalTotal}

================================
      THANK YOU VISIT AGAIN
================================
`;
  };


  // PRINT BILL
  const printBill = () => {

    const receipt = generateReceipt();

    const printWindow = window.open(
      "",
      "_blank"
    );

    printWindow.document.write(`
      <pre style="font-size:16px">
${receipt}
      </pre>
    `);

    printWindow.print();
  };


  // SAVE ORDER
  const generateBill = async () => {

    if (cart.length === 0) {
      return alert(
        "Add products"
      );
    }

    try {

      setLoading(true);

      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/orders`,
        {
          mobile,
          items: cart
        }
      );

      printBill();

      alert("Order Saved");

      clearBill();

    } catch (error) {

      alert("Error saving order");

    } finally {

      setLoading(false);

    }
  };


  // CLEAR BILL
  const clearBill = () => {

    setCart([]);

    setSearch("");

    setMobile("");

    setWalletPoints(0);

  };


  return (

    <div className="min-h-screen bg-gray-100 p-5">

      <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-lg p-6">

        <h1 className="text-4xl font-bold mb-6">
          FRUTERIA
        </h1>


        {/* MOBILE NUMBER */}

        <div className="mb-5">

          <label className="font-semibold">
            Customer Mobile
          </label>

          <input
            type="tel"
            value={mobile}
            onChange={handleMobileChange}
            placeholder="Enter Mobile Number"
            className="w-full border p-4 rounded-xl mt-2 text-xl"
            maxLength={10}
          />

        </div>


        {/* REWARD POINTS */}

        <div className="bg-yellow-100 p-4 rounded-xl mb-5">

          Reward Wallet :
          <span className="font-bold ml-2">
            {walletPoints} Points
          </span>

        </div>


        {/* SEARCH */}

        <div className="mb-5">

          <label className="font-semibold">
            Search Product
          </label>

          <div className="relative">

            <input
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="🔍 Search Product..."
              className="w-full border p-4 rounded-xl mt-2"
            />

          </div>

        </div>


        {/* SEARCH RESULTS */}

        {search && (

          <div className="border rounded-xl mb-6 max-h-60 overflow-y-auto">

            {filteredProducts.map(product => (

              <div
                key={product._id}
                className="flex justify-between items-center p-4 border-b"
              >

                <div>

                  <h2 className="font-semibold">
                    {product.name}
                  </h2>

                  <p>
                    ₹{product.price}
                  </p>

                </div>

                <button
                  onClick={() =>
                    addToCart(product)
                  }
                  className="bg-green-500 text-white w-10 h-10 rounded-full text-xl"
                >
                  +
                </button>

              </div>

            ))}

          </div>

        )}


        {/* CART */}

        <div className="bg-gray-50 rounded-xl p-5">

          <h2 className="text-2xl font-bold mb-5">
            CART
          </h2>

          {cart.length === 0 && (

            <p>
              No Items Added
            </p>

          )}


          {cart.map(item => (

            <div
              key={item._id}
              className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-4 border-b py-4"
            >

              <div className="min-w-0">
                <h3 className="font-semibold truncate">
                  {item.name}
                </h3>

                <p className="text-sm text-gray-600">
                  ₹{item.price}
                </p>
              </div>

              {/* QTY */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => decreaseQty(item._id)}
                  className="bg-red-500 text-white w-8 h-8 rounded-full"
                >
                  -
                </button>

                <span className="font-bold">
                  {item.qty}
                </span>

                <button
                  onClick={() => increaseQty(item._id)}
                  className="bg-green-500 text-white w-8 h-8 rounded-full"
                >
                  +
                </button>
              </div>

              {/* PRICE */}
              <div className="font-bold text-right">
                ₹{item.qty * item.price}
              </div>

            </div>

          ))}


          {/* TOTALS */}

          <div className="mt-6 space-y-2">

            <div className="flex justify-between">
              <span>Total Items</span>
              <span>{totalItems}</span>
            </div>

            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>₹{subtotal}</span>
            </div>

            <div className="flex justify-between">
              <span>Reward Used</span>
              <span>-₹{rewardUsed}</span>
            </div>

            <div className="flex justify-between">
              <span>Reward Added</span>
              <span>+{rewardPoints}</span>
            </div>

            <div className="flex justify-between">
              <span>Discount</span>
              <span>₹{discount}</span>
            </div>

            <div className="flex justify-between text-2xl font-bold mt-4">
              <span>Final Total</span>
              <span>₹{finalTotal}</span>
            </div>

          </div>


          {/* ACTION BUTTONS */}

          <div className="flex gap-4 mt-8">

            <button
              onClick={generateBill}
              disabled={loading}
              className="bg-black text-white px-6 py-4 rounded-xl flex-1"
            >
              {loading
                ? "Saving..."
                : "Generate & Print Bill"}
            </button>

            <button
              onClick={clearBill}
              className="bg-red-500 text-white px-6 py-4 rounded-xl"
            >
              Clear Bill
            </button>

          </div>

        </div>

      </div>

    </div>
  );
};

export default BillingScreen;