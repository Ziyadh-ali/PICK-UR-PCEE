const express = require("express");
const uRouter = express();
const path = require("path");
const session = require("express-session");
const nocache = require("nocache");
const userControllers = require("../controllers/userController");
const flash = require("connect-flash");
const passport = require("passport");
const passportAuth = require("../config/passport");
const auth = require("../middleware/userAuth");
const User = require("../model/userModel");
const {
  payWithRazorpay,
  verifyRazorpayPayment,
  paymentFailedHandler,
  payWithRazorpayExistingOrder,
  verifyRazorpayExistingOrderPayment,
} = require("../controllers/razorpayController");
const {
    loginPage,
    signupPage,
    verifyLogin,
    userInsert,
    loadOtp,
    verifyOtp,
    resendOtp,
    loadForgotPass,
    forgetPassword,
    loadResetPassword,
    resetPassword
} = require("../controllers/userControllers/userAuth");
const {
    userHome,
    loadShop,
    getSortFilterSearchData,
    productDetails,
} = require("../controllers/userControllers/userShop");
const {
    loadAccount,
    accUpdate,
    addAddress,
    deleteAddress,
    editAddress,
    loadEditAdd,
} = require("../controllers/userControllers/userAccount");
const {
    addWishlist,
    deleteWishlist,
    loadWishlist,
} = require("../controllers/userControllers/userWishlist");
const {
    addToCart,
    deleteCart,
    loadCart,
    updateQuantity,
} = require("../controllers/userControllers/userCart");
const {
    cancelOrder,
    loadCheckout,
    loadOrderDetails,
    loadOrderSuccces,
    placeOrder,
    placeOrderWithWallet,
    removeCoupon,
    returnOrder,
    verifyCoupon,
} = require("../controllers/userControllers/userCheckout");
uRouter.use(nocache());
uRouter.set("views", path.join(__dirname, "../views/user"));
uRouter.use(
  session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);
uRouter.use(flash());
uRouter.use(function (req, res, next) {
  res.locals.success_message = req.flash("success_message");
  res.locals.error_message = req.flash("error_message");

  next();
});

uRouter.use(passportAuth.initialize());
uRouter.use(passportAuth.session());

uRouter.get("/", userHome);
uRouter.get("/login", auth.isLogout, loginPage);
uRouter.post("/login", auth.isLogout, verifyLogin);
uRouter.get("/register", auth.isLogout, signupPage);
uRouter.get("/otp", auth.isLogout, loadOtp);
uRouter.post("/otp", auth.isLogout, verifyOtp);
uRouter.post("/resendOtp", auth.isLogout, resendOtp);
uRouter.post("/register", auth.isLogout, userInsert);
uRouter.get("/resetPassword", auth.isLogout, loadResetPassword);
uRouter.post("/resetPassword", auth.isLogout, resetPassword);
uRouter.get("/forgotPassword", auth.isLogout, loadForgotPass);
uRouter.post("/forgotPassword", auth.isLogout, forgetPassword);
uRouter.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);
uRouter.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/register" }),
  async (req, res) => {
    const userCheck = await User.findOne({ email: req.user.email });
    if (!userCheck.isBlocked) {
      req.session.userLogin = req.user.id;
      res.redirect("/");
    } else {
      req.logOut(() => {
        req.flash("error_message", "You have been blocked by the admin");
        res.redirect("/login");
      });
    }
  }
);


uRouter.get("/shop", loadShop);
uRouter.get("/shop_data", getSortFilterSearchData);
uRouter.get("/product_details/:id", productDetails);

//cart routes
uRouter.get("/cart", auth.isLogin, loadCart);
uRouter.post("/cart", addToCart);
uRouter.delete("/cartRemove/:id", auth.isLogin, deleteCart);
uRouter.patch(
  "/cart/updateQuantity",
  auth.isLogin,
  updateQuantity
);

//wishlist routes
uRouter.get("/wishlist", auth.isLogin, loadWishlist);
uRouter.post("/wishlist", auth.isLogin ,addWishlist);
uRouter.delete(
  "/wishlistRemove/:id",
  auth.isLogin,
  deleteWishlist
);

//Account
uRouter.get("/account", auth.isLogin, loadAccount);
uRouter.patch("/account", auth.isLogin, accUpdate);
uRouter.post("/address", auth.isLogin, addAddress);
uRouter.delete("/address", auth.isLogin, deleteAddress);
uRouter.patch("/address/:name", auth.isLogin, editAddress);
uRouter.get("/address/:name", auth.isLogin, loadEditAdd);

// checkout
uRouter.get("/checkout", auth.isLogin, loadCheckout);
uRouter.post("/checkout/placeOrder", auth.isLogin, placeOrder);
uRouter.post(
  "/checkout/payWithWallet",
  auth.isLogin,
  placeOrderWithWallet
);
uRouter.post("/checkout/payWithRazorpay", auth.isLogin, payWithRazorpay);
uRouter.post("/checkout/paymentFailed", auth.isLogin, paymentFailedHandler);
uRouter.post(
  "/checkout/verifyRazorpayPayment",
  auth.isLogin,
  verifyRazorpayPayment
);
uRouter.patch("/applyCoupon", auth.isLogin, verifyCoupon);
uRouter.post("/removeCoupon", auth.isLogin, removeCoupon);

uRouter.get("/orderSuccess", auth.isLogin, loadOrderSuccces);
uRouter.get(
  "/order/orderDetails/:id",
  auth.isLogin,
  loadOrderDetails
);
uRouter.patch("/cancelOrder/:id", auth.isLogin, cancelOrder);
uRouter.patch("/returnOrder", auth.isLogin, returnOrder);
uRouter.post(
  "/order/payWithRazorpay",
  auth.isLogin,
  payWithRazorpayExistingOrder
);
uRouter.post(
  "/order/verifyRazorpayPayment",
  auth.isLogin,
  verifyRazorpayExistingOrderPayment
);
//invoice
uRouter.get(
  "/download-invoice/:orderId",
  auth.isLogin,
  userControllers.invoiceDownload
);

uRouter.get("/logout", userControllers.logout);

module.exports = uRouter;
