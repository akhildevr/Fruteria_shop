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

    let customer = null;
    let rewardUsed = 0;
    let amountAfterReward = subtotal;
    let rewardEarned = 0;
    let totalRewardPoints = 0; // To return in the response

    // Only process customer-related logic if a mobile number is provided and valid
    if (mobile && mobile.length >= 10) {
      customer = await Customer.findOne({ mobile });

      if (!customer) {
        console.log("👤 [DB] Creating new customer:", mobile);
        customer = await Customer.create({
          mobile,
          rewardPoints: 0,
          purchaseCount: 0,
          totalSpent: 0
        });
        console.log("✅ [DB] New customer created:", customer._id);
      } else {
        console.log("👤 [DB] Existing customer found:", mobile);
      }

      // APPLY REWARD POINTS (only if customer exists and has enough points)
      if (customer.rewardPoints > 20) {
        rewardUsed = Math.min(
          customer.rewardPoints,
          subtotal
        );
        amountAfterReward = subtotal - rewardUsed;
        customer.rewardPoints -= rewardUsed;
      }
    } else {
      console.log("⚠️  [API] No valid mobile number provided. Processing as guest order.");
    }
    // APPLY DISCOUNT
    let discount = 0;
    if (amountAfterReward > 500) {
      discount = amountAfterReward * 0.05;
    }

    // FINAL TOTAL
    const finalTotal = amountAfterReward - discount;

    // ADD NEW REWARD
    if (customer) { // Only earn rewards if a customer is associated
      rewardEarned = Math.floor(finalTotal * 0.05);
      customer.rewardPoints += rewardEarned;
      customer.purchaseCount += 1;
      customer.totalSpent += finalTotal;
      totalRewardPoints = customer.rewardPoints;
    } else {
      console.log("⚠️  [DB] No customer to update for guest order.");
    }

    if (customer) { // Only save customer if one exists
      await customer.save();
      console.log("✅ [DB] Customer updated - Purchase count:", customer.purchaseCount, "Total spent:", customer.totalSpent, "Reward points:", customer.rewardPoints);
    }

    const billId = generateBillId();
    console.log("🧾 [BILLID] Generated:", billId);

    const order = await Order.create({

      billId,

      customerId: customer ? customer._id : null, // Set customerId to null for guest orders

      mobile: mobile || "Guest", // Store "Guest" if no mobile provided

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
      totalRewardPoints: totalRewardPoints // Return the actual customer points or 0 for guest
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