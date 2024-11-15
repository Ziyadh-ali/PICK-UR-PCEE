const Category = require("../model/categoryModel");
const Brand = require("../model/brandsModel");
const User = require("../model/userModel");
const Product = require("../model/productModel");
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const excelJS = require("exceljs");
const bcrypt = require("bcrypt");
const Order = require("../model/orderModel");
const Coupon = require("../model/couponModel");
const Offer = require("../model/offerModel");
const { returnOrder } = require("./userControllers");
const cloudinary = require('cloudinary').v2;
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_KEY,
    api_secret: process.env.CLOUD_SECRET,
  });


const adminLogin = async (req, res) => {
    try {
        res.render("adminLogin");
    } catch (error) {
        console.error(error);
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
        console.error(error);
    }
}
const loadDashboard = async (req, res) => {
    try {
        const order = await Order.find({orderStatus : "Delivered"})
        const totalOrders = order.length
        const totalRevenue = order.reduce((acc,curr)=>{
            return acc += curr.totalPrice
        },0)
        res.render("dashboard",{
            totalOrders,
            totalRevenue
        });
    } catch (error) {
        console.error(error);
    }
}



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
        console.error(error);
    }
}
const loadAddProduct = async (req, res) => {
    try {
        const Brands = await Brand.find({status : true})
        const Categories = await Category.find({status : true});
        res.render("addProduct", ({ Categories , Brands }));
    } catch (error) {
        console.error(error);
    }
}
const addProduct = async (req, res) => {

    try {
        const { productName, productDescription, productSpecification, brand, stock,  price, category } = req.body;
        const productExists = await Product.findOne({
            name:{ $regex: new RegExp(productName, "i") }
        });

        if(!productExists){
            const images = [];
            if(req.files && req.files.length>0){
                for(let i=0;i<req.files.length;i++){
                   
                    images.push(req.files[i].path);
                }
            }
            
            const newProduct = new Product ({
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
        const data = req.body
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
                images.push(req.files[i].path);
            }
        }

        const updateFields = {
            name : data.productName,
            description : data.productDescription,
            specification : data.productSpecification,
            brands : data.brand,
            category : data.category,
            stock : data.stock,
            price : data.price,
        }
        if(req.files.length>0){
            updateFields.$push = {image: {$each:images}};
        }
        const productSave = await Product.findByIdAndUpdate(id,updateFields);
        if(productSave){
            res.redirect("/admin/products");
        }
        
    } catch (error) {
        
    }
};

const removeProduct = async (req, res) => {
    try {
      const {imageNameToServer,productIdToServer} = req.body;
      const imagePath = imageNameToServer
      const product = await Product.findByIdAndUpdate(productIdToServer,{$pull:{image : imagePath}});
      await cloudinary.uploader.destroy(imagePath)

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
        console.error(error);
    }
}
const listProduct = async (req, res) => {
    try {
        const id = req.params.id;
        const list = await Product.findByIdAndUpdate(id, { isActive : true });
        res.redirect("/admin/products");
    } catch (error) {
        console.error(error);
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
        console.error(error);
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
        console.error(error);
        req.flash("err_message", "An error occurred while adding the category");
        res.redirect("/admin/categories");
    }
};
const loadCategory = async (req, res) => {
    try {
        const Categories = await Category.find({});
        res.render("categories", ({ Categories }));
    } catch (error) {
        console.error(error);
    }
}
const listCategory = async (req, res) => {
    try {
        const id = req.params.id;
        const list = await Category.findByIdAndUpdate(id, { status: true });
        res.redirect("/admin/categories");
    } catch (error) {
        console.error(error);
    }
}
const unlistCategory = async (req, res) => {
    try {
        const id = req.params.id;
        const list = await Category.findByIdAndUpdate(id, { status: false });
        res.redirect("/admin/categories");
    } catch (error) {
        console.error(error);
    }
}
const loadEditCategory = async (req, res) => {
    try {
        const id = req.params.id;
        const Categories = await Category.findById(id);
        res.render("editCategories", ({ Categories }));
    } catch (error) {
        console.error(error);
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
        let nameExists
        if (nameChanged) {
            nameExists = await Category.findOne({ name: req.body.name });
            if (nameExists) {
                return (req.flash("err_message", "Category already exists") ,res.redirect(`/admin/categories/edit/${req.params.id}`))
        }   
                
        }
        if ((nameChanged || descriptionChanged )) { 
            const edit = await Category.findByIdAndUpdate(id, { name: req.body.name , description:req.body.description});
            req.flash("right_message", "Edit successfull");
            res.redirect("/admin/categories");
        } else {
            res.redirect("/admin/categories");
        }

    } catch (error) {
        console.error(error);
    }
}

// Brands Controllers

const loadBrands = async (req, res) => {
    try {
        const Brands = await Brand.find({});
        res.render("brands",({Brands}));
    } catch (error) {
        console.error(error);
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
        console.error(error);
    }
}
const unlistBrand = async (req, res) => {
    try {
        const id = req.params.id;
        const list = await Brand.findByIdAndUpdate(id, { status: false });
        res.redirect("/admin/brands");
    } catch (error) {
        console.error(error);
    }
}
const listBrand = async (req, res) => {
    try {
        const id = req.params.id;
        const list = await Brand.findByIdAndUpdate(id, { status: true });
        res.redirect("/admin/brands");
    } catch (error) {
        console.error(error);
    }
}
const loadEditBrands = async (req, res) => {
    try {
        const id = req.params.id;
        const Brands = await Brand.findById(id);
        res.render("editBrands", ({ Brands }));
    } catch (error) {
        console.error(error);
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
        console.error(error);
    }
}

// User list Controllers

const loadUserList = async (req, res) => {
    try {
        const users = await User.find({});
        res.render("user", ({ users }));
    } catch (error) {
        console.error(error);
    }
}
const unBlockUser = async (req, res) => {
    try {
        const id = req.params.id;
        const list = await User.findByIdAndUpdate(id, { isBlocked: false });
        res.redirect("/admin/userList");
    } catch (error) {
        console.error(error);
    }
}
const blockUser = async (req, res) => {
    try {
        const id = req.params.id;
        const list = await User.findByIdAndUpdate(id, { isBlocked: true });
        res.redirect("/admin/userList");
    } catch (error) {
        console.error(error);
    }
}
const orderList = async (req, res) => {
    try {
        
        const search = req.query.search || '';
        const page = parseInt(req.query.page) || 1;
        const limit = 5; 
        const searchQuery = search
            ? {
                $or: [
                    { 'selectedAddress.fullName': { $regex:new RegExp(search, "i") } },
                    { 'orderStatus': { $regex:new RegExp(search, "i")} },
                ],
            }
            : {};

        const totalOrders = await Order.countDocuments(searchQuery);

      
        const orders = await Order.find(searchQuery)
            .populate('products.productId') 
            .populate('userId')
            .sort({ orderedAt: -1 }) 
            .skip((page - 1) * limit)
            .limit(limit);

        
        const totalPages = Math.ceil(totalOrders / limit);
        
        res.render('orderList', {
            orders,
            currentPage: page,
            totalPages,
            search,
        });
    } catch (error) {
        console.error('Error fetching orders:', error);
    }
};



const orderDetails = async (req,res) =>{
    try {
        const {id} = req.params
        const order = await Order.findById(id).populate('products.productId').populate('userId')
        res.render("orderDetails",({
            order
        }))
    } catch (error) {
        console.error(error);
    }
}

const statusChange = async (req,res)=>{
    try {
        const {statusSelected , orderId} = req.body;
        const order = await Order.findById(orderId);
        for (let product of order.products) {
            await Product.updateOne(
                { _id: product.productId._id },
                { $inc: { stock: (product.quantity) } }
            );
        }
        const changeStatus = await Order.findByIdAndUpdate(orderId,
            {$set : {orderStatus : statusSelected}}
        )
        if(changeStatus){
            res.status(200).json({success : true});
        }
        
        
        
    } catch (error) {
        console.error(error)
    }
}
const loadCoupon = async (req,res)=>{
    try {
        const coupons = await Coupon.find();

        res.render("coupons",({
            coupons
        }));
    } catch (error) {
        console.error(error);
    }
}
const addCoupons = async (req,res)=>{
    try {
        const data = req.body
        if(data.couponCode !== data.couponCode.toUpperCase()){
            return res.status(200).json({success : false , message : "Coupon code should be in capital"});
         }
        const coupon = await Coupon.findOne({code : data.couponCode.trim().toString()})
        if(coupon){
           return res.status(200).json({success : false , message : "coupon already exists"});
        }
        const newCoupon = new Coupon({
            code : data.couponCode,
            discountType : data.discountType,
            discountValue : data.discountValue,
            minPurchaseValue : data.minSpend,
            maxPurchaseValue : data.maxDiscount,
            expiryDate : data.expiryDate,
            usageLimit : data.usageLimit,
        })
        const save = await newCoupon.save();
        if(save){
            res.status(200).json({success : true});
        }else{
            res.status(200).json({success : false, message : "Coupon not added"});
        }
        
    } catch (error) {
        console.error(error);
    }
}
const couponRemove = async (req,res)=>{
    try {
        const {id} = req.params;
        const remove = await Coupon.findByIdAndDelete(id);
        if(remove){
            res.status(200).json({success : true});
        }else{
            res.status(200).json({success : false});
        }
    } catch (error) {
        console.error(error)
    }
}
//offer
const loadOffer = async (req,res)=>{
    try {
        const offers = await Offer.find().populate('brands').populate('categories')
        const Brands = await Brand.find({status : true});
        const Categories = await Category.find({status : true})
        res.render("offers",({
            offers,
            Brands,
            Categories,
        }));
    } catch (error) {
        console.error(error);
    }
}
const addOffer = async (req,res)=>{
    try {
        const data = req.body
        const offer = new Offer({
            offerName : data.offerName,
            discountType : data.discountType,
            discountValue : data.discountValue,
            minPurchaseValue : data.minSpend,
            maxPurchaseValue : data.maxDiscount,
            expiryDate : data.expiryDate,
            brands : data.brand ? data.brand : null,
            categories : data.category ? data.category : null,
        })

        const save = await offer.save();
        if(save){
            let query = {}
            if(data.brand && data.category ){
                query = {brands : data.brand , categories : data.category}
            }else if (data.brand){
                query = {brands : data.brand}
            }else if (data.category){
                query = {category : data.category}
            }
            const products = await Product.find(query);
            const currentDate = new Date();
            for(let product of products){
                let skipUpdate = false;
                if(product.offerId){
                    const existingOffer = await Offer.findById(product.offerId);
                    if(existingOffer){
                        const timeDifference = (new Date(existingOffer.expiryDate)-currentDate) / (1000 * 60 * 60 * 24);
                        
                        if(timeDifference >= 5) {
                            skipUpdate = true
                        }
                    }
                }
                if(!skipUpdate){
                    let newOfferPrice = 0;
                    if(offer.discountType === "percentage"){
                         newOfferPrice = (product.price * offer.discountValue / 100)
                    }else if (offer.discountType === "fixed"){
                        newOfferPrice = offer.discountValue
                    }

                    product.offerPrice = newOfferPrice
                    product.offerId = offer._id;
                    await product.save();
                }
            }
            res.status(200).json({success : true});
        }else{
            res.status(200).json({success : false});
        }
        
    } catch (error) {
        console.error(error);
    }
}
const offerRemove = async (req,res)=>{
    try {
        const {id} = req.params;
        const productsWithOffer = await Product.find({ offerId: id });
        for(let product of productsWithOffer){
            product.offerId = null
            product.offerPrice = null
            await product.save()
        }
        if(productsWithOffer){
            const remove = await Offer.findByIdAndUpdate(id,{isActive : false});
            res.status(200).json({success : true});
        }else{
            res.status(200).json({success : false});
        }
    } catch (error) {
        console.error(error)
    }
}
// sales report 
const loadSalesReport = async (req,res)=>{
    try {
        const salesReports = await Order.find({orderStatus : "Delivered"}).populate("products.productId")
        const totalOrders = salesReports.length
        const totalRevenue = salesReports.reduce((acc,curr)=>{
            return acc += curr.totalPrice
        },0)
    
        let totalOfferDiscount = 0;
        let totalCouponDiscount = 0
        salesReports.forEach(sale => {
            sale.products.forEach(product => {
                if (product.productId.offerId) {
                    const discount = product.productId.offerPrice * product.quantity;
                    totalOfferDiscount += discount;
                }
            });
            totalCouponDiscount += sale.discountValue
            
        });
        const totalDiscount = totalOfferDiscount+totalCouponDiscount;
        
        res.render("salesReport",({
            sales : salesReports,
            totalOrders,
            totalRevenue,
            totalDiscount,
            totalOfferDiscount,
            totalCouponDiscount,
        }));
    } catch (error) {
        console.error(error);
    }
}

const generateRreport =  async (req, res) => {
    try {
    const { startDate, endDate, reportType } = req.body;

    let start, end ;

    const currentDate = new Date();
    if (reportType === "weekly") {

      const dayOfWeek = currentDate.getDay();
      start = new Date(currentDate);
      start.setDate(currentDate.getDate() - dayOfWeek);
      start.setHours(0, 0, 0, 0);

      end = new Date(currentDate);
      end.setHours(23, 59, 59, 999);
    } else if (reportType === "monthly") {

      start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      end = new Date(currentDate);
      end.setHours(23, 59, 59, 999);
    } else if (reportType === "yearly") {

      start = new Date(currentDate.getFullYear(), 0, 1);
      end = new Date(currentDate);
      end.setHours(23, 59, 59, 999);
    } else if (startDate && endDate) {

      start = new Date(startDate);
      end = new Date(endDate);
      end.setHours(23, 59, 59, 999); 
    } else if (reportType === "all") {
        start = new Date(0);
        end = new Date(currentDate); 
        end.setHours(23, 59, 59, 999);
    } else {
      return res.status(400).json({ error: "Invalid date range or report type." });
    }

      const matchQuery = { orderedAt: { $gte: start, $lte: end },orderStatus : "Delivered" };
      const reportData = await Order.find(matchQuery).populate('products.productId');
      const totalOrders = reportData.length
        const totalRevenue = reportData.reduce((acc,curr)=>{
            return acc += curr.totalPrice
        },0)
    
        let totalOfferDiscount = 0;
        let totalCouponDiscount = 0
        reportData.forEach(data => {
            data.products.forEach(product => {
                if (product.productId.offerId) {
                    const discount = product.productId.offerPrice * product.quantity;
                    totalOfferDiscount += discount;
                }
            });
            totalCouponDiscount += data.discountValue
            
        });
        const totalDiscount = totalOfferDiscount+totalCouponDiscount;
      res.status(200).json({
        data : reportData , 
        totalRevenue,
        totalOrders,
        totalDiscount,
        totalCouponDiscount,
        totalOfferDiscount
     });
    } catch (error) {
      console.error( "Failed to generate report" );
    }
}
const downloadExcel = async (req,res)=>{
    const data = req.body.salesData
    const {totalOrders,totalRevenue,totalDiscount,totalOfferDiscount,totalCouponDiscount} = req.body
    const workbook = new excelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sales Report');

    worksheet.addRow(['Summary']);
    worksheet.addRow(['Total Orders:', totalOrders]);
    worksheet.addRow(['Total Revenue:', `₹${totalRevenue}`]);
    worksheet.addRow(['Total Discounts:', `₹${totalDiscount}`]);
    worksheet.addRow(['Discount through Offer:', `₹${totalOfferDiscount}`]);
    worksheet.addRow(['Discount through Coupon:', `₹${totalCouponDiscount}`]);
    worksheet.addRow([]);

    worksheet.addRow(['Order ID', 'Buyer Name', 'Quantity', 'Total', 'Order Date', 'Status']);
    
    data.forEach(sale => {
        worksheet.addRow([
            sale.id,
            sale.fullName,
            sale.quantity,
            sale.totalPrice,
            sale.orderedAt,
            sale.orderStatus
        ]);
    });
    
    res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
        'Content-Disposition',
        'attachment; filename="SalesReport.xlsx"'
    );

    await workbook.xlsx.write(res);
    res.end();
}
const saleChart = async (req, res) => {
    try {
        const { filter } = req.query;
        let start, end;

        const currentDate = new Date();
        switch (filter) {
            case "weekly":
                const dayOfWeek = currentDate.getDay();
                start = new Date(currentDate);
                start.setDate(currentDate.getDate() - dayOfWeek);
                start.setHours(0, 0, 0, 0);

                end = new Date(currentDate);
                end.setHours(23, 59, 59, 999);
                break;

            case "monthly":
                start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
                end = new Date(currentDate);
                end.setHours(23, 59, 59, 999);
                break;

            case "yearly":
                start = new Date(currentDate.getFullYear(), 0, 1);
                end = new Date(currentDate);
                end.setHours(23, 59, 59, 999);
                break;
        }

        const matchQuery = { orderedAt: { $gte: start, $lte: end }, orderStatus: "Delivered" };
        const reportData = await Order.find(matchQuery);
        const aggregatedData = reportData.reduce((acc, curr) => {
            let label;
            if (filter === "weekly") {
                label = curr.orderedAt.toLocaleString('en-us', { weekday: 'long' });
            } else if (filter === "monthly") {
                label = curr.orderedAt.toLocaleString('en-us', { month: 'long' });
            } else if (filter === "yearly") {
                label = curr.orderedAt.toLocaleString('en-us', { month: 'short', year: 'numeric' });
            }

            const existingLabel = acc.find(item => item.label === label);
            if (existingLabel) {
                existingLabel.total += curr.totalPrice;
            } else {
                acc.push({ label: label, total: curr.totalPrice });
            }
            return acc;
        }, []);

        res.status(200).json(aggregatedData);

    } catch (error) {
        console.error("Error generating sales chart data:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
const topProducts = async (req, res) => {
    try {
        
        const topProducts = await Order.aggregate([
            { $match: { orderStatus: "Delivered" } },
            { $unwind: "$products" },
            { 
                $group: {
                    _id: "$products.productId",
                    totalSold: { $sum: "$products.quantity" }
                }
            },
            { $sort: { totalSold: -1 } },
            { $limit: 10 }
        ]);

        const productIds = topProducts.map(item => item._id);

        const products = await Product.find({ '_id': { $in: productIds } }).select('name _id');

        const populatedProducts = topProducts.map(product => {
            const productData = products.find(p => p._id.toString() === product._id.toString());
            return {
                label: productData ? productData.name : 'Unknown Product',
                total: product.totalSold
            };
        });

        res.status(200).json(populatedProducts);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "An error occurred" });
    }
};
const topCategories = async (req, res) => {
    try {
        const categories = await Order.aggregate([
            {$match : {orderStatus : "Delivered"}},
            { $unwind: "$products" },
            {
                $lookup: {
                    from: "products",
                    localField: "products.productId",
                    foreignField: "_id",
                    as: "productDetails"
                }
            },
            { $unwind: "$productDetails" },
            {
                $group: {
                    _id: "$productDetails.category",
                    total: { $sum: "$products.quantity" }
                }
            },
            {
                $lookup: {
                    from: "categories",
                    localField: "_id",
                    foreignField: "_id",
                    as: "categoryDetails"
                }
            },
            { $unwind: "$categoryDetails" },
            { $sort: { total: -1 } },
            { $limit: 10 }
        ]);

        const formattedCategories = categories.map(cat => ({
            label: cat.categoryDetails.name,
            total: cat.total
        }));

        res.json(formattedCategories);
    } catch (error) {
        console.error("Error fetching top categories:", error);
        res.status(500).json({ error: "Server error" });
    }
};

const topBrands = async (req, res) => {
    try {
        const brands = await Order.aggregate([
            {$match : {orderStatus : "Delivered"}},
            { $unwind: "$products" }, 
            {
                $lookup: {
                    from: "products", 
                    localField: "products.productId",
                    foreignField: "_id",
                    as: "productDetails"
                }
            },
            { $unwind: "$productDetails" }, 
            {
                $group: {
                    _id: "$productDetails.brands",
                    total: { $sum: "$products.quantity" } 
                }
            },
            {
                $lookup: {
                    from: "brands",
                    localField: "_id",
                    foreignField: "_id",
                    as: "brandDetails"
                }
            },
            { $unwind: "$brandDetails" },
            { $sort: { total: -1 } },
            { $limit: 10 }
        ]);

        const formattedBrands = brands.map(brand => ({
            label: brand.brandDetails.name,
            total: brand.total
        }));

        res.json(formattedBrands);
    } catch (error) {
        console.error("Error fetching top brands:", error);
        res.status(500).json({ error: "Server error" });
    }
};


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
    orderList,
    orderDetails,
    statusChange,
    loadCoupon,
    addCoupons,
    couponRemove,
    loadOffer,
    addOffer,
    offerRemove,
    loadSalesReport,
    generateRreport,
    downloadExcel,
    saleChart,
    topProducts,
    topCategories,
    topBrands,
    logout
}