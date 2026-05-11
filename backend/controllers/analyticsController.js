const Order = require("../models/Order");

exports.todaySales = async (req, res) => {

  try {

    console.log("📊 [API] GET /api/analytics/today-sales - Fetching today's sales...");

    const start = new Date();

    start.setHours(0, 0, 0, 0);

    const end = new Date();

    end.setHours(23, 59, 59, 999);

    const orders = await Order.find({
      createdAt: {
        $gte: start,
        $lte: end
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