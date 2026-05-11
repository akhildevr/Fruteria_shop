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
