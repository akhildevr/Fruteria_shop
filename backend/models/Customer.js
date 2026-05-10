const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema({

  mobile: {
    type: String,
    required: true,
    unique: true
  },

  purchaseCount: {
    type: Number,
    default: 0
  },

  totalSpent: {
    type: Number,
    default: 0
  },

  rewardPoints: {
    type: Number,
    default: 0
  }

}, {
  timestamps: true
});

module.exports = mongoose.model(
  "Customer",
  customerSchema
);