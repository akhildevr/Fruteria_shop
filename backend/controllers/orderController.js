const Customer = require("../models/Customer");
const Order = require("../models/Order");

exports.createOrder = async (req, res) => {

  try {

    const { mobile, items } = req.body;

    let subtotal = 0;

    items.forEach(item => {
      subtotal += item.price * item.qty;
    });

    let discount = 0;
    let rewardPoints = 0;
    let finalTotal = subtotal;

    if (subtotal > 500) {

      discount = subtotal * 0.10;

      finalTotal = subtotal - discount;

    } else {

      rewardPoints = Math.floor(subtotal * 0.10);

    }

    let customer = await Customer.findOne({ mobile });

    if (!customer) {

      customer = await Customer.create({
        mobile
      });
    }

    customer.purchaseCount += 1;

    customer.totalSpent += finalTotal;

    customer.rewardPoints += rewardPoints;

    await customer.save();

    const order = await Order.create({

      customerId: customer._id,

      mobile,

      items,

      subtotal,

      discount,

      rewardPointsEarned: rewardPoints,

      finalTotal

    });

    res.json({
      success: true,
      order,
      subtotal,
      discount,
      rewardPoints,
      finalTotal,
      totalRewardPoints: customer.rewardPoints
    });

  } catch (error) {

    res.status(500).json({
      error: error.message
    });
  }
};

exports.getOrders = async (req, res) => {

  const orders = await Order.find()
    .sort({ createdAt: -1 });
};