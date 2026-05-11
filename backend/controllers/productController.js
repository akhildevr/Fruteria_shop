const Product = require("../models/Product");


// GET PRODUCTS
exports.getProducts = async (req, res) => {

  try {
    console.log("📦 [API] GET /api/products - Fetching all products...");
    const products = await Product.find();
    console.log("✅ [DB] Found", products.length, "products");
    res.json(products);
  } catch (error) {
    console.error("❌ [ERROR] Fetch products failed:", error.message);
    res.status(500).json({ error: error.message });
  }
};


// ADD PRODUCT
exports.createProduct = async (req, res) => {

  try {
    console.log("📝 [API] POST /api/products - Creating product...");
    const {
      name,
      price,
      category
    } = req.body;

    const product = await Product.create({
      name,
      price,
      category
    });
    console.log("✅ [DB] Product created:", product._id, "-", product.name);
    res.json(product);
  } catch (error) {
    console.error("❌ [ERROR] Create product failed:", error.message);
    res.status(500).json({ error: error.message });
  }
};


// UPDATE PRODUCT
exports.updateProduct = async (req, res) => {

  try {
    console.log("✏️  [API] PUT /api/products/" + req.params.id + " - Updating product...");
    const product =
      await Product.findById(req.params.id);

    if (!product) {
      console.log("⚠️  [DB] Product not found:", req.params.id);
      return res.status(404).json({ error: "Product not found" });
    }

    product.name = req.body.name;
    product.price = req.body.price;
    product.category = req.body.category;

    await product.save();
    console.log("✅ [DB] Product updated:", product._id, "-", product.name);
    res.json(product);
  } catch (error) {
    console.error("❌ [ERROR] Update product failed:", error.message);
    res.status(500).json({ error: error.message });
  }
};


// DELETE PRODUCT
exports.deleteProduct = async (req, res) => {

  try {
    console.log("🗑️  [API] DELETE /api/products/" + req.params.id + " - Deleting product...");
    await Product.findByIdAndDelete(
      req.params.id
    );
    console.log("✅ [DB] Product deleted:", req.params.id);
    res.json({
      success: true
    });
  } catch (error) {
    console.error("❌ [ERROR] Delete product failed:", error.message);
    res.status(500).json({ error: error.message });
  }
};