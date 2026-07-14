const express = require("express");
const router = express.Router();

const {
  getMobileFieldSetting,
  setMobileFieldSetting,
  getOffersInBillingSetting,
  setOffersInBillingSetting,
} = require("../controllers/settingsController");

router.get("/mobile-field", getMobileFieldSetting);
router.post("/mobile-field", setMobileFieldSetting);

router.get("/offers-in-billing", getOffersInBillingSetting);
router.post("/offers-in-billing", setOffersInBillingSetting);


module.exports = router;

