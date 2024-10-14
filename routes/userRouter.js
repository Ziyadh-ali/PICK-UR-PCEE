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
uRouter.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));
uRouter.get("/google/callback", passport.authenticate("google", { failureRedirect: "/register"}),(req,res)=>{
    req.session.userLogin = true;
    res.redirect("/")
})
uRouter.get("/pcs", userControllers.loadPcs);
uRouter.get("/components", userControllers.loadComponents);
uRouter.get("/peripherals", userControllers.loadPeripherals);
uRouter.get("/product_details/:id",userControllers.productDetails)
uRouter.get("/logout",userControllers.logout)


module.exports = uRouter
