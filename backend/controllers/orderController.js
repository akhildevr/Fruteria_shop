const Customer = require("../models/Customer");
const Order = require("../models/Order");
const generateBillId = require("../utils/generateBillId");

exports.createOrder = async (req, res) => {

  try {

    console.log("📝 [API] POST /api/orders - Creating order...");
    console.log("📥 [REQUEST] Mobile:", req.body.mobile, "Items:", req.body.items.length);

    const { mobile, items, paymentMethod } = req.body;

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
    if (amountAfterReward >= 500) {
      discount = amountAfterReward * 0.05;
    }

    // FINAL TOTAL
    const finalTotal = amountAfterReward - discount;

    // ADD NEW REWARD
    if (customer) { // Only earn rewards if a customer is associated
      rewardEarned = amountAfterReward < 500 ? Math.floor(finalTotal * 0.05) : 0;
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

      paymentMethod: paymentMethod || "Cash",

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

    // Emit socket event for instant reload
    const io = req.app.get("socketio");
    if (io) {
      io.emit("orderUpdated");
    }

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

exports.updateOrder = async (req, res) => {
  try {
    console.log("✏️  [API] PUT /api/orders/:id - Updating order...");
    const { id } = req.params;
    const { createdAt, items, paymentMethod, mobile } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      console.log("⚠️  [ERROR] Order not found:", id);
      return res.status(404).json({ error: "Order not found" });
    }

    const normalizedItems = (items || [])
      .map((item) => ({
        name: item.name || "",
        qty: Number(item.qty) || 0,
        price: Number(item.price) || 0
      }))
      .filter((item) => item.name || item.qty || item.price);

    const subtotal = normalizedItems.reduce((sum, item) => sum + item.qty * item.price, 0);

    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      {
        createdAt: createdAt ? new Date(createdAt) : order.createdAt,
        items: normalizedItems,
        subtotal,
        finalTotal: subtotal,
        paymentMethod: paymentMethod || order.paymentMethod || "Cash",
        mobile: mobile || order.mobile || "Guest"
      },
      { new: true }
    );

    console.log("✅ [DB] Order updated successfully:", id);

    const io = req.app.get("socketio");
    if (io) {
      io.emit("orderUpdated");
    }

    res.json({ success: true, order: updatedOrder });
  } catch (error) {
    console.error("❌ [ERROR] Failed to update order:", error.message);
    res.status(500).json({ error: error.message });
  }
};

exports.deleteOrder = async (req, res) => {
  try {
    console.log("🗑️  [API] DELETE /api/orders/:id - Deleting order...");
    const { id } = req.params;
    console.log("📥 [REQUEST] Order ID:", id);
    
    const order = await Order.findByIdAndDelete(id);
    
    if (!order) {
      console.log("⚠️  [ERROR] Order not found:", id);
      return res.status(404).json({ error: "Order not found" });
    }
    
    console.log("✅ [DB] Order deleted successfully:", id);

    // Emit socket event for instant reload
    const io = req.app.get("socketio");
    if (io) {
      io.emit("orderUpdated");
    }

    res.json({ success: true, message: "Order deleted successfully", order });
  } catch (error) {
    console.error("❌ [ERROR] Failed to delete order:", error.message);
    res.status(500).json({ error: error.message });
  }
};