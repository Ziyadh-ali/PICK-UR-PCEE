const Category = require("../model/categoryModel");
const Brand = require("../model/brandsModel");
const User = require("../model/userModel");
const Product = require("../model/productModel");
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const bcrypt = require("bcrypt");


const adminLogin = async (req, res) => {
    try {
        res.render("adminLogin");
    } catch (error) {
        console.log(error);
    }
}
const verifyAdmin = async (req, res) => {
    try {
        const adminCheck = await User.findOne({ email: req.body.email });
        if(adminCheck){
            if(adminCheck.isAdmin ===  true){
                const passwordMatch = await bcrypt.compare(req.body.password, adminCheck.password);
            if (
                adminCheck.email === req.body.email &&
                passwordMatch === true
            ) {
                req.session.adminLogin = true;
                return res.status(200).json({
                    success:true
                });
            } else {
                return res.status(200).json({
                    success:false,
                    message:"Invalid Email or Password"
                });
            }
            }else{
                return res.status(200).json({
                    success:false,
                    message:"You are not an admin"
                });
            }
        }else{
            return res.status(200).json({
                success:false,
                message:"No user found"
            });
        }
    } catch (error) {
        console.log(error);
    }
}
const loadDashboard = async (req, res) => {
    try {
        res.render("dashboard");
    } catch (error) {
        console.log(error);
    }
}

//Product Controllers

const loadProducts = async (req, res) => {
    try {
        const Categories = await Category.find({status:true});
        const Brands = await Brand.find({status:true});
        const Products = await Product.find({});
        res.render("products",({
            Categories,
            Brands,
            Products
        }));
    } catch (error) {
        console.log(error);
    }
}
const loadAddProduct = async (req, res) => {
    try {
        const Brands = await Brand.find({status : true})
        const Categories = await Category.find({status : true});
        res.render("addProduct", ({ Categories , Brands }));
    } catch (error) {
        console.log(error);
    }
}
const addProduct = async (req, res) => {

    try {
        const { productName, productDescription, productSpecification, brand, stock, mrp, price, category } = req.body;
        const productExists = await Product.findOne({
            name:{ $regex: new RegExp(productName, "i") }
        });

        if(!productExists){
            const images = [];

            if(req.files && req.files.length>0){
                for(let i=0;i<req.files.length;i++){
                    const originalImagePath = req.files[i].path;

                    const resizedImagePath = path.join('public','uploads','product-images',req.files[i].filename);
                    await sharp(originalImagePath).resize({width:450,height:440}).toFile(resizedImagePath);
                    images.push(req.files[i].filename);
                }
            }
            
            const newProduct = new Product ({
                name: productName,
                description: productDescription,
                specification: productSpecification,
                brands: brand,
                category: category,
                stock: stock,
                price: mrp,
                offerPrice: price,
                image: images, 
            });
            await newProduct.save();
            req.flash("right_message", "Product Added Successfully");
            res.redirect("/admin/addProduct");
        }else{
            req.flash("err_message", "Failed to Add Product - Product Already Exists");
            res.redirect("/admin/addProduct");
        }
    } catch (error) {
        console.error(error);
    }
};
const editProduct = async (req, res) => {
    try {
        const id = req.params.id;
        const product = await Product.findOne({_id:id});
        const data = req.body;
        const existingProduct = await Product.findOne({
            productName:data.productName,
            _id:{$ne:id}
        });
        if(existingProduct){
            return res.status(400).json({error:"Product with this name already exists"})
        }
        const images = [];
        if(req.files && req.files.length >0){
            for(let i=0;i<req.files.length;i++){
                images.push(req.files[i].filename);
            }
        }

        const updateFields = {
            productName : data.productName,
            description : data.description,
            brand : data.brand,
            category : data.category,
            stock : data.stock,
            price : data.mrp,
            offerPrice : data.price,
        }
        if(req.files.length>0){
            updateFields.$push = {image: {$each:images}};
        }

        await Product.findByIdAndUpdate(id,updateFields,{new:true});
        res.redirect("/admin/products");
    } catch (error) {
        
    }
};

const removeProduct = async (req, res) => {
    try {
      const {imageNameToServer,productIdToServer} = req.body;
      const product = await Product.findByIdAndUpdate(productIdToServer,{$pull:{image : imageNameToServer}});
      const imagePath = path.join("public","uploads","re-image",imageNameToServer);
      if(fs.existsSync(imagePath)){
        await fs.unlinkSync(imagePath);
        console.log(`Image ${imageNameToServer} deleted succesfully`);
      }else{
        console.log(`Image ${imageNameToServer} not found`);
      }
      res.send({status : true});
    } catch (error) {
      console.error('Error deleting image:', error);
    }
  };
const unlistProduct = async (req, res) => {
    try {
        const id = req.params.id;
        const list = await Product.findByIdAndUpdate(id, { isActive : false });
        res.redirect("/admin/products");
    } catch (error) {
        console.log(error);
    }
}
const listProduct = async (req, res) => {
    try {
        const id = req.params.id;
        const list = await Product.findByIdAndUpdate(id, { isActive : true });
        res.redirect("/admin/products");
    } catch (error) {
        console.log(error);
    }
}
const loadEditProduct = async (req, res) => {
    try {
        const id = req.query.id;
        const product = await Product.findOne({_id:id});
        const Brands = await Brand.find({status : true}); 
        const Categories = await Category.find({status : true}); 
    
        res.render('editProduct', { product, Brands,Categories, right_message: req.flash('right_message'), err_message: req.flash('err_message') });
    } catch (error) {
        console.log(error);
    }
}

// Category Controllers

const addCategory = async (req, res) => {
    try {
        const { name, description } = req.body;
        const isCategoryExists = await Category.findOne({ name: req.body.name.trim() });

        if (!isCategoryExists) {
            const category = new Category({
                name: name,
                description: description
            });
            await category.save();
            req.flash("right_message", "Category added successfully!");
            res.redirect("/admin/categories");
        } else {
            req.flash("err_message", "Category already exists");
            res.redirect("/admin/categories");
        }
    } catch (error) {
        console.log(error);
        req.flash("err_message", "An error occurred while adding the category");
        res.redirect("/admin/categories");
    }
};
const loadCategory = async (req, res) => {
    try {
        const Categories = await Category.find({});
        res.render("categories", ({ Categories }));
    } catch (error) {
        console.log(error);
    }
}
const listCategory = async (req, res) => {
    try {
        const id = req.params.id;
        const list = await Category.findByIdAndUpdate(id, { status: true });
        res.redirect("/admin/categories");
    } catch (error) {
        console.log(error);
    }
}
const unlistCategory = async (req, res) => {
    try {
        const id = req.params.id;
        const list = await Category.findByIdAndUpdate(id, { status: false });
        res.redirect("/admin/categories");
    } catch (error) {
        console.log(error);
    }
}
const loadEditCategory = async (req, res) => {
    try {
        const id = req.params.id;
        const Categories = await Category.findById(id);
        res.render("editCategories", ({ Categories }));
    } catch (error) {
        console.log(error);
    }
}
const editCategory = async (req, res) => {
    try {
        const id = req.params.id;
        const Categories = await Category.findById(id);
        let nameChanged = false;
        let descriptionChanged = false;
        if (req.body.name !== Categories.name) {
            nameChanged = true
        }
        if (req.body.description !== Categories.description) {
            descriptionChanged = true
        }
        
        if (nameChanged) {
            const nameExists = await Category.findOne({ name: req.body.name });
            if (nameExists) {
                req.flash("err_message", "Category already exists");
                res.redirect(`/admin/categories/edit/${req.params.id}`);
            }
        }
        if (nameChanged || descriptionChanged) {
            const edit = await Category.findByIdAndUpdate(id, { name: req.body.name , description:req.body.description});
            req.flash("right_message", "Edit successfull");
            res.redirect("/admin/categories");
        } else {
            res.redirect("/admin/categories");
        }

    } catch (error) {
        console.log(error);
    }
}

// Brands Controllers

const loadBrands = async (req, res) => {
    try {
        const Brands = await Brand.find({});
        res.render("brands",({Brands}));
    } catch (error) {
        console.log(error);
    }
}
const addBrands = async (req, res) => {
    try {
        const { name, description } = req.body;
        const isBrandExists = await Brand.findOne({ name: req.body.name.trim() });

        if (!isBrandExists) {
            const brand = new Brand({
                name: name,
                description: description
            });
            await brand.save();
            req.flash("right_message", "Brand added successfully!");
            res.redirect("/admin/brands");
        } else {
            req.flash("err_message", "Brand already exists");
            res.redirect("/admin/brands");
        }
    } catch (error) {
        console.log(error);
    }
}
const unlistBrand = async (req, res) => {
    try {
        const id = req.params.id;
        const list = await Brand.findByIdAndUpdate(id, { status: false });
        res.redirect("/admin/brands");
    } catch (error) {
        console.log(error);
    }
}
const listBrand = async (req, res) => {
    try {
        const id = req.params.id;
        const list = await Brand.findByIdAndUpdate(id, { status: true });
        res.redirect("/admin/brands");
    } catch (error) {
        console.log(error);
    }
}
const loadEditBrands = async (req, res) => {
    try {
        const id = req.params.id;
        const Brands = await Brand.findById(id);
        res.render("editBrands", ({ Brands }));
    } catch (error) {
        console.log(error);
    }
}
const editBrand = async (req, res) => {
    try {
        const id = req.params.id;
        const Brands = await Brand.findById(id);
        let nameChanged = false;
        let descriptionChanged = false;
        if (req.body.name !== Brands.name) {
            nameChanged = true
        }
        if (req.body.description !== Brands.description) {
            descriptionChanged = true
        }
        
        if (nameChanged) {
            const nameExists = await Brand.findOne({ name: req.body.name });
            if (nameExists) {
                req.flash("err_message", "Brand already exists");
                res.redirect(`/admin/brands/edit/${req.params.id}`);
            }
        }
        if (nameChanged || descriptionChanged) {
            const edit = await Brand.findByIdAndUpdate(id, { name: req.body.name , description:req.body.description});
            req.flash("right_message", "Edit successfull");
            res.redirect("/admin/brands");
        } else {
            res.redirect("/admin/brands");
        }

    } catch (error) {
        console.log(error);
    }
}

// User list Controllers

const loadUserList = async (req, res) => {
    try {
        const users = await User.find({});
        res.render("user", ({ users }));
    } catch (error) {
        console.log(error);
    }
}
const unBlockUser = async (req, res) => {
    try {
        const id = req.params.id;
        const list = await User.findByIdAndUpdate(id, { isBlocked: false });
        res.redirect("/admin/userList");
    } catch (error) {
        console.log(error);
    }
}
const blockUser = async (req, res) => {
    try {
        const id = req.params.id;
        const list = await User.findByIdAndUpdate(id, { isBlocked: true });
        res.redirect("/admin/userList");
    } catch (error) {
        console.log(error);
    }
}

const logout = async (req,res)=>{
    try {
        req.session.adminLogin = null
        res.redirect("/admin");
    } catch (error) {
        consoel.error(error);
    }
}


module.exports = {
    adminLogin,
    verifyAdmin,
    loadDashboard,
    loadCategory,
    loadProducts,
    loadBrands,
    loadAddProduct,
    addCategory,
    listCategory,
    unlistCategory,
    loadEditCategory,
    editCategory,
    loadUserList,
    unBlockUser,
    blockUser,
    addBrands,
    listBrand,
    unlistBrand,
    loadEditBrands,
    editBrand,
    addProduct,
    unlistProduct,
    listProduct,
    loadEditProduct,
    editProduct,
    removeProduct,
    logout
}