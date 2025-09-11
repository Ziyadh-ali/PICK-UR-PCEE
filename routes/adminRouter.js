const express = require("express");
const aRouter = express();
const path = require("path");
const session = require("express-session");
const nocache = require("nocache");
const adminController = require("../controllers/adminController");
const {
    adminLogin,
    verifyAdmin
} = require("../controllers/adminControllers/adminLogin");
const {
    addProduct,
    editProduct,
    removeProduct,
    loadAddProduct,
    loadEditProduct,
    listProduct,
    unlistProduct,
    loadProducts,
} = require("../controllers/adminControllers/adminProduct");
const {
    addCategory,
    loadCategory,
    listCategory,
    unlistCategory,
    loadEditCategory,
    editCategory,
} = require("../controllers/adminControllers/adminCategory");
const {
    addBrands,
    loadBrands,
    listBrand,
    unlistBrand,
    loadEditBrands,
    editBrand
} = require("../controllers/adminControllers/adminBrand");
const {
    blockUser,
    loadUserList,
    unBlockUser,
} = require("../controllers/adminControllers/adminUser");
const {
    orderList,
    orderDetails,
    statusChange,
} = require("../controllers/adminControllers/adminOrder");
const {
    addCoupons,
    loadCoupon,
    couponRemove,
} = require("../controllers/adminControllers/adminCoupon");
const {
    addOffer,
    loadOffer,
    offerRemove,
} = require("../controllers/adminControllers/adminOffer");
const flash = require("connect-flash");
const storage = require("../middleware/upload");
const multer = require("multer");
const uploads = multer({ storage: storage });
const excelJS = require("exceljs");
const auth = require("../middleware/adminAuth");

aRouter.use(nocache());
aRouter.set("views", path.join(__dirname, "../views/admin"));
aRouter.use(session({
    secret: "session",
    resave: false,
    saveUninitialized: true
}));

aRouter.use(flash());
aRouter.use(function (req, res, next) {
    res.locals.right_message = req.flash("right_message");
    res.locals.err_message = req.flash("err_message");
    next();
});


aRouter.get("/", auth.isLogout, adminLogin);
aRouter.post("/", auth.isLogout, verifyAdmin);

// Home Route
aRouter.get("/dashboard", auth.isLogin, adminController.loadDashboard);
//Product Routes
aRouter.get("/products", auth.isLogin, loadProducts);
aRouter.get("/addProduct", auth.isLogin, loadAddProduct);
aRouter.post("/addProduct", auth.isLogin, uploads.array('images', 4), addProduct);
aRouter.get("/products/unlist/:id", auth.isLogin, unlistProduct);
aRouter.get("/products/list/:id", auth.isLogin, listProduct);
aRouter.get("/products/edit", auth.isLogin, loadEditProduct);
aRouter.post("/products/edit/:id", auth.isLogin, uploads.array("images", 4), editProduct);
aRouter.post("/products/deleteImage", auth.isLogin, removeProduct)
// Category Routes
aRouter.get("/categories", auth.isLogin, loadCategory);
aRouter.post("/categories", auth.isLogin, addCategory);
aRouter.get("/categories/unlist/:id", auth.isLogin, unlistCategory);
aRouter.get("/categories/list/:id", auth.isLogin, listCategory);
aRouter.get("/categories/edit/:id", auth.isLogin, loadEditCategory);
aRouter.post("/categories/edit/:id", auth.isLogin, editCategory);
// Brand Routes
aRouter.get("/brands", auth.isLogin, loadBrands);
aRouter.post("/brands", auth.isLogin, addBrands);
aRouter.get("/brands/unlist/:id", auth.isLogin, unlistBrand);
aRouter.get("/brands/list/:id", auth.isLogin, listBrand);
aRouter.get("/brands/edit/:id", auth.isLogin, loadEditBrands);
aRouter.post("/brands/edit/:id", auth.isLogin, editBrand);
// User List Routes
aRouter.get("/userList", auth.isLogin, loadUserList);
aRouter.get("/user/block/:id", auth.isLogin, blockUser);
aRouter.get("/user/unblock/:id", auth.isLogin, unBlockUser);
// Order 
aRouter.get("/orderlist", auth.isLogin, orderList);
aRouter.get("/orderDetails/:id", auth.isLogin, orderDetails);
aRouter.patch("/orderStatus", auth.isLogin, statusChange);
// Coupon 
aRouter.get("/coupons", auth.isLogin, loadCoupon);
aRouter.post("/coupons", auth.isLogin, addCoupons);
aRouter.delete("/couponRemove/:id", auth.isLogin, couponRemove);
//offer 
aRouter.get("/offers", auth.isLogin, loadOffer);
aRouter.post("/offers", auth.isLogin, addOffer);
aRouter.patch("/offerRemove/:id", auth.isLogin, offerRemove);
//sales report 
aRouter.get("/salesReport", auth.isLogin, adminController.loadSalesReport);
aRouter.post("/generateReport", auth.isLogin, adminController.generateRreport);
aRouter.post("/excelDownload", auth.isLogin, adminController.downloadExcel);
//chart
aRouter.get("/sales-data", auth.isLogin, adminController.saleChart);
aRouter.get("/top-selling-products", auth.isLogin, adminController.topProducts);
aRouter.get("/top-brands", auth.isLogin, adminController.topBrands);
aRouter.get("/top-categories", auth.isLogin, adminController.topCategories);

aRouter.get("/logout", auth.isLogin, adminController.logout);














module.exports = aRouter
