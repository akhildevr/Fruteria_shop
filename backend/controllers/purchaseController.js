const Purchase = require('../models/Purchase');

// @desc    Add a new purchase
// @route   POST /api/purchases
// @access  Private
exports.addPurchase = async (req, res) => {
  try {
    const newPurchase = new Purchase(req.body);
    await newPurchase.save();
    res.status(201).json(newPurchase);
  } catch (error) {
    console.error('Error adding purchase:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all purchases
// @route   GET /api/purchases
// @access  Private
exports.getPurchases = async (req, res) => {
  try {
    const purchases = await Purchase.find().sort({ date: -1, createdAt: -1 });
    res.status(200).json(purchases);
  } catch (error) {
    console.error('Error fetching purchases:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete a purchase
// @route   DELETE /api/purchases/:id
// @access  Private
exports.deletePurchase = async (req, res) => {
  try {
    const purchase = await Purchase.findByIdAndDelete(req.params.id);
    if (!purchase) return res.status(404).json({ message: 'Purchase not found' });
    res.status(200).json({ message: 'Purchase deleted successfully' });
  } catch (error) {
    console.error('Error deleting purchase:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};