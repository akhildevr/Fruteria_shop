const express = require("express");
const router = express.Router();
const {
  todaySales,
  salesByBillDate
} = require("../controllers/analyticsController");

router.get("/today-sales", todaySales);
router.get("/sales-by-date", salesByBillDate);

module.exports = router;
