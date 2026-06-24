const CreditPurchase = require('../models/CreditPurchase');

// @desc    Add a new credit/purchase entry
// @route   POST /api/credit-purchases
// @access  Private
exports.addCreditPurchase = async (req, res) => {
  try {
    const { name, type, amount, date, description } = req.body;

    if (!name || !name.toString().trim()) {
      return res.status(400).json({ message: 'Invalid name' });
    }


    if (!type || !['Credit', 'Purchase'].includes(type)) {
      return res.status(400).json({ message: 'Invalid type' });
    }

    if (amount === undefined || amount === null || Number(amount) <= 0) {
      return res.status(400).json({ message: 'Amount must be greater than zero' });
    }

    if (!date) {
      return res.status(400).json({ message: 'Date is required' });
    }

    const newEntry = new CreditPurchase({ name, type, amount: Number(amount), date, description });
    await newEntry.save();

    const io = req.app.get('socketio');
    if (io) io.emit('creditPurchaseUpdated');

    res.status(201).json(newEntry);
  } catch (error) {
    console.error('Error adding credit/purchase entry:', error);
    let errorMessage = 'Server error';
    if (error?.name === 'ValidationError') {
      errorMessage = Object.values(error.errors).map((e) => e.message).join(', ');
    } else if (error?.message) {
      errorMessage = error.message;
    }
    res.status(500).json({ message: errorMessage, error: error?.message });
  }
};

// @desc    Get all credit/purchase entries
// @route   GET /api/credit-purchases
// @access  Private
exports.getCreditPurchases = async (req, res) => {
  try {
    const entries = await CreditPurchase.find().sort({ date: -1, createdAt: -1 });
    res.status(200).json(entries);
  } catch (error) {
    console.error('Error fetching credit/purchase entries:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete a credit/purchase entry
// @route   DELETE /api/credit-purchases/:id
// @access  Private
exports.deleteCreditPurchase = async (req, res) => {
  try {
    const deleted = await CreditPurchase.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Entry not found' });

    const io = req.app.get('socketio');
    if (io) io.emit('creditPurchaseUpdated');

    res.status(200).json({ message: 'Entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting credit/purchase entry:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update a credit/purchase entry
// @route   PUT /api/credit-purchases/:id
// @access  Private
exports.updateCreditPurchase = async (req, res) => {
  try {
    const { name, type, amount, date, description } = req.body;

    if (!name || !name.toString().trim()) {
      return res.status(400).json({ message: 'Invalid name' });
    }

    if (!type || !['Credit', 'Purchase'].includes(type)) {
      return res.status(400).json({ message: 'Invalid type' });
    }

    if (amount === undefined || amount === null || Number(amount) <= 0) {
      return res.status(400).json({ message: 'Amount must be greater than zero' });
    }

    if (!date) {
      return res.status(400).json({ message: 'Date is required' });
    }

    const updated = await CreditPurchase.findByIdAndUpdate(
      req.params.id,
      {
        name: name.toString().trim(),
        type,
        amount: Number(amount),
        date,
        description: description || '',
      },
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: 'Entry not found' });

    const io = req.app.get('socketio');
    if (io) io.emit('creditPurchaseUpdated');

    res.status(200).json(updated);
  } catch (error) {
    console.error('Error updating credit/purchase entry:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};



