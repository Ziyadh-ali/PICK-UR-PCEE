const User = require("../model/userModel");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const randomstring = require("randomstring");
const Category = require("../model/categoryModel");
const Brand = require("../model/brandsModel");
const Product = require("../model/productModel");

const hashPassword = async (password) => {
    try {
        const pass = await bcrypt.hash(password, 10);
        return pass;
    } catch (err) {
        console.error(err);
    }
}
const landingPage = async (req, res) => {
    try {
        res.render("landing");
    } catch (error) {
        console.error(error);
    }
}
const loginPage = async (req, res) => {
    try {
        res.render("login");
    } catch (error) {
        console.error(error);
    }
}
const signupPage = async (req, res) => {
    try {
        res.render("signup");
    } catch (error) {
        console.error(error);
    }
}
const verifyLogin = async (req, res) => {
    try {
        const userCheck = await User.findOne({ email: req.body.email });
        if (userCheck) {
            if(!userCheck.isBlocked){
                const passwordMatch = await bcrypt.compare(req.body.password, userCheck.password);
            if (
                userCheck.email === req.body.email &&
                passwordMatch === true
            ) {
                req.session.userLogin = userCheck._id;
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
                    message:"Your Blocked by the admin, Please contact the customer care"   
                });
            }
            
        } else {
            return res.status(200).json({
                success:false,
                message:"User not find please register"
            });
        }
    } catch (error) {
        console.error(error);
    }
}


const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
        user: 'pickurpcee@gmail.com',
        pass: 'mkin ooqi woeg vvij'
    }
});
const userInsert = async (req, res) => {
    try {
        const isEmailExists = await User.findOne({ email: req.body.email });
        if (isEmailExists) {
            return res.status(200).json({
                success:false,
                message:"Email already exists"
            });
        } else {
            const hashedPassword = await hashPassword(req.body.password);
            const user = {
                firstName: req.body.firstName,
                lastName: req.body.lastName,
                email: req.body.email,
                mobile: req.body.mobile,
                password: hashedPassword,
                
                isAdmin: false
            };
            req.session.tempUser = user;

            const otp = randomstring.generate({
                length: 6,
                charset: "numeric"
            });
            req.session.otp = otp
            console.log(otp);
            req.session.timeLimit = Date.now() + 120000;
            transporter.sendMail({
                to: req.body.email,
                subject: "otp",
                text: `Otp for verification : ${otp}`
            });
            return res.status(200).json({success:true});
        }

    } catch (error) {
        console.error(error);
    }
}

const resendOtp = async (req, res) => {
    try {
        console.log("Resend OTP called");  // Add this to check if the endpoint is triggered
        const user = req.session.tempUser;
        if (!user) {
            console.log("No user session found");
            return res.status(400).json({ success: false, message: "No user session found" });
        }

        const otp = randomstring.generate({
            length: 6,
            charset: "numeric"
        });
        req.session.otp = otp;
        req.session.timeLimit = Date.now() + 120000;  // Update the time limit

        // Send the new OTP via email
        await transporter.sendMail({
            to: user.email,  // Ensure this email is correct
            subject: "Resend OTP",
            text: `Your new OTP is: ${otp}`
        });
        console.log(`OTP resent successfully: ${otp}`);
        return res.status(200).json({ success: true, message: "OTP resent successfully" });
    } catch (error) {
        console.error("Error resending OTP:", error);
        return res.status(500).json({ success: false, message: "Error resending OTP" });
    }
};




const loadOtp = async (req, res) => {
    try {
        res.render("otpPage");
    } catch (error) {
        console.error(error);
    }
}

const verifyOtp = async (req, res) => {
    try {
        const { otp1, otp2, otp3, otp4, otp5, otp6 } = req.body;
        const otpInput = `${otp1}${otp2}${otp3}${otp4}${otp5}${otp6}`;
        
        if(Date.now() > req.session.timeLimit){
            req.session.otp = null;
            req.flash("error_message","The otp is Expired");
            res.redirect("/otp")
        }else{
            if (otpInput === req.session.otp) {
                const userDetails = new User(req.session.tempUser);
                userDetails.save();
                req.session.otp = null;
                req.session.tempUser = null;
                req.flash("success_message","Registration Successfull");
                res.redirect("/login");
            }else{
                req.flash("error_message","Invalid otp type again");
                res.redirect("/otp");
            }
    }
    } catch (error) {
        console.error(error);
    }
}
const userHome = async (req, res) => {
    try {
        const Products = await Product.find({}).populate("category");
        const user = req.session.userLogin
        res.render("home",({
            user,
            Products
        }));
    } catch (error) {
        console.error(error);
    }
}

const loadPcs = async (req, res) => {
    try {
        const user = req.session.userLogin
        const Products = await Product.find({}).populate("category");
        res.render("pcs",({
            Products,
            user
        }));
    } catch (error) {
        console.error(error);
    }
}
const loadComponents = async (req, res) => {
    try {
        const user = req.session.userLogin
        const Products = await Product.find({}).populate("category");
        res.render("components",({
            Products,
            user
        }));
    } catch (error) {
        console.error(error);
    }
}
const loadPeripherals = async (req, res) => {
    try {
        const user = req.session.userLogin
        const Products = await Product.find({}).populate("category");
        res.render("peripherals",({
            Products,
            user
        }));
    } catch (error) {
        console.error(error);
    }
}

const productDetails = async (req, res) => {
    try {
        const user = req.session.userLogin
        const id = req.params.id;
        const Products = await Product.findById(id).populate("category").populate("brands");
        const relatedProducts = await Product.find({category : Products.category }).populate("category").populate("brands").limit(8);
        res.render("productsDetails",({
            Products,
            user,
            relatedProducts
        }));
    } catch (error) {
        console.error(error);
    }
}

const logout = async (req,res) =>{
    try {
        req.session.userLogin = null
        res.redirect("/login"); 
    } catch (error) {
        
    }
}

module.exports = {
    userHome,
    loadComponents,
    loadPcs,
    loadPeripherals,
    loginPage,
    signupPage,
    landingPage,
    userInsert,
    loadOtp,
    verifyOtp,
    verifyLogin,
    resendOtp,
    productDetails,
    logout
}