const express = require("express");
const aRouter = express();
const path = require("path");
const session = require("express-session");
const nocache = require("nocache");
const adminController = require("../controllers/adminControllers");
const flash = require("connect-flash");
const storage = require("../middleware/upload");
const multer = require("multer");
const uploads = multer({storage:storage});
const auth = require("../middleware/adminAuth");

aRouter.use(nocache());
aRouter.set("views",path.join(__dirname,"../views/admin"));
aRouter.use(session({
    secret:"session",
    resave:false,
    saveUninitialized:true
}));

aRouter.use(flash());
aRouter.use(function(req, res, next){
    res.locals.right_message = req.flash("right_message");
    res.locals.err_message = req.flash("err_message");
    next();
});


aRouter.get("/",auth.isLogout,adminController.adminLogin);
aRouter.post("/",auth.isLogout,adminController.verifyAdmin);
// Home Route
aRouter.get("/dashboard",auth.isLogin,adminController.loadDashboard);
//Product Routes
aRouter.get("/products",auth.isLogin,adminController.loadProducts);
aRouter.get("/addProduct",auth.isLogin,adminController.loadAddProduct);
aRouter.post("/addProduct", auth.isLogin,uploads.array('images', 4), adminController.addProduct);
aRouter.get("/products/unlist/:id",auth.isLogin,adminController.unlistProduct);
aRouter.get("/products/list/:id",auth.isLogin,adminController.listProduct);
aRouter.get("/products/edit",auth.isLogin,adminController.loadEditProduct);
aRouter.post("/products/edit/:id",auth.isLogin,uploads.array("images",4),adminController.editProduct);
aRouter.post("/products/deleteImage",auth.isLogin,adminController.removeProduct)
// Category Routes
aRouter.get("/categories",auth.isLogin,adminController.loadCategory);
aRouter.post("/categories",auth.isLogin,adminController.addCategory);
aRouter.get("/categories/unlist/:id",auth.isLogin,adminController.unlistCategory);
aRouter.get("/categories/list/:id",auth.isLogin,adminController.listCategory);
aRouter.get("/categories/edit/:id",auth.isLogin,adminController.loadEditCategory);
aRouter.post("/categories/edit/:id",auth.isLogin,adminController.editCategory);
// Brand Routes
aRouter.get("/brands",auth.isLogin,adminController.loadBrands);
aRouter.post("/brands",auth.isLogin,adminController.addBrands);
aRouter.get("/brands/unlist/:id",auth.isLogin,adminController.unlistBrand);
aRouter.get("/brands/list/:id",auth.isLogin,adminController.listBrand);
aRouter.get("/brands/edit/:id",auth.isLogin,adminController.loadEditBrands);
aRouter.post("/brands/edit/:id",auth.isLogin,adminController.editBrand);
// User List Routes
aRouter.get("/userList",auth.isLogin,adminController.loadUserList);
aRouter.get("/user/block/:id",auth.isLogin,adminController.blockUser);
aRouter.get("/user/unblock/:id",auth.isLogin,adminController.unBlockUser);
// Order 
aRouter.get("/orderlist",auth.isLogin,adminController.orderList);
aRouter.get("/orderDetails/:id",auth.isLogin,adminController.orderDetails);
aRouter.patch("/orderStatus",auth.isLogin,adminController.statusChange);
// Coupon 
aRouter.get("/coupons",auth.isLogin,adminController.loadCoupon);
aRouter.post("/coupons",auth.isLogin,adminController.addCoupons);




aRouter.get("/logout",auth.isLogin,adminController.logout);














module.exports = aRouter
