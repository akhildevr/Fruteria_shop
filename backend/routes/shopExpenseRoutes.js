const express = require('express');
const router = express.Router();
const controller = require('../controllers/shopExpenseController');

router.get('/', controller.getShopExpenses);
router.post('/', controller.addShopExpense);
router.delete('/:id', controller.deleteShopExpense);

module.exports = router;
