const Customer = require("../models/Customer");

exports.getCustomerByMobile = async (req, res) => {
  try {
    console.log("🔍 [API] GET /api/customers/" + req.params.mobile + " - Fetching customer...");
    const customer = await Customer.findOne({
      mobile: req.params.mobile
    });

    if (!customer) {
      console.log("⚠️  [DB] Customer not found:", req.params.mobile);
      return res.json({
        exists: false,
        rewardPoints: 0
      });
    }

    console.log("✅ [DB] Customer found:", req.params.mobile, "Reward Points:", customer.rewardPoints);
    res.json({
      exists: true,
      rewardPoints: customer.rewardPoints
    });
  } catch (error) {
    console.error("❌ [ERROR] Customer fetch failed:", error.message);
    res.status(500).json({
      error: error.message
    });
  }
};

exports.getAllCustomers = async (req, res) => {
  try {
    console.log("📖 [API] GET /api/customers - Fetching all customers...");
    const customers = await Customer.find({});
    console.log("✅ [DB] Found", customers.length, "customers");
    res.json(customers);
  } catch (error) {
    console.error("❌ [ERROR] Failed to fetch all customers:", error.message);
    res.status(500).json({ error: error.message });
  }
};
