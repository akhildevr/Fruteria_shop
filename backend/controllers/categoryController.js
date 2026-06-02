const Category = require("../models/Category");

// GET CATEGORIES
exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json(categories);
  } catch (error) {
    console.error("❌ [ERROR] Fetch categories failed:", error.message);
    res.status(500).json({ error: error.message });
  }
};

// ADD CATEGORY
exports.createCategory = async (req, res) => {
  try {
    const { name, page } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Category name is required" });
    }

    const normalizedPage = typeof page === "string" ? page.trim() : "";
    const validPage = normalizedPage.toLowerCase() === "staff" ? "Staff" : "Products";
    const categoryPage = ["Products", "Staff"].includes(validPage) ? validPage : "Products";
    const existingCategory = await Category.findOne({ name: name.trim(), page: categoryPage });
    if (existingCategory) {
      return res.status(400).json({ error: "Category already exists" });
    }

    const category = await Category.create({ name: name.trim(), page: categoryPage });
    const io = req.app.get("socketio");
    if (io) {
      io.emit("categoryUpdated");
    }
    res.json(category);
  } catch (error) {
    console.error("❌ [ERROR] Create category failed:", error.message);
    res.status(500).json({ error: error.message });
  }
};

// DELETE CATEGORY
exports.deleteCategory = async (req, res) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    const io = req.app.get("socketio");
    if (io) {
      io.emit("categoryUpdated");
    }
    res.json({ success: true });
  } catch (error) {
    console.error("❌ [ERROR] Delete category failed:", error.message);
    res.status(500).json({ error: error.message });
  }
};
