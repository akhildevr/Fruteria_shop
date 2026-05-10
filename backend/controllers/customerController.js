const Customer = require("../models/Customer");

exports.getCustomerByMobile = async (req, res) => {
  try {
    const customer = await Customer.findOne({
      mobile: req.params.mobile
    });

    if (!customer) {
      return res.json({
        exists: false,
        rewardPoints: 0
      });
    }

    res.json({
      exists: true,
      rewardPoints: customer.rewardPoints
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};
