const express = require('express');
const { addPurchase, getPurchases, deletePurchase } = require('../controllers/purchaseController');

const router = express.Router();

// Define purchase routes
router.route('/')
  .post(addPurchase)
  .get(getPurchases);
router.route('/:id').delete(deletePurchase);

module.exports = router;