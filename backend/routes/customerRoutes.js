const express = require("express");

const router = express.Router();

const {
  getCustomerByMobile
} = require("../controllers/customerController");

router.get(
  "/:mobile",
  getCustomerByMobile
);

module.exports = router;