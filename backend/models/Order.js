const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({

  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer"
  },

  mobile: String,

  items: [],

  subtotal: Number,

  discount: Number,

  rewardPointsEarned: Number,

  finalTotal: Number

}, {
  timestamps: true
});

module.exports = mongoose.model(
  "Order",
  orderSchema
);