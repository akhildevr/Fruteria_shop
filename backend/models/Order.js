const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({

  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer"
  },

  billId: {
    type: String,
    unique: true
  },

  mobile: String,

  items: [],

  subtotal: Number,

  discount: Number,

  rewardPointsEarned: Number,

  finalTotal: Number,

  paymentMethod: {
    type: String,
    default: "Cash"
  }

}, {
  timestamps: true
});

module.exports = mongoose.model(
  "Order",
  orderSchema
);