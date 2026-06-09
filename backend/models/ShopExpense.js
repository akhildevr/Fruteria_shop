const mongoose = require('mongoose');

const shopExpenseSchema = new mongoose.Schema({
  category: { type: String, enum: ['Shop', 'EMI', 'Room'], required: true },
  subcategory: {
    type: String,
    enum: ['Deposit', 'Rent'],
    required: function () {
      return ['Shop', 'Room'].includes(this.category);
    }
  },
  emiName: {
    type: String,
    trim: true,
    required: function () {
      return this.category === 'EMI';
    }
  },
  startMonth: {
    type: String,
    trim: true
  },
  endMonth: {
    type: String,
    trim: true
  },
  amount: { type: Number, required: true },
  date: { type: Date, required: true },
  description: { type: String, trim: true }
}, { timestamps: true });

module.exports = mongoose.model('ShopExpense', shopExpenseSchema);
