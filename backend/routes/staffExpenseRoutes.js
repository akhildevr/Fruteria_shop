const express = require('express');
const router = express.Router();
const { addStaffExpense, getStaffExpenses, deleteStaffExpense } = require('../controllers/staffExpenseController');

router.get('/', getStaffExpenses);
router.post('/', addStaffExpense);
router.delete('/:id', deleteStaffExpense);

module.exports = router;