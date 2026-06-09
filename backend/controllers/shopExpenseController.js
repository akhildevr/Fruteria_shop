const ShopExpense = require('../models/ShopExpense');

exports.addShopExpense = async (req, res) => {
  try {
    const { category, subcategory, emiName, startMonth, endMonth, amount, date } = req.body;

    if (!category || !['Shop', 'EMI', 'Room'].includes(category)) {
      return res.status(400).json({ message: 'Invalid category' });
    }

    if (category === 'EMI') {
      if (!emiName || !emiName.toString().trim()) {
        return res.status(400).json({ message: 'EMI name is required' });
      }
    }

    if (['Shop', 'Room'].includes(category)) {
      if (!subcategory || !['Deposit', 'Rent'].includes(subcategory)) {
        return res.status(400).json({ message: 'Subcategory is required for Shop and Room' });
      }
    }

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ message: 'Amount must be greater than zero' });
    }

    if (!date) {
      return res.status(400).json({ message: 'Payment date is required' });
    }

    const payload = { ...req.body };
    if (category === 'EMI') {
      delete payload.subcategory;
    }

    const newRecord = new ShopExpense(payload);
    await newRecord.save();

    const io = req.app.get('socketio');
    if (io) io.emit('shopExpenseUpdated');

    res.status(201).json(newRecord);
  } catch (error) {
    console.error('Error adding shop expense:', error);
    let errorMessage = 'Server error';
    if (error.name === 'ValidationError') {
      errorMessage = Object.values(error.errors).map(err => err.message).join(', ');
    } else if (error.message) {
      errorMessage = error.message;
    }
    res.status(500).json({ message: errorMessage, error: error.message });
  }
};

exports.getShopExpenses = async (req, res) => {
  try {
    const items = await ShopExpense.find().sort({ date: -1, createdAt: -1 });
    res.status(200).json(items);
  } catch (error) {
    console.error('Error fetching shop expenses:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.deleteShopExpense = async (req, res) => {
  try {
    const item = await ShopExpense.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: 'Record not found' });

    const io = req.app.get('socketio');
    if (io) io.emit('shopExpenseUpdated');

    res.status(200).json({ message: 'Deleted' });
  } catch (error) {
    console.error('Error deleting shop expense:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
