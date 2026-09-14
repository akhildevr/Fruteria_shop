const Order = require("../models/Order");
const Purchase = require("../models/Purchase");
const StaffExpense = require("../models/StaffExpense");
const ShopExpense = require("../models/ShopExpense");

const normalizePaymentMethod = (pm) => {
  if (!pm) return "";
  return String(pm).trim().toUpperCase();
};

const calculateSalesBuckets = (orders) => {
  let totalSales = 0;
  let cashTotal = 0;
  let upiTotal = 0;
  let swiggyTotal = 0;

  for (const order of orders) {
    const amount = Number(order.finalTotal) || 0;
    totalSales += amount;

    const pm = normalizePaymentMethod(order.paymentMethod);
    // empty/undefined => Cash bucket (match frontend)
    if (!pm || pm === "CASH") cashTotal += amount;
    else if (pm === "UPI") upiTotal += amount;
    else if (pm === "SWIGGY") swiggyTotal += amount;
  }

  return { totalSales, cashTotal, upiTotal, swiggyTotal, totalOrders: orders.length };
};

exports.todaySales = async (req, res) => {
  try {
    console.log("📊 [API] GET /api/analytics/today-sales - Fetching today's sales...");

    // Business day window: 02:00 (today or yesterday if before 2AM) -> 02:00 next day.
    // Orders from 00:00-01:59 belong to the PREVIOUS business day.
    const start = new Date();
    if (start.getHours() < 2) {
      // Before 2AM -> business day started yesterday at 02:00
      start.setDate(start.getDate() - 1);
    }
    start.setHours(2, 0, 0, 0);

    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    end.setHours(2, 0, 0, 0);

    // Include both editable billDate and immutable createdAt (fallback),
    // matching the same logic as salesByBillDate.
    const orders = await Order.find({
      $or: [
        { billDate: { $gte: start, $lt: end } },
        {
          $and: [
            { $or: [{ billDate: null }, { billDate: { $exists: false } }] },
            { createdAt: { $gte: start, $lt: end } }
          ]
        }
      ]
    });

    const { totalSales, cashTotal, upiTotal, swiggyTotal, totalOrders } = calculateSalesBuckets(orders);

    console.log(
      "✅ [DB] Today's sales calculated - Total: ₹" + totalSales,
      "Cash: ₹" + cashTotal,
      "UPI: ₹" + upiTotal,
      "Swiggy: ₹" + swiggyTotal,
      "Orders:",
      totalOrders
    );

    res.json({
      totalSales,
      todayCashSales: cashTotal,
      todayUpiSales: upiTotal,
      todaySwiggySales: swiggyTotal,
      totalOrders
    });
  } catch (error) {
    console.error("❌ [ERROR] Analytics fetch failed:", error.message);
    res.status(500).json({ error: error.message });
  }
};

// Used by admin Dashboard day filter
// IMPORTANT: Dashboard selects by "selectedDate" which represents BUSINESS DAY (as in frontend getBusinessDate)
// That means the server should also bucket orders by billDate/billDate OR createdAt using the same business-day cut.
exports.salesByBillDate = async (req, res) => {
  try {
    const { billDate } = req.query;
    if (!billDate) {
      return res.status(400).json({ error: "billDate query param is required (YYYY-MM-DD)" });
    }

    // billDate is YYYY-MM-DD from <input type="date">
    // Convert to business-day range: start 02:00 of that date to 02:00 of next date
    const start = new Date(billDate + "T00:00:00.000Z");
    // If your server timezone is not UTC, Mongoose stores Date in UTC.
    // We still want a stable business-day cut based on local date string.
    // So compute in server local time by using Date(billDate) without Z.
    const startLocal = new Date(billDate + "T00:00:00");
    startLocal.setHours(2, 0, 0, 0);

    const endLocal = new Date(billDate + "T00:00:00");
    endLocal.setDate(endLocal.getDate() + 1);
    endLocal.setHours(2, 0, 0, 0);

    // Use billDate if present; otherwise fall back to createdAt.
    // But Mongo can't easily do coalesce; we filter by either:
    //  - orders with billDate inside range
    //  - OR orders with billDate missing/null and createdAt inside range
    const orders = await Order.find({
      $or: [
        { billDate: { $gte: startLocal, $lt: endLocal } },
        {
          $and: [
            { $or: [{ billDate: null }, { billDate: { $exists: false } }] },
            { createdAt: { $gte: startLocal, $lt: endLocal } }
          ]
        }
      ]
    });

    const { totalSales, cashTotal, upiTotal, swiggyTotal, totalOrders } = calculateSalesBuckets(orders);

    res.json({
      selectedDate: billDate,
      totalSales,
      todayCashSales: cashTotal,
      todayUpiSales: upiTotal,
      todaySwiggySales: swiggyTotal,
      totalOrders
    });
  } catch (error) {
    console.error("❌ [ERROR] salesByBillDate failed:", error.message);
    res.status(500).json({ error: error.message });
  }
};

exports.getMonthlyExpenses = async (req, res) => {
  try {
    const { year } = req.query;
    const filterYear = year ? parseInt(year) : new Date().getFullYear();

    const startOfYear = new Date(filterYear, 0, 1);
    const endOfYear = new Date(filterYear + 1, 0, 1);

    const query = { date: { $gte: startOfYear, $lt: endOfYear } };

    const [purchases, staffExpenses, shopExpenses] = await Promise.all([
      Purchase.find(query),
      StaffExpense.find(query),
      ShopExpense.find(query),
    ]);

    const monthlyData = {};

    for (let i = 0; i < 12; i++) {
      const monthKey = `${filterYear}-${String(i + 1).padStart(2, '0')}`;
      const label = new Date(filterYear, i).toLocaleDateString("en-IN", {
        month: "long",
        year: "numeric",
      });
      monthlyData[monthKey] = {
        month: monthKey,
        label,
        totalPurchase: 0,
        staffSalary: 0,
        roomRent: 0,
        shopRent: 0,
        shopDeposit: 0,
        roomDeposit: 0,
        otherExpenses: 0
      };
    }

    purchases.forEach(p => {
      const m = `${p.date.getFullYear()}-${String(p.date.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyData[m]) monthlyData[m].totalPurchase += Number(p.price) || 0;
    });

    staffExpenses.forEach(e => {
      const m = `${e.date.getFullYear()}-${String(e.date.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyData[m]) {
        if (e.type === 'Salary' || e.type === 'Advance') {
          monthlyData[m].staffSalary += Number(e.amount) || 0;
        } else if (e.type === 'Room') {
          monthlyData[m].roomRent += Number(e.amount) || 0;
        } else if (e.type === 'Food' || e.type === 'Other') {
          monthlyData[m].otherExpenses += Number(e.amount) || 0;
        }
      }
    });

    shopExpenses.forEach(e => {
      const m = `${e.date.getFullYear()}-${String(e.date.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyData[m]) {
        if (e.category === 'Shop') {
          if (e.subcategory === 'Rent') monthlyData[m].shopRent += Number(e.amount) || 0;
          if (e.subcategory === 'Deposit') monthlyData[m].shopDeposit += Number(e.amount) || 0;
        } else if (e.category === 'Room') {
          if (e.subcategory === 'Rent') monthlyData[m].roomRent += Number(e.amount) || 0;
          if (e.subcategory === 'Deposit') monthlyData[m].roomDeposit += Number(e.amount) || 0;
        }
      }
    });

    const result = Object.values(monthlyData).sort((a, b) => b.month.localeCompare(a.month));

    res.json(result);
  } catch (error) {
    console.error("❌ [ERROR] getMonthlyExpenses failed:", error.message);
    res.status(500).json({ error: error.message });
  }
};

