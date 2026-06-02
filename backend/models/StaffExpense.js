const mongoose = require('mongoose');

const staffExpenseSchema = new mongoose.Schema({
  staffName: { 
    type: String, 
    required: true, 
    trim: true,
    default: "Common" 
  },
  type: { 
    type: String, 
    enum: ['Salary', 'Food', 'Room', 'Advance', 'Other'], 
    required: true 
  },
  amount: { 
    type: Number, 
    required: true 
  },
  date: { 
    type: Date, 
    required: true 
  },
  description: { 
    type: String, 
    trim: true 
  }
}, { timestamps: true });

module.exports = mongoose.model('StaffExpense', staffExpenseSchema);