const Customer = require("../models/Customer");
const Order = require("../models/Order");
const generateBillId = require("../utils/generateBillId");

exports.createOrder = async (req, res) => {

  try {

    console.log("📝 [API] POST /api/orders - Creating order...");
    console.log("📥 [REQUEST] Mobile:", req.body.mobile, "Items:", req.body.items.length);

    const { mobile, items } = req.body;

    let subtotal = 0;

    items.forEach(item => {
      subtotal += item.price * item.qty;
    });

    let customer = await Customer.findOne({ mobile });

    if (!customer) {
      console.log("👤 [DB] Creating new customer:", mobile);
      customer = await Customer.create({
        mobile
      });
      console.log("✅ [DB] New customer created:", customer._id);
    } else {
      console.log("👤 [DB] Existing customer found:", mobile);
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
    console.log("✅ [DB] Customer updated - Purchase count:", customer.purchaseCount, "Total spent:", customer.totalSpent, "Reward points:", customer.rewardPoints);

    const billId = generateBillId();
    console.log("🧾 [BILLID] Generated:", billId);

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
    console.log("✅ [DB] Order saved successfully:", order._id);

    console.log("✅ [SUCCESS] Order created! Bill ID:", order.billId, "Final Total:", order.finalTotal);
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

    console.error("❌ [ERROR] Order creation failed:", error.message);
    res.status(500).json({
      error: error.message
    });
  }
};

exports.getOrders = async (req, res) => {
 try {
    console.log("📖 [API] GET /api/orders - Fetching all orders...");
    const orders = await Order.find().sort({ createdAt: -1 });
    console.log("✅ [DB] Found", orders.length, "orders");
    res.json(orders);
  } catch (error) {
    console.error("❌ [ERROR] Failed to fetch orders:", error.message);
    res.status(500).json({ error: error.message });
  }
};