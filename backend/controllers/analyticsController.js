const Order = require("../models/Order");

exports.todaySales = async (req, res) => {

  try {

    console.log("📊 [API] GET /api/analytics/today-sales - Fetching today's sales...");

    const start = new Date();
    start.setHours(2, 0, 0, 0);  // Start from 2 AM today

    const end = new Date();
    end.setDate(end.getDate() + 1);
    end.setHours(2, 0, 0, 0);  // End at 2 AM tomorrow

    const orders = await Order.find({
      createdAt: {
        $gte: start,
        $lt: end
      }
    });

    const totalSales = orders.reduce(
      (sum, order) =>
        sum + order.finalTotal,
      0
    );

    console.log("✅ [DB] Today's sales calculated - Total: ₹" + totalSales, "Orders:", orders.length);

    res.json({
      totalSales,
      totalOrders: orders.length
    });

  } catch (error) {

    console.error("❌ [ERROR] Analytics fetch failed:", error.message);
    res.status(500).json({ error: error.message });

  }
};