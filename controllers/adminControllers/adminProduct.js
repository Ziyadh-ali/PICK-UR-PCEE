const Category = require("../../model/categoryModel");
const Brand = require("../../model/brandsModel");
const Product = require("../../model/productModel");
const cloudinary = require("cloudinary").v2;
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_KEY,
  api_secret: process.env.CLOUD_SECRET,
});

const loadProducts = async (req, res) => {
  try {
    const Categories = await Category.find({ status: true });
    const Brands = await Brand.find({ status: true });

    const page = parseInt(req.query.page) || 1;
    const limit = 5;
    const skip = (page - 1) * limit;

    let filter = {};

    if (req.query.category && req.query.category !== "all") {
      filter.category = req.query.category;
    }
    if (req.query.brand && req.query.brand !== "all") {
      filter.brands = req.query.brand;
    }
    if (req.query.status && req.query.status !== "all") {
      filter.isActive = req.query.status === "active";
    }


    const Products = await Product.find(filter)
      .skip(skip)
      .limit(limit);

    const totalProducts = await Product.countDocuments(filter);
    const totalPages = Math.ceil(totalProducts / limit);

    res.render("products", {
      Categories,
      Brands,
      Products,
      currentPage: page,
      totalPages,
      selectedFilters: {
        category: req.query.category || "all",
        brand: req.query.brand || "all",
        status: req.query.status || "all",
      },
    });
  } catch (error) {
    console.error(error);
  }
};

const loadAddProduct = async (req, res) => {
  try {
    const Brands = await Brand.find({ status: true });
    const Categories = await Category.find({ status: true });
    res.render("addProduct", { Categories, Brands });
  } catch (error) {
    console.error(error);
  }
};
const addProduct = async (req, res) => {
  try {
    const {
      productName,
      productDescription,
      productSpecification,
      brand,
      stock,
      price,
      category,
    } = req.body;
    const productExists = await Product.findOne({
      name: { $regex: new RegExp(productName, "i") },
    });

    if (!productExists) {
      const images = [];
      if (req.files && req.files.length > 0) {
        for (let i = 0; i < req.files.length; i++) {
          images.push(req.files[i].path);
        }
      }

      const newProduct = new Product({
        name: productName,
        description: productDescription,
        specification: productSpecification,
        brands: brand,
        category: category,
        stock: stock,
        price: price,
        image: images,
      });
      await newProduct.save();
      req.flash("right_message", "Product Added Successfully");
      res.redirect("/admin/products");
    } else {
      req.flash(
        "err_message",
        "Failed to Add Product - Product Already Exists"
      );
      res.redirect("/admin/products");
    }
  } catch (error) {
    console.error(error);
  }
};
const editProduct = async (req, res) => {
  try {
    const id = req.params.id;
    const product = await Product.findOne({ _id: id });
    const data = req.body;
    const existingProduct = await Product.findOne({
      productName: data.productName,
      _id: { $ne: id },
    });
    if (existingProduct) {
      return res
        .status(400)
        .json({ error: "Product with this name already exists" });
    }
    const images = [];
    if (req.files && req.files.length > 0) {
      for (let i = 0; i < req.files.length; i++) {
        images.push(req.files[i].path);
      }
    }

    const updateFields = {
      name: data.productName,
      description: data.productDescription,
      specification: data.productSpecification,
      brands: data.brand,
      category: data.category,
      stock: data.stock,
      price: data.price,
    };
    if (req.files.length > 0) {
      updateFields.$push = { image: { $each: images } };
    }
    const productSave = await Product.findByIdAndUpdate(id, updateFields);
    if (productSave) {
      res.redirect("/admin/products");
    }
  } catch (error) { }
};

const removeProduct = async (req, res) => {
  try {
    const { imageNameToServer, productIdToServer } = req.body;
    const imagePath = imageNameToServer;
    const product = await Product.findByIdAndUpdate(productIdToServer, {
      $pull: { image: imagePath },
    });
    await cloudinary.uploader.destroy(imagePath);

    res.send({ status: true });
  } catch (error) {
    console.error("Error deleting image:", error);
  }
};
const unlistProduct = async (req, res) => {
  try {
    const id = req.params.id;
    const list = await Product.findByIdAndUpdate(id, { isActive: false });
    res.redirect("/admin/products");
  } catch (error) {
    console.error(error);
  }
};
const listProduct = async (req, res) => {
  try {
    const id = req.params.id;
    const list = await Product.findByIdAndUpdate(id, { isActive: true });
    res.redirect("/admin/products");
  } catch (error) {
    console.error(error);
  }
};
const loadEditProduct = async (req, res) => {
  try {
    const id = req.query.id;
    const product = await Product.findOne({ _id: id });
    const Brands = await Brand.find({ status: true });
    const Categories = await Category.find({ status: true });

    res.render("editProduct", {
      product,
      Brands,
      Categories,
      right_message: req.flash("right_message"),
      err_message: req.flash("err_message"),
    });
  } catch (error) {
    console.error(error);
  }
};

module.exports = {
  loadProducts,
  loadAddProduct,
  addProduct,
  editProduct,
  removeProduct,
  unlistProduct,
  listProduct,
  loadEditProduct,
};
