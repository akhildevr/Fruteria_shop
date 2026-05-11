const express = require("express");

const router = express.Router();

const {
  getCustomerByMobile,
  getAllCustomers
} = require("../controllers/customerController");

router.get(
  "/:mobile",
  getCustomerByMobile
);

router.get(
  "/",
  getAllCustomers
);

module.exports = router;