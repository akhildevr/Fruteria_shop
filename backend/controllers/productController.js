const Product = require("../models/Product");


// GET PRODUCTS
exports.getProducts = async (req, res) => {

  const products = await Product.find();

  res.json(products);
};


// ADD PRODUCT
exports.createProduct = async (req, res) => {

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

  res.json(product);
};


// UPDATE PRODUCT
exports.updateProduct = async (req, res) => {

  const product =
    await Product.findById(req.params.id);

  product.name = req.body.name;
  product.price = req.body.price;
  product.category = req.body.category;

  await product.save();

  res.json(product);
};


// DELETE PRODUCT
exports.deleteProduct = async (req, res) => {

  await Product.findByIdAndDelete(
    req.params.id
  );

  res.json({
    success: true
  });
};