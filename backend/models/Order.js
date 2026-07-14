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
  },

  // Editable bill date shown in Orders admin UI.
  // (Mongo timestamps' `createdAt` remains immutable via schema timestamps)
  billDate: Date

}, {
  timestamps: true
});

module.exports = mongoose.model(
  "Order",
  orderSchema
);