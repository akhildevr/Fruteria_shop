const Order = require("../models/Order");

exports.todaySales = async (req, res) => {

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

  res.json({
    totalSales,
    totalOrders: orders.length
  });
};