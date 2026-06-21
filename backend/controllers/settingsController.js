const Settings = require("../models/Settings");

const MOBILE_FIELD_KEY = "showMobileFieldInBilling";

exports.getMobileFieldSetting = async (req, res) => {
  try {
    const setting = await Settings.findOne({ key: MOBILE_FIELD_KEY });

    // Default: enabled
    const showMobileField = setting ? Boolean(setting.value) : true;

    res.json({ showMobileField });
  } catch (error) {
    console.error("❌ [ERROR] getMobileFieldSetting failed:", error);
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
};

exports.setMobileFieldSetting = async (req, res) => {
  try {
    const { showMobileField } = req.body;

    // Validate boolean-ish.
    // Important: don't treat "false" (string) as truthy.
    let normalized;
    if (typeof showMobileField === "boolean") normalized = showMobileField;
    else if (typeof showMobileField === "string") {
      normalized = showMobileField.toLowerCase() === "true";
    } else normalized = Boolean(showMobileField);

    const updated = await Settings.findOneAndUpdate(
      { key: MOBILE_FIELD_KEY },
      { value: normalized },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Notify all connected clients so Billing updates instantly
    const io = req.app.get("socketio");
    if (io) {
      io.emit("settingsUpdated", { key: MOBILE_FIELD_KEY, value: Boolean(updated.value) });
    }

    res.json({ showMobileField: Boolean(updated.value) });

  } catch (error) {
    console.error("❌ [ERROR] setMobileFieldSetting failed:", error);
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
};


