const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  page: {
    type: String,
    enum: ["Products", "Staff", "creditpurchase"],

    required: true,
    default: "Products"
  }
}, { timestamps: true });

module.exports = mongoose.model('Category', categorySchema);
