const express = require("express");
const router = express.Router();

const {
  getMobileFieldSetting,
  setMobileFieldSetting
} = require("../controllers/settingsController");

router.get("/mobile-field", getMobileFieldSetting);
router.post("/mobile-field", setMobileFieldSetting);

module.exports = router;

