const Customer = require("../models/Customer");
const Order = require("../models/Order");
const generateBillId = require("../utils/generateBillId");

exports.createOrder = async (req, res) => {

  try {

    const { mobile, items } = req.body;

    let subtotal = 0;

    items.forEach(item => {
      subtotal += item.price * item.qty;
    });

    let customer = await Customer.findOne({ mobile });

    if (!customer) {
      customer = await Customer.create({
        mobile
      });
    }

    let rewardUsed = 0;
    let amountAfterReward = subtotal;

    // APPLY REWARD POINTS
    if (customer.rewardPoints > 10) {
      rewardUsed = Math.min(
        customer.rewardPoints,
        subtotal
      );

      amountAfterReward = subtotal - rewardUsed;
      customer.rewardPoints -= rewardUsed;
    }

    // APPLY DISCOUNT
    let discount = 0;

    if (amountAfterReward > 500) {
      discount = amountAfterReward * 0.10;
    }

    // FINAL TOTAL
    const finalTotal = amountAfterReward - discount;

    // ADD NEW REWARD
    let rewardEarned = 0;

    if (finalTotal <= 500) {
      rewardEarned = Math.floor(finalTotal * 0.10);
      customer.rewardPoints += rewardEarned;
    }

    customer.purchaseCount += 1;
    customer.totalSpent += finalTotal;

    await customer.save();

    const billId = generateBillId();

    const order = await Order.create({

      billId,

      customerId: customer._id,

      mobile,

      items,

      subtotal,

      rewardUsed,

      discount,

      rewardPointsEarned: rewardEarned,

      finalTotal

    });

    res.json({
      success: true,
      order,
      subtotal,
      discount,
      rewardUsed,
      rewardEarned,
      finalTotal,
      totalRewardPoints: customer ? customer.rewardPoints : 0
    });

  } catch (error) {

    res.status(500).json({
      error: error.message
    });
  }
};

exports.getOrders = async (req, res) => {
 try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};