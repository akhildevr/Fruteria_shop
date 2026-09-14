const express = require("express");
const router = express.Router();
const {
  todaySales,
  salesByBillDate,
  getMonthlyExpenses
} = require("../controllers/analyticsController");

router.get("/today-sales", todaySales);
router.get("/sales-by-date", salesByBillDate);
router.get("/monthly-expenses", getMonthlyExpenses);

module.exports = router;
