const express = require("express");
const uRouter = express();
const path = require("path");
const session = require("express-session");
const nocache = require("nocache");
const userControllers = require("../controllers/userControllers");
const flash = require("connect-flash");
const passport = require("passport");
const passportAuth = require("../config/passport")
const auth = require("../middleware/userAuth");
const User = require("../model/userModel");
const paymentController = require("../controllers/paymentController");
const { payWithRazorpay, verifyRazorpayPayment, paymentFailedHandler, payWithRazorpayExistingOrder, verifyRazorpayExistingOrderPayment } = require("../controllers/razorpayController");

uRouter.use(nocache());
uRouter.set("views", path.join(__dirname, "../views/user"));
uRouter.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    cookie : {secure:false}
}));
uRouter.use(flash());
uRouter.use(function(req, res, next){
    res.locals.success_message = req.flash("success_message");
    res.locals.error_message = req.flash("error_message");

    next();
});

uRouter.use(passportAuth.initialize());
uRouter.use(passportAuth.session());

uRouter.get("/", userControllers.userHome);
uRouter.get("/login",auth.isLogout, userControllers.loginPage);
uRouter.post("/login",auth.isLogout, userControllers.verifyLogin);
uRouter.get("/register",auth.isLogout, userControllers.signupPage);
uRouter.get("/otp",auth.isLogout, userControllers.loadOtp);
uRouter.post("/otp",auth.isLogout, userControllers.verifyOtp);
uRouter.post("/resendOtp",auth.isLogout, userControllers.resendOtp);
uRouter.post("/register",auth.isLogout, userControllers.userInsert);
uRouter.get("/resetPassword",auth.isLogout, userControllers.loadResetPassword);
uRouter.post("/resetPassword",auth.isLogout, userControllers.resetPassword);
uRouter.get("/forgotPassword",auth.isLogout, userControllers.loadForgotPass)
uRouter.post("/forgotPassword",auth.isLogout,userControllers.forgetPassword);
uRouter.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));
uRouter.get("/google/callback", passport.authenticate("google", { failureRedirect: "/register"}),async (req,res)=>{
    const userCheck = await User.findOne({email:req.user.email});
    if(!userCheck.isBlocked){
        req.session.userLogin = req.user.id;
        res.redirect("/");
    }else{
        req.logOut(()=>{
            req.flash("error_message","You have been blocked by the admin");
            res.redirect("/login")
        })
    }
})
uRouter.get("/shop", userControllers.loadShop);
uRouter.get('/shop_data', userControllers.getSortFilterSearchData)
uRouter.get("/product_details/:id",userControllers.productDetails);

//cart routes
uRouter.get("/cart", auth.isLogin,userControllers.loadCart);
uRouter.post("/cart", userControllers.addToCart);
uRouter.delete("/cartRemove/:id",auth.isLogin, userControllers.deleteCart);
uRouter.post("/cart/updateQuantity",auth.isLogin, userControllers.updateQuantity);

//wishlist routes
uRouter.get("/wishlist", auth.isLogin,userControllers.loadWishlist);
uRouter.post("/wishlist", userControllers.addWishlist);
uRouter.delete("/wishlistRemove/:id",auth.isLogin, userControllers.deleteWishlist);

//Account 
uRouter.get("/account", auth.isLogin,userControllers.loadAccount);
uRouter.patch("/updateAcc", auth.isLogin,userControllers.accUpdate);
uRouter.post("/addAddress",auth.isLogin,userControllers.addAddress);
uRouter.delete("/addressDelete",auth.isLogin,userControllers.deleteAddress);
uRouter.patch("/editAddress/:name",auth.isLogin,userControllers.editAddress);
uRouter.get("/editAddress/:name", auth.isLogin,userControllers.loadEditAdd);

// checkout
uRouter.get("/checkout", auth.isLogin,userControllers.loadCheckout);
uRouter.post("/checkout/placeOrder", auth.isLogin,userControllers.placeOrder);
uRouter.post("/checkout/payWithWallet", auth.isLogin,userControllers.placeOrderWithWallet);
uRouter.post("/checkout/payWithRazorpay", auth.isLogin,payWithRazorpay);
uRouter.post("/checkout/paymentFailed", auth.isLogin,paymentFailedHandler);
uRouter.post("/checkout/verifyRazorpayPayment", auth.isLogin,verifyRazorpayPayment);
uRouter.post("/applyCoupon", auth.isLogin,userControllers.verifyCoupon);
uRouter.post("/removeCoupon", auth.isLogin,userControllers.removeCoupon);

uRouter.get("/orderSuccess", auth.isLogin,userControllers.loadOrderSuccces);
uRouter.get("/order/orderDetails/:id", auth.isLogin,userControllers.loadOrderDetails);
uRouter.post("/cancelOrder/:id", auth.isLogin,userControllers.cancelOrder);
uRouter.post("/returnOrder", auth.isLogin,userControllers.returnOrder);
uRouter.post("/order/payWithRazorpay", auth.isLogin,payWithRazorpayExistingOrder);
uRouter.post("/order/verifyRazorpayPayment", auth.isLogin,verifyRazorpayExistingOrderPayment);
//invoice
uRouter.get("/download-invoice/:orderId", auth.isLogin,userControllers.invoiceDownload)








uRouter.get("/logout",userControllers.logout)


module.exports = uRouter
