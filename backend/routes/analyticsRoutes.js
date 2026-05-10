const express = require("express");
const router = express.Router();
const {
  todaySales
} = require("../controllers/analyticsController");

router.get(
  "/today-sales",
  todaySales
);

module.exports = router;