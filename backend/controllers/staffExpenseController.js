const StaffExpense = require('../models/StaffExpense');

exports.addStaffExpense = async (req, res) => {
  try {
    console.log("📝 [API] POST /api/staff-expenses - Recording expense...");
    const newExpense = new StaffExpense(req.body);
    await newExpense.save();

    const io = req.app.get("socketio");
    if (io) {
      io.emit("staffExpenseUpdated");
    }

    console.log("✅ [DB] Staff expense recorded:", newExpense._id);
    res.status(201).json(newExpense);
  } catch (error) {
    console.error('Error adding staff expense:', error);
    let errorMessage = 'Server error';
    if (error.name === 'ValidationError') { // Handle Mongoose validation errors specifically
      errorMessage = Object.values(error.errors).map(err => err.message).join(', ');
    } else if (error.message) {
      errorMessage = error.message;
    }
    res.status(500).json({ message: errorMessage, error: error.message });
  }
};

exports.getStaffExpenses = async (req, res) => {
  try {
    console.log("📖 [API] GET /api/staff-expenses - Fetching records...");
    const expenses = await StaffExpense.find().sort({ date: -1, createdAt: -1 });
    res.status(200).json(expenses);
  } catch (error) {
    console.error('Error fetching staff expenses:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.deleteStaffExpense = async (req, res) => {
  try {
    console.log(`🗑️ [API] DELETE /api/staff-expenses/${req.params.id} - Deleting record...`);
    const expense = await StaffExpense.findByIdAndDelete(req.params.id);
    if (!expense) return res.status(404).json({ message: 'Expense not found' });

    const io = req.app.get("socketio");
    if (io) {
      io.emit("staffExpenseUpdated");
    }

    res.status(200).json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};