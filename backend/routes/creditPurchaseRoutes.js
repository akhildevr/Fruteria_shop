const express = require('express');
const router = express.Router();

const {
  addCreditPurchase,
  getCreditPurchases,
  deleteCreditPurchase,
  updateCreditPurchase,
} = require('../controllers/creditPurchaseController');

router.route('/')
  .post(addCreditPurchase)
  .get(getCreditPurchases);

router.route('/:id').delete(deleteCreditPurchase).put(updateCreditPurchase);

module.exports = router;


