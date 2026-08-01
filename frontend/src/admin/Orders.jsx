import { useEffect, useState, useCallback, useMemo } from "react";
import { fetchOrders, deleteOrder, updateOrder } from "../utils/api";
import { getBusinessDate } from "../utils/dateUtils";
import { fetchProducts } from "../utils/api";
import { getPaymentMethodBadgeClasses, getPaymentMethodType } from "../utils/paymentMethod";

import AdminNavbar from "./AdminNavbar";
import socket from "../utils/socket";

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [confirm, setConfirm] = useState({ show: false, id: null });
  const [editingOrder, setEditingOrder] = useState(null);
  const [editDate, setEditDate] = useState("");
  const [editMethod, setEditMethod] = useState("Cash");
  const [editItems, setEditItems] = useState([]);
  const [savingEdit, setSavingEdit] = useState(false);
  const shopName = import.meta.env.VITE_SHOP_NAME || "Shop";

  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);

  const [productPicker, setProductPicker] = useState({ show: false, rowIndex: null });


  const fetchOrdersData = useCallback(async () => {
    try {
      const res = await fetchOrders();
      setOrders(res.data);
    } catch (error) {
      console.error("Error fetching orders", error);
    }
  }, []);

  useEffect(() => {
    const initialize = async () => {
      await fetchOrdersData();
    };
    initialize();

    socket.on("orderUpdated", () => {
      fetchOrdersData();
    });

    return () => socket.off("orderUpdated");
  }, [fetchOrdersData]);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setProductsLoading(true);
        const res = await fetchProducts();
        setProducts(Array.isArray(res.data) ? res.data : []);
      } catch (e) {
        console.error("Error fetching products for order edit:", e);
        setProducts([]);
      } finally {
        setProductsLoading(false);
      }
    };

    loadProducts();
  }, []);


  const printBill = (order) => {
    const baseDate = order.billDate || order.createdAt;
    const receipt = `
================================
         ${shopName.toUpperCase()}
================================
Bill ID : ${order.billId || order._id}
Date    : ${new Date(baseDate).toLocaleDateString()}
Mobile  : ${order.mobile}

Payment : ${order.paymentMethod || "Cash"}
--------------------------------
${order.items.map(item => `${item.name}\n${item.qty} x ${item.price}    ₹${item.qty * item.price}`).join("\n")}
--------------------------------
Final Total : ₹${order.finalTotal}
================================
THANK YOU
================================
`;
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`<pre style="font-size:16px">${receipt}</pre>`);
    printWindow.print();
  };

  const deleteOrderAction = async (id) => {
    try {
      await deleteOrder(id);
      fetchOrdersData();
      setConfirm({ show: false, id: null });
    } catch (error) {
      console.error("Error deleting order", error);
    }
  };

  const openEditModal = (order) => {
    setEditingOrder(order);
    setEditDate(
      order.billDate
        ? new Date(order.billDate).toISOString().split("T")[0]
        : order.createdAt
          ? new Date(order.createdAt).toISOString().split("T")[0]
          : ""
    );
    setEditMethod(order.paymentMethod || "Cash");

    setEditItems((order.items || []).map((item) => ({
      name: item.name || "",
      qty: item.qty || 1,
      price: item.price || 0,
      productId: item.productId || undefined
    })));

    setProductPicker({ show: false, rowIndex: null });
  };


  const updateEditItem = (index, field, value) => {
    setEditItems((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              [field]: field === "qty" || field === "price" ? Number(value) : value
            }
          : item
      )
    );
  };


  const addEditItem = () => {
    setEditItems((prev) => [...prev, { name: "", qty: 1, price: 0, productId: undefined }]);
    // open picker for the newly added row
    setProductPicker((prev) => ({ show: true, rowIndex: editItems.length }));
  };


  const removeEditItem = (index) => {
    setEditItems((prev) => prev.filter((_, i) => i !== index));
    setProductPicker((prev) => {
      if (!prev.show) return prev;
      if (prev.rowIndex === index) return { show: false, rowIndex: null };
      // if we removed an earlier row, shift picker index
      if (prev.rowIndex !== null && prev.rowIndex > index) {
        return { ...prev, rowIndex: prev.rowIndex - 1 };
      }
      return prev;
    });
  };


  const normalizedUnitPriceFromProduct = (product) => {
    // Try common price field names
    const candidates = [product.price, product.unitPrice, product.sellingPrice, product.rate, product.costPrice];
    const found = candidates.find((v) => v !== undefined && v !== null && !Number.isNaN(Number(v)));
    return found !== undefined ? Number(found) : 0;
  };

  const lineTotalForItem = (item) => {
    const qty = Number(item.qty) || 0;
    const price = Number(item.price) || 0;
    return qty * price;
  };

  const computedOrderTotal = useMemo(() => {
    return editItems.reduce((sum, item) => sum + lineTotalForItem(item), 0);
  }, [editItems]);

  const pickProductForRow = (rowIndex, product) => {
    const unitPrice = normalizedUnitPriceFromProduct(product);
    setEditItems((prev) =>
      prev.map((it, i) =>
        i !== rowIndex
          ? it
          : {
              ...it,
              name: product?.name || it.name,
              price: unitPrice,
              productId: product?._id || product?.id || it.productId
            }
      )
    );
    setProductPicker({ show: false, rowIndex: null });
  };

  const saveEditedOrder = async () => {
    if (!editingOrder) return;

    try {
      setSavingEdit(true);
      const normalizedItems = editItems
        .filter((item) => (item.name || "").trim() || item.qty > 0 || item.price > 0)
        .map((item) => ({
          name: (item.name || "").trim(),
          qty: Number(item.qty) || 0,
          price: Number(item.price) || 0
        }));



      await updateOrder(editingOrder._id, {
        createdAt: editDate ? `${editDate}T12:00:00` : null,
        items: normalizedItems,
        paymentMethod: editMethod,
        mobile: editingOrder.mobile
      });

      await fetchOrdersData();
      setEditingOrder(null);
      setEditDate("");
      setEditMethod("Cash");
      setEditItems([]);
    } catch (error) {
      console.error("Error updating order", error);
    } finally {
      setSavingEdit(false);
    }
  };

const businessTime = (value) => {
    if (!value) return null;
    const d = new Date(value);
    const normalized = new Date(d);
    if (normalized.getHours() < 2) {
      normalized.setDate(normalized.getDate() - 1);
    }
    normalized.setHours(2, 0, 0, 0);
    return normalized;
  };



  const selectedRangeOrders = (() => {
    const from = fromDate || "";
    const to = toDate || "";


    // Allow single day (from only) or range (both dates)
    if (!from && !to) {
      return orders;
    }

    let fromMs, toMs;

    if (from && !to) {
      // Single day - from date only
      fromMs = new Date(from + "T00:00:00").getTime();
      toMs = new Date(from + "T23:59:59").getTime();
    } else if (from && to) {
      // Range - both dates
      fromMs = new Date(from + "T00:00:00").getTime();
      toMs = new Date(to + "T23:59:59").getTime();
    } else {
      // Only to date (treat as single day)
      fromMs = new Date(to + "T00:00:00").getTime();
      toMs = new Date(to + "T23:59:59").getTime();
    }

    return orders.filter((order) => {
      const base = order.billDate || order.createdAt;
      const d = new Date(base).getTime();
      return d >= fromMs && d <= toMs;
    });
  })();

  const selectedDateSales = selectedRangeOrders.reduce((a, b) => a + b.finalTotal, 0);

  const getDeterministicSortKey = (order) => {
    const base = order.billDate || order.createdAt;
    const d = businessTime(base);
    const ts = d ? d.getTime() : new Date(base).getTime();
    const billId = order.billId || "";
    return { ts, billId: String(billId) };
  };

  const filteredOrders = (() => {
    const term = (searchTerm || "").trim().toLowerCase();

    const sorted = selectedRangeOrders
      .slice()
      .sort((a, b) => {
        const ak = getDeterministicSortKey(a);
        const bk = getDeterministicSortKey(b);
        // newest first by effective/billDate
        if (ak.ts !== bk.ts) return bk.ts - ak.ts;
        // stable tie-breaker
        return ak.billId.localeCompare(bk.billId);
      });

    if (!term) return sorted;

    return sorted.filter((order) => {
      const mobile = String(order?.mobile ?? "");
      const billId = String(order?.billId ?? "");

      return (
        (mobile && mobile.toLowerCase().includes(term)) ||
        (billId && billId.toLowerCase().includes(term))
      );
    });
  })();


  const printSalesReport = () => {
    const reportOrders = selectedRangeOrders;
    const reportRows = reportOrders.map((order) =>
      order.items.map((item, i) => {
        const isFirst = i === 0;
        const isLast = i === order.items.length - 1;
        const customerName = order.mobile && order.mobile.toLowerCase() !== "guest" ? order.mobile : "Guest";
        const orderDate = new Date(order.billDate || order.createdAt);

        const day = String(orderDate.getDate()).padStart(2, '0');
        const month = orderDate.toLocaleString('en-GB', { month: 'short' }).toUpperCase();
        const year = orderDate.getFullYear();
        const billInfo = isFirst ? `<strong>${order.billId || order._id}</strong><br>${day}-${month}-${year}<br>${customerName}` : "";
        return `
          <tr class="${isLast ? 'bill-row-end' : ''}">
            <td>${billInfo}</td>
            <td>${isFirst ? (order.paymentMethod || "Cash") : ""}</td>
            <td>${item.name}</td>
            <td class="text-right">${item.qty}</td>
            <td class="text-right">₹${item.price}</td>
            <td class="text-right">₹${item.qty * item.price}</td>
            <td class="text-right bold">${isLast ? `₹${order.finalTotal}` : ""}</td>
          </tr>`;
      }).join("")
    ).join("");

    // Build date range label
    const dateRangeLabel = fromDate ? (toDate ? `${fromDate} - ${toDate}` : fromDate) : (toDate ? toDate : "All Dates");

    const html = `
      <html>
        <head>
          <title>${shopName} Sales Report</title>
          <style>
            @page { size: auto; margin: 0mm; }
            body { font-family: Arial, sans-serif; color: #111; margin: 0; font-size: 11px; line-height: 1.25; }
            .report-container { padding: 20mm; }
            .header { text-align: center; margin-bottom: 18px; }
            .header h1 { margin: 0; font-size: 24px; letter-spacing: 1px; }
            .header p { margin: 4px 0 0; font-size: 12px; color: #333; }
            .summary { width: 100%; margin-bottom: 16px; border-collapse: collapse; }
            .summary td { padding: 6px 8px; font-size: 12px; vertical-align: bottom; }
            .summary .label { font-weight: bold; width: 140px; }
            .report-table { width: 100%; border-collapse: collapse; font-size: 11px; }
            .report-table th { border: 1px solid #ccc; border-bottom: 2px solid #888; padding: 6px 8px; vertical-align: bottom; background: #f5f5f5; text-align: left; }
            .report-table td { padding: 6px 8px; vertical-align: bottom; border-left: 1px solid #ccc; border-right: 1px solid #ccc; }
            .report-table tr.bill-row-end td { border-bottom: 1px solid #ccc; }
            .report-table .text-right { text-align: right; }
            .report-table .bold { font-weight: bold; }
            .report-table td:first-child { vertical-align: top; }
            .footer { margin-top: 18px; font-size: 11px; }
            .note { margin-top: 10px; color: #555; }
          </style>
        </head>
        <body>
          <div class="report-container">
            <div class="header">
              <h1>${shopName.toUpperCase()}</h1>
              <p>Sales Report</p>
            </div>
            <table class="summary">
              <tr><td class="label">Date</td><td>${dateRangeLabel}</td></tr>
              <tr><td class="label">Total Orders</td><td>${reportOrders.length}</td></tr>
              <tr><td class="label">Total Sales</td><td>₹${selectedDateSales.toFixed(2)}</td></tr>
            </table>
            <table class="report-table">
              <thead>
                <tr>
                  <th>Bill | Date | Customer</th>
                  <th>Method</th>
                  <th>Item</th>
                  <th class="text-right">Qty</th>
                  <th class="text-right">Price</th>
                  <th class="text-right">Amount</th>
                  <th class="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                ${reportRows}
                <tr class="bill-row-end">
                  <td colspan="6" class="text-right bold">Grand Total</td>
                  <td class="text-right bold">₹${selectedDateSales.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
            <div class="footer">
              <p class="bold">Report generated on: ${new Date().toLocaleString()}</p>
              <p class="note">This report contains all orders for the selected date and provides a summary of sales totals and item details.</p>
            </div>
          </div>
        </body>
      </html>`;

    const printWindow = window.open("", "_blank");
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <div className="min-h-screen text-slate-100 px-3 py-4" style={{ background: "radial-gradient(circle at top, rgba(56,189,248,0.15), transparent 30%), linear-gradient(180deg, #020617 0%, #060d19 50%, #020616 100%)" }}>
      <AdminNavbar />
      <h1 className="font-extrabold text-center tracking-tight text-amber-300 mb-8" style={{ fontSize: "clamp(2.2rem, 6vw, 3rem)" }}>Order History</h1>

      <div className="mx-auto w-full max-w-6xl">
        <div className="premium-card p-4 sm:p-6 shadow-2xl border border-slate-700/70 mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="block text-sm sm:text-base font-semibold text-slate-100 mb-2 uppercase tracking-[0.14em]">Search Orders</label>
              <input
                type="text"
                placeholder="🔍 Mobile or Bill ID..."
                className="premium-input w-full px-4 py-3 text-[clamp(0.9rem,2.2vw,1.2rem)] font-semibold"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm sm:text-base font-semibold text-slate-100 mb-2 uppercase tracking-[0.14em]">Filter by Date Range (From - To)</label>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                <div className="flex-1 w-full">
                  <span className="text-xs text-slate-400 mb-1 block">From Date</span>
                  <input
                    type="date"
                    className="premium-input w-full px-4 py-3 text-[clamp(0.9rem,2.2vw,1.2rem)] font-semibold"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                  />
                </div>
                <div className="flex-1 w-full">
                  <span className="text-xs text-slate-400 mb-1 block">To Date</span>
                  <input
                    type="date"
                    className="premium-input w-full px-4 py-3 text-[clamp(0.9rem,2.2vw,1.2rem)] font-semibold"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => {
                    setFromDate("");
                    setToDate("");
                  }}
                  className="premium-button-secondary bg-slate-900/95 text-slate-100 px-5 py-3 rounded-2xl font-bold border border-slate-600 shadow-lg hover:border-slate-400 transition-all text-sm sm:text-base whitespace-nowrap flex-1"
                >
                  CLEAR
                </button>
                <button
                  onClick={printSalesReport}
                  disabled={!fromDate}
                  className={`premium-button bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 px-5 py-3 rounded-2xl font-bold shadow-lg transition-all text-sm sm:text-base whitespace-nowrap flex-1 ${!fromDate ? 'opacity-40 cursor-not-allowed' : 'hover:from-cyan-300 hover:to-blue-400'}`}
                >
                  PRINT REPORT 🖨️
                </button>
              </div>
            </div>
          </div>

          {fromDate && (
            <div className="mt-4 pt-4 border-t border-slate-600 grid grid-cols-3 gap-3">
              <div className="bg-slate-900/50 p-3 rounded-lg">
                <p className="text-xs uppercase text-slate-400 font-semibold">Date Range</p>
                <p className="text-lg font-bold text-amber-300">
                  {fromDate}{toDate ? ` - ${toDate}` : ""}
                </p>
              </div>
              <div className="bg-slate-900/50 p-3 rounded-lg">
                <p className="text-xs uppercase text-slate-400 font-semibold">Total Orders</p>
                <p className="text-lg font-bold text-emerald-300">{filteredOrders.length}</p>
              </div>
              <div className="bg-slate-900/50 p-3 rounded-lg">
                <p className="text-xs uppercase text-slate-400 font-semibold">Total Sales</p>
                <p className="text-lg font-bold text-violet-300">₹{selectedDateSales.toFixed(2)}</p>
              </div>
            </div>
          )}
        </div>

        <div className="premium-card rounded-2xl shadow-2xl overflow-hidden border border-slate-700/70">

          <table className="w-full text-left">
            <thead className="bg-slate-900 text-slate-100">
              <tr>
                <th className="p-3 sm:p-4 uppercase font-black text-sm sm:text-base">Date</th>
                <th className="p-3 sm:p-4 uppercase font-black text-sm sm:text-base">Customer</th>
                <th className="p-3 sm:p-4 uppercase font-black text-sm sm:text-base">Items Summary</th>
                <th className="p-3 sm:p-4 uppercase font-black text-sm sm:text-base">Method</th>
                <th className="p-3 sm:p-4 uppercase font-black text-sm sm:text-base text-right">Total</th>
                <th className="p-3 sm:p-4 uppercase font-black text-sm sm:text-base text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {filteredOrders.length === 0 ? (
                <tr><td colSpan="6" className="p-6 text-center text-slate-400">No orders found</td></tr>
              ) : filteredOrders.map((order, index) => (
                <tr key={order._id} className={`${index % 2 === 0 ? 'bg-slate-950/50' : 'bg-slate-900/50'} hover:bg-slate-800/50 transition-colors`}>
                  <td className="p-3 sm:p-4 font-semibold text-slate-100 text-sm sm:text-base">{new Date(order.billDate || order.createdAt).toLocaleDateString()}</td>
                  <td className="p-3 sm:p-4">
                    <div className="font-semibold text-slate-100 text-sm sm:text-base">{order.mobile || "GUEST"}</div>
                    <div className="text-xs font-medium text-slate-400 font-mono">{order.billId || order._id}</div>
                  </td>
                  <td className="p-3 sm:p-4">
                    <div className="flex flex-wrap gap-1">
                      {order.items.map((item, i) => (
                        <span key={i} className="bg-slate-700/70 text-slate-100 px-2 py-1 rounded text-xs font-semibold border border-slate-600/50">
                          {item.name} x{item.qty}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="p-3 sm:p-4">
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${getPaymentMethodBadgeClasses(order.paymentMethod)}`}>
                      {getPaymentMethodType(order.paymentMethod)}
                    </span>
                  </td>
                  <td className="p-3 sm:p-4 text-right">
                    <div className="font-bold text-sm sm:text-base text-emerald-300">₹{order.finalTotal}</div>
                  </td>
                  <td className="p-3 sm:p-4 text-center">
                    <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-3">
                      <button
                        onClick={() => printBill(order)}
                        className="premium-button bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 px-3 py-2 rounded-xl font-bold hover:from-cyan-300 hover:to-blue-400 transition-all text-xs sm:text-sm"
                      >
                        Print
                      </button>
                      <button
                        onClick={() => openEditModal(order)}
                        className="premium-button bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 px-4 py-2 rounded-xl font-bold hover:from-amber-300 hover:to-orange-400 transition-all text-sm sm:text-base"
                      >
                        EDIT
                      </button>
                      <button
                        onClick={() => setConfirm({ show: true, id: order._id })}
                        className="premium-button bg-gradient-to-r from-rose-400 to-red-500 text-slate-950 px-4 py-2 rounded-xl font-bold hover:from-rose-300 hover:to-red-400 transition-all text-sm sm:text-base"
                      >
                        DELETE
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>


      {editingOrder && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/70 p-3 sm:p-4 backdrop-blur-sm">
          <div className="mt-2 w-full max-w-3xl rounded-3xl border border-slate-700 bg-slate-900 p-4 text-slate-100 shadow-2xl sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl sm:text-2xl font-black text-amber-300">Edit Order</h2>
              <button onClick={() => setEditingOrder(null)} className="text-slate-400 hover:text-white text-xl font-bold">✕</button>
            </div>

            <div className="max-h-[72vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Date</label>
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="premium-input w-full px-4 py-3"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Payment Method</label>
                  <select
                    value={editMethod}
                    onChange={(e) => setEditMethod(e.target.value)}
                    className="premium-input w-full px-4 py-3"
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="Swiggy">Swiggy</option>
                  </select>
                </div>
              </div>

              <div className="mt-5">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-semibold text-slate-300">Items</label>
                  <button onClick={addEditItem} className="text-sm font-bold text-cyan-400 hover:text-cyan-300">+ Add Item</button>
                </div>

                <div className="space-y-3">
                  {editItems.map((item, index) => (
                    <div key={index} className="grid grid-cols-1 gap-2 rounded-2xl border border-slate-700 bg-slate-950/70 p-3 md:grid-cols-[1.6fr_0.7fr_0.8fr_auto] md:items-center">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Item name (click to pick)"
                          value={item.name}
                          onClick={() => setProductPicker({ show: true, rowIndex: index })}
                          onChange={(e) => {
                            // allow manual typing
                            updateEditItem(index, "name", e.target.value);
                            setProductPicker({ show: false, rowIndex: null });
                          }}
                          className="premium-input px-3 py-2"
                        />

                        {productPicker.show && productPicker.rowIndex === index && (
                          <div className="absolute left-0 right-0 mt-2 z-20 max-h-56 overflow-y-auto rounded-xl border border-slate-700 bg-slate-900 p-2 shadow-2xl">
                            {productsLoading ? (
                              <div className="px-2 py-2 text-sm text-slate-300">Loading...</div>
                            ) : products.length === 0 ? (
                              <div className="px-2 py-2 text-sm text-slate-300">No products</div>
                            ) : (
                              products
                                .slice()
                                .sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")))
                                .map((p, pIndex) => (
                                  <button
                                    key={p._id || pIndex}
                                    type="button"
                                    onClick={() => pickProductForRow(index, p)}
                                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800/80 transition-colors flex items-center justify-between gap-3"
                                  >
                                    <span className="font-semibold text-slate-100 truncate">{p.name}</span>
                                    <span className="text-slate-300 text-sm whitespace-nowrap">
                                      ₹{normalizedUnitPriceFromProduct(p)}
                                    </span>
                                  </button>
                                ))
                            )}
                          </div>
                        )}
                      </div>
                      <input
                        type="number"
                        min="0"
                        placeholder="Qty"
                        value={item.qty}
                        onChange={(e) => updateEditItem(index, "qty", e.target.value)}
                        className="premium-input px-3 py-2"
                      />
                      <div className="text-right text-sm font-bold text-emerald-300 md:col-span-3 hidden">{lineTotalForItem(item)}</div>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Price"
                        value={item.price}
                        onChange={(e) => updateEditItem(index, "price", e.target.value)}
                        className="premium-input px-3 py-2"
                      />
                      <div className="hidden">
                        {lineTotalForItem(item)}
                      </div>
                      <button onClick={() => removeEditItem(index)} className="text-rose-400 hover:text-rose-300 text-lg font-bold md:justify-self-end">🗑</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 z-10 mt-4 border-t border-slate-700 bg-slate-900 pt-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-right sm:text-left">
                  <div className="text-xs font-semibold uppercase tracking-widest text-slate-400">Order Total</div>
                  <div className="text-xl font-black text-emerald-300">₹{computedOrderTotal.toFixed(2)}</div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
                  <button onClick={() => setEditingOrder(null)} className="premium-button-secondary px-4 py-3 rounded-2xl font-bold">Cancel</button>
                  <button onClick={saveEditedOrder} disabled={savingEdit} className="premium-button bg-gradient-to-r from-emerald-400 to-green-500 text-slate-950 px-5 py-3 rounded-2xl font-bold disabled:opacity-50">
                    {savingEdit ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM CONFIRM */}
      {confirm.show && (
        <div className="fixed inset-0 flex items-center justify-center z-[100] bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white p-6 rounded-2xl max-w-sm w-full shadow-2xl text-center border border-gray-100">
            <h2 className="text-2xl font-bold mb-2 text-red-600">Confirm Delete</h2>
            <p className="text-gray-700 mb-6 font-medium">Are you sure you want to delete this order?</p>
            <div className="flex gap-4">
              <button 
                onClick={() => deleteOrderAction(confirm.id)} 
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

export default Orders;
