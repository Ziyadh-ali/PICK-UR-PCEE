const User = require("../model/userModel");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const randomstring = require("randomstring");
const Category = require("../model/categoryModel");
const Brand = require("../model/brandsModel");
const Product = require("../model/productModel");
const Cart = require("../model/cartModel");
const Address = require("../model/addressModel");
const Order = require("../model/orderModel");
const Offer = require("../model/offerModel")
const PDFDocument = require('pdfkit');
const crypto = require('crypto');
const fs = require('fs');
const path = require("path");
const Wishlist = require("../model/wishlistModel");
const Coupon = require("../model/couponModel");
const Wallet = require("../model/walletModel");
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
            if (!userCheck.isBlocked) {
                const passwordMatch = await bcrypt.compare(req.body.password, userCheck.password);
                if (
                    userCheck.email === req.body.email &&
                    passwordMatch === true
                ) {
                    req.session.userLogin = userCheck._id;
                    return res.status(200).json({
                        success: true
                    });
                } else {
                    return res.status(200).json({
                        success: false,
                        message: "Invalid Email or Password"
                    });
                }
            } else {
                return res.status(200).json({
                    success: false,
                    message: "Your Blocked by the admin, Please contact the customer care"
                });
            }

        } else {
            return res.status(200).json({
                success: false,
                message: "User not find please register"
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
                success: false,
                message: "Email already exists"
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
            req.session.timeLimit = Date.now() + 120000;
            transporter.sendMail({
                to: req.body.email,
                subject: "otp",
                text: `Otp for verification : ${otp}`
            });
            return res.status(200).json({ success: true });
        }

    } catch (error) {
        console.error(error);
    }
}

const resendOtp = async (req, res) => {
    try {
        const user = req.session.tempUser;
        if (!user) {
            return res.status(400).json({ success: false, message: "No user session found" });
        }

        const otp = randomstring.generate({
            length: 6,
            charset: "numeric"
        });
        req.session.otp = otp;
        req.session.timeLimit = Date.now() + 120000;

        await transporter.sendMail({
            to: user.email, 
            subject: "Resend OTP",
            text: `Your new OTP is: ${otp}`
        });
        return res.status(200).json({ success: true, message: "OTP resent successfully" });
    } catch (error) {
        console.error("Error resending OTP:", error);
        return res.status(500).json({ success: false, message: "Error resending OTP" });
    }
};
const loadForgotPass = async (req, res) => {
    try {
        res.render("forgotPassword")
    } catch (error) {
        console.error(error)
    }
}
const forgetPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(200).json({ success: false, message: 'No user found' });
        }
        const resetToken = crypto.randomBytes(32).toString('hex');
        const tokenExpiry = Date.now() + 120000;

        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = tokenExpiry;
        await user.save();

        const resetUrl = `http://localhost:3000/resetPassword?token=${resetToken}`;

        const mailOptions = {
            to: user.email,
            subject: 'Password Reset',
            text: `You are receiving this because you have requested the reset of the password for your account.\n\n
        Please click on the following link, or paste it into your browser to complete the process:\n\n
        ${resetUrl}\n\n
        If you did not request this, please ignore this email and your password will remain unchanged.\n`
        };

        transporter.sendMail(mailOptions)
        res.status(200).json({ success: true });


    } catch (error) {
        console.error(error);
    }
};
const loadResetPassword = async (req, res) => {
    try {
        const token = req.query.token
        res.render("resetPassword", ({
            token
        }))
    } catch (error) {
        console.error(error)
    }
}
const resetPassword = async (req, res) => {
    try {
        const { token, newPassword, confirmPassword } = req.body;
        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(200).json({ success: false, message: 'Invalid or expired token' });
        }
        if (newPassword !== confirmPassword) {
            return res.status(200).json({ success: false, message: 'Passwords do not match' });
        }
        const hashedPassword = await hashPassword(newPassword);
        user.password = hashedPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();
        res.status(200).json({ success: true });



    } catch (error) {
        console.error(error)
    }
}
const loadOtp = async (req, res) => {
    try {
        const user = req.session.timeLimit
        res.render("otpPage", ({
            user
        }));
    } catch (error) {
        console.error(error);
    }
}

const verifyOtp = async (req, res) => {
    try {
        const { otp1, otp2, otp3, otp4, otp5, otp6 } = req.body;
        const otpInput = `${otp1}${otp2}${otp3}${otp4}${otp5}${otp6}`;

        // Check if the OTP has expired
        if (Date.now() > req.session.timeLimit) {
            req.session.otp = null;
            return res.status(400).json({
                success: false,
                message: "The OTP has expired. Please request a new one."
            });
        }

        // Validate the OTP
        if (otpInput === req.session.otp) {
            const userDetails = new User(req.session.tempUser);

            // Save user details to the database
            await userDetails.save();

            // Clear session data after successful OTP verification
            req.session.otp = null;
            req.session.tempUser = null;

            return res.status(200).json({
                success: true,
                message: "OTP verified successfully. Registration complete."
            });
        } else {
            return res.status(400).json({
                success: false,
                message: "Invalid OTP. Please try again."
            });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "An error occurred during OTP verification. Please try again."
        });
    }
};
const userHome = async (req, res) => {
    try {
        const Products = await Product.find({isActive : true}).populate("category");
        const user = req.session.userLogin
        const wishlist = await Wishlist.findOne({ userId: user });

        res.render("home", ({
            user,
            Products,
            wishlist,
        }));
    } catch (error) {
        console.error(error);
    }
}

const loadShop = async (req, res) => {
    try {
        const user = req.session.userLogin;
        const wishlist = await Wishlist.findOne({ userId: user });
        const page = 1

        const limit = 6;
        const skip = (page - 1) * limit;

        const totalProductCount = await Product.countDocuments();
        const totalPages = Math.ceil(totalProductCount / limit);

        const productDetails = await Product.find()
            .populate('category')
            .skip(skip)
            .limit(limit)



        const Brands = await Brand.find({ status: true });
        const Categories = await Category.find({ status: true });
        const currentPage = 1
        res.render("shop", {
            Products: productDetails,
            user,
            Brands,
            Categories,
            currentPage,
            totalPages,
            wishlist
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
}

const getSortFilterSearchData = async (req, res) => {

    let { page = 1, selectedCategories = [], selectedBrands = [], searchTerm = '', sortOption } = req.query;

    page = parseInt(page);

    const limit = 6;
    const skip = (page - 1) * limit;

    const filter = {};

    if (Array.isArray(selectedBrands) && selectedBrands.length > 0) {
        const brandIds = await Brand.find({
            name: { $in: selectedBrands },
        }).distinct("_id");
        filter.brands = { $in: brandIds };
    }

    if (Array.isArray(selectedCategories) && selectedCategories.length > 0) {
        const categoryIds = await Category.find({
            name: { $in: selectedCategories },
        }).distinct("_id");
        filter.category = { $in: categoryIds };
    }

    if (searchTerm) {
        filter.name = { $regex: new RegExp(`${searchTerm}`, "i") };
    }


    const totalProductCount = await Product.countDocuments(filter);
    const totalPages = Math.ceil(totalProductCount / limit);

    const sortBy = {};
    switch (sortOption) {
        case "priceLowHigh":
            sortBy.price = 1;
            break;
        case "priceHighLow":
            sortBy.price = -1;
            break;
        case "a-z":
            sortBy.name = 1;
            break;
        case "z-a":
            sortBy.name = -1;
            break;
        case "latest":
            sortBy.createdAt = -1;
            break;
        default:
            sortBy.createdAt = -1; // Default sort option if none provided
            break;
    }

    const productDetails = await Product.find(filter)
        .populate('category')
        .sort(sortBy)
        .skip(skip)
        .limit(limit);

    res.json({
        Products: productDetails,
        currentPage: page,
        totalPages: totalPages
    });
}

const sortShop = async (req, res) => {
    try {

    } catch (error) {
        console.error(error)
    }
}


const productDetails = async (req, res) => {
    try {
        const user = req.session.userLogin
        const wishlist = await Wishlist.findOne({ userId: user });
        const id = req.params.id;
        const Products = await Product.findById(id).populate("category").populate("brands").populate("offerId");
        const relatedProducts = await Product.find({ category: Products.category }).populate("category").populate("brands").limit(8);
        res.render("productsDetails", ({
            Products,
            user,
            relatedProducts,
            wishlist
        }));
    } catch (error) {
        console.error(error);
    }
}


//CART//
const loadCart = async (req, res) => {
    try {
        const user = req.session.userLogin
        const userCheck = await User.findById(user);
        let subTotal;  
        const cart = await Cart.findOne({ userId: user }).populate({ path: "products.productId", populate: { path: "category" } });
        if (cart) {
            subTotal = cart.products.reduce((acc, product) => {
                if(product.productId.offerId){
                     return acc + ((product.price-product.productId.offerPrice) * product.quantity);
                }else{
                     return acc + (product.price * product.quantity);
                }
            }, 0);
            cart.totalPrice = subTotal
            cart.save();
        }

        if (user) {
            if (userCheck.isBlocked == false) {
                res.render("cart", ({
                    user,
                    cart,
                }));
            } else {
                req.session.userLogin = null
                req.flash("error_message", "You are blocked by the admin");
                res.redirect("/login");
            }

        } else {
            req.flash("error_message", "You are not logged in ! please login");
            res.redirect("/login");
        }

    } catch (error) {
        console.error(error);
    }
}
const addToCart = async (req, res) => {
    try {
        const { productId, quantity } = req.body;
        const product = await Product.findById(productId);
        const userId = req.session.userLogin;
        let cart = await Cart.findOne({ userId: userId });
        if (cart) {
            let itemIndex = cart.products.findIndex(product => product.productId == productId);

            if (itemIndex > -1) {
                return res.status(200).json({ success: false });
            } else {
                cart.products.push({
                    productId: productId,
                    quantity: quantity,
                    price: product.price
                });
            }
            cart = await cart.save();
            return res.status(200).json({ success: true });
        } else {
            const newCart = new Cart({
                userId: userId,
                products: [{
                    productId: productId,
                    quantity: quantity,
                    price: product.price
                }]
            });
            await newCart.save();
            return res.status(200).json({ success: true });
        }

    } catch (error) {
        console.error(error);
    }
}
const deleteCart = async (req, res) => {
    try {
        const productId = req.params.id;
        const userId = req.session.userLogin;
        const remove = await Cart.updateOne({ userId: userId }, { $pull: { products: { productId: productId } } });
        if (remove) {
            return res.status(200).json({ success: true });
        } else {
            return res.status(200).json({ success: false });
        }
    } catch (error) {
        console.error(error);
    }
}
const updateQuantity = async (req, res) => {
    try {
        const { productId, quantityInc } = req.body;
        const product = await Product.findById(productId);
        const userId = req.session.userLogin;
        const cart = await Cart.findOne({ userId: userId });
        const item = cart.products.find(product => product.productId.toString() === productId.toString());
        if (item) {
            if (quantityInc == 1) {
                if (item.quantity < 5 && item.quantity < product.stock) {
                    await Cart.updateOne(
                        { userId, "products.productId": productId },
                        { $inc: { "products.$.quantity": 1 } }
                    )
                    return res.status(200).json({ success: true })

                } else {
                    return res.status(200).json({ success: false, message: "cannot exceed maximum quantity or stock limit" })
                }
            } else {
                if (item.quantity > 1) {
                    await Cart.updateOne(
                        { userId, "products.productId": productId },
                        { $inc: { "products.$.quantity": -1 } }
                    )
                    return res.status(200).json({ success: true })

                } else {
                    return res.status(200).json({ success: false, message: "Quantity cannot be less than 1" });
                }
            }
        } else {
            return res.status(200).json({ success: false, message: "Error in increamenting" })
        }

    } catch (error) {
        console.error(error);
    }
}

//wishlist
const loadWishlist = async (req, res) => {
    try {
        const user = req.session.userLogin
        const userCheck = await User.findById(user);
        const wishlist = await Wishlist.findOne({ userId: user }).populate({ path: "products.productId", populate: { path: "category" } });

        if (user) {
            if (userCheck.isBlocked == false) {
                res.render("wishlist", ({
                    user,
                    wishlist
                }));
            } else {
                req.session.userLogin = null
                req.flash("error_message", "You are blocked by the admin");
                res.redirect("/login");
            }

        } else {
            req.flash("error_message", "You are not logged in ! please login");
            res.redirect("/login");
        }

    } catch (error) {
        console.error(error);
    }
}
const addWishlist = async (req, res) => {
    try {
        const { productId } = req.body;
        const userId = req.session.userLogin;
        let wishlist = await Wishlist.findOne({ userId: userId })
        if (wishlist) {
            wishlist.products.push({
                productId: productId,
            });

            wishlist = await wishlist.save();
            return res.status(200).json({ success: true });
        } else {
            const newWishlist = new Wishlist({
                userId: userId,
                products: [{
                    productId: productId,
                }]
            });
            await newWishlist.save();
            return res.status(200).json({ success: true });
        }
    } catch (error) {
        console.error(error);
    }
}
const deleteWishlist = async (req, res) => {
    try {
        const productId = req.params.id;
        const userId = req.session.userLogin;
        const remove = await Wishlist.updateOne({ userId: userId }, { $pull: { products: { productId: productId } } });
        if (remove) {
            return res.status(200).json({ success: true });
        } else {
            return res.status(200).json({ success: false });
        }
    } catch (error) {
        console.error(error);
    }
}

//Account 
const loadAccount = async (req, res) => {
    try {
        const user = req.session.userLogin
        const userData = await User.findById(user);
        const address = await Address.findOne({ userId: user });
        const orders = await Order.find({ userId: user }).sort({ orderedAt: -1 });
        const wallet = await Wallet.findOne({ userId: user })
        res.render("userAccount", ({
            user,
            userData,
            address,
            orders,
            wallet
        }));
    } catch (error) {
        console.error(error);
    }
}
const accUpdate = async (req, res) => {
    try {
        const { firstName, lastName, mobile } = req.body;
        const id = req.session.userLogin;
        const user = await User.findByIdAndUpdate(id, {
            firstName: firstName,
            lastName: lastName,
            mobile: mobile
        });
        const save = await user.save();
        if (save) {
            res.status(200).json({ success: true });
        } else {
            res.status(200).json({ success: false, message: "error in saving" });
        }
    } catch (error) {
        console.error(error);
    }
}
const addAddress = async (req, res) => {
    try {
        const { fullName, addMobile, userAddress, city, state, pincode, altMobile, type } = req.body;
        userId = req.session.userLogin;
        const address = await Address.findOne({ userId: userId });
        if (address) {
            address.addresses.push({
                fullName: fullName,
                mobile: addMobile,
                address: userAddress,
                pincode: pincode,
                altMobile: altMobile,
                state: state,
                city: city,
                addressType: type
            });
            await address.save();
            res.status(200).json({ success: true })

        } else {
            const newAdd = new Address({
                userId: userId,
                addresses: [{
                    fullName: fullName,
                    mobile: addMobile,
                    address: userAddress,
                    pincode: pincode,
                    altMobile: altMobile,
                    state: state,
                    city: city,
                    addressType: type
                }]
            });
            await newAdd.save();
            res.status(200).json({ success: true })
        }
    } catch (error) {
        console.error(error);
    }
}
const deleteAddress = async (req, res) => {
    try {
        const { name } = req.body;
        const userId = req.session.userLogin;
        const remove = await Address.updateOne({ userId: userId }, { $pull: { addresses: { fullName: name } } });
        if (remove) {
            return res.status(200).json({ success: true });
        } else {
            return res.status(200).json({ success: false });
        }


    } catch (error) {
        console.error(error);
    }
}
const loadEditAdd = async (req, res) => {
    try {
        const name = req.params.name
        const user = req.session.userLogin
        const from = req.query.from
        const userAddress = await Address.findOne(
            { userId: user, "addresses.fullName": name },
            { "addresses.$": 1 }
        );
        const address = userAddress.addresses[0];
        res.render("addressEdit", ({
            user,
            address,
            from
        }));
    } catch (error) {
        console.error(error);
    }
}
const editAddress = async (req, res) => {
    try {
        const { fullName, addMobile, userAddress, city, state, pincode, altMobile, type } = req.body;
        const { name } = req.params
        userId = req.session.userLogin;
        const updatedAddress = await Address.updateOne(
            { userId, "addresses.fullName": name },
            {
                $set: {
                    "addresses.$.fullName": fullName,
                    "addresses.$.mobile": addMobile,
                    "addresses.$.address": userAddress,
                    "addresses.$.city": city,
                    "addresses.$.state": state,
                    "addresses.$.pincode": pincode,
                    "addresses.$.altMobile": altMobile,
                    "addresses.$.addressType": type

                }
            }
        );
        return res.status(200).json({ success: true })
    } catch (error) {
        console.error(error);
    }
}

const loadChechout = async (req, res) => {
    try {
        const userId = req.session.userLogin;
        const coupon = req.session.coupon || false;
        const cart = await Cart.findOne({ userId: userId }).populate({ path: "products.productId", populate: { path: "category" } });
        const address = await Address.findOne({ userId });
        const coupons = await Coupon.find({ expiryDate: { $gt: Date.now() } });
        if (cart.products.length < 1) {
            return res.redirect("/cart");
        }
        res.render("checkout", ({
            user: userId,
            cart,
            address,
            coupon,
            coupons,
        }));
    } catch (error) {
        console.error(error)
    }
}

const placeOrder = async (req, res) => {
    try {
        const address = req.body.address
        const paymentMethod = req.body.paymentMethod;
        const userId = req.session.userLogin
        const coupon = req.session.coupon;
        
        const cart = await Cart.findOne({ userId }).populate("products.productId");
        let totalPrice = 0;
        cart.products.forEach(item => {
            let productPrice
            if(item.productId.offerPrice){
                 productPrice = item.productId.offerPrice;
            }else{
                 productPrice = item.productId.price;
            }
            
            const quantity = item.quantity;
            totalPrice += productPrice * quantity;
        });
        if (coupon) {
            var coupons = await Coupon.findById(coupon._id)
            couponCode = coupon.code;
            discountValue = totalPrice - cart.totalPrice;
        }
        const orderData = new Order({
            userId: userId,
            selectedAddress: {
                fullName: address.fullName,
                addressType: address.addressType,
                address: address.address,
                city: address.city,
                state: address.state,
                mobile: address.mobile,
                pincode: address.pincode,
                altMobile: address.altMobile
            },
            ...(coupon ? { couponCode, discountValue } : {}),
            products: cart.products,
            totalPrice: cart.totalPrice,
            paymentMethod: paymentMethod,
            orderStatus: "Processing",
        });

        const saveOrder = orderData.save();
        if (saveOrder) {
            await Cart.findByIdAndDelete({ _id: cart._id });
            for (const product of cart.products) {
                await Product.updateOne(
                    { _id: product.productId._id },
                    { $inc: { stock: -(product.quantity) } }
                );
                if (coupon) {
                    coupons.usedCount += 1
                    coupons.save();
                }
                req.session.coupon = ""
            }
            return res.status(200).json({ success: true });
        }
    } catch (error) {
        console.error(error);
    }
}
const verifyCoupon = async (req, res) => {
    try {
        const { couponCode } = req.body;
        userId = req.session.userLogin;
        const cart = await Cart.findOne({ userId })
        const coupon = await Coupon.findOne({ code: couponCode });
        if (!coupon) {
            return res.status(200).json({ success: false, message: "Invalid coupon code." })
        }
        if (!coupon.expiryDate > Date.now()) {
            return res.status(200).json({ success: false, message: "coupon is expired." })
        }
        if (coupon.usedCount >= coupon.usageLimit) {
            return res.status(200).json({ success: false, message: "Usage limit completed" })
        }
        if (cart.totalPrice >= coupon.maxPurchaseValue) {
            return res.status(200).json({ success: false, message: `Total price is more than ${coupon.maxPurchaseValue}` })
        }
        if (cart.totalPrice < coupon.minPurchaseValue) {
            return res.status(200).json({ success: false, message: `Total price is less than ${coupon.minPurchaseValue}` })
        }

        if (coupon.discountType === "fixed") {
            cart.totalPrice = (cart.totalPrice - coupon.discountValue)
            cart.save()
            req.session.coupon = coupon
            return res.status(200).json({ success: true })
        } else {
            discount = (coupon.discountValue / 100) * cart.totalPrice
            cart.totalPrice = Math.floor(cart.totalPrice - discount)
            req.session.discount = discount
            cart.save()
            req.session.coupon = coupon
            res.status(200).json({ success: true })
        }

    } catch (error) {
        console.error(error);
    }
}
const removeCoupon = async (req, res) => {
    try {
        const { code } = req.body;
        userId = req.session.userLogin;
        const cart = await Cart.findOne({ userId })
        const coupon = await Coupon.findOne({ code: code });
        const total = cart.totalPrice
        if (!coupon) {
            res.status(200).json({ success: false })
        }
        if (coupon.discountType === "fixed") {
            cart.totalPrice = (cart.totalPrice + coupon.discountValue)
            cart.save()
            req.session.coupon = ""
            return res.status(200).json({ success: true })
        } else {
            cart.totalPrice = Math.ceil(cart.totalPrice + req.session.discount)
            req.session.discount = ""
            cart.save()
            req.session.coupon = ""
            return res.status(200).json({ success: true })
        }

    } catch (error) {
        console.error(error);
    }
}
const loadOrderSuccces = async (req, res) => {
    try {
        const userId = req.session.userLogin;
        const order = await Order.findOne({userId})
        res.render("orderSuccess", ({
            user: userId,
            order
        }))
    } catch (error) {
        console.error(error)
    }
}
const loadOrderDetails = async (req, res) => {
    try {
        const userId = req.session.userLogin;
        const id = req.params.id
        const order = await Order.findById(id).populate("products.productId");
        res.render("orderDetails", ({
            user: userId,
            order,
        }))
    } catch (error) {
        console.error(error);
    }
}

const cancelOrder = async (req, res) => {
    try {
        const orderId = req.params.id;
        const order = await Order.findOne({ _id: orderId });
        const userId = req.session.userLogin
        if (order.orderStatus !== "Cancelled") {
            for (let product of order.products) {
                await Product.updateOne(
                    { _id: product.productId._id },
                    { $inc: { stock: (product.quantity) } }
                );
            }
            const changeOrder = await Order.findByIdAndUpdate(orderId, { orderStatus: "Cancelled" });
            if (changeOrder) {
                const wallet = await Wallet.findOne({ userId: userId })
                if (wallet) {
                    wallet.balance += order.totalPrice
                    wallet.walletHistory.push({
                        transactionType: "credit",
                        amount: order.totalPrice,
                        description: "Refund"
                    })
                    await wallet.save();
                } else {
                    const newWallet = new Wallet({
                        userId: userId,
                        balance: order.totalPrice,
                        walletHistory: [
                            {
                                transactionType: "credit",
                                amount: order.totalPrice,
                                description: "Refund"
                            }
                        ]
                    })
                    await newWallet.save()
                }
                res.status(200).json({ success: true });
            }
        } else {
            res.status(200).json({ success: false, message: "Order already Cancelled" });
        }

    } catch (error) {
        console.error(error)
    }
}
const returnOrder = async (req, res) => {
    try {
        const { orderId } = req.body;
        const order = await Order.findOne({ _id: orderId });
        const userId = req.session.userLogin
        if (order.orderStatus !== "Cancelled") {
            for (let product of order.products) {
                await Product.updateOne(
                    { _id: product.productId._id },
                    { $inc: { stock: (product.quantity) } }
                );
            }
            const changeOrder = await Order.findByIdAndUpdate(orderId, { orderStatus: "Returned" });
            if (changeOrder) {
                const wallet = await Wallet.findOne({ userId: userId })
                if (wallet) {
                    wallet.balance += order.totalPrice
                    wallet.walletHistory.push({
                        transactionType: "credit",
                        amount: order.totalPrice,
                        description: "Refund"
                    })
                    await wallet.save();
                } else {
                    const newWallet = new Wallet({
                        userId: userId,
                        balance: order.totalPrice,
                        walletHistory: [
                            {
                                transactionType: "credit",
                                amount: order.totalPrice,
                                description: "Refund"
                            }
                        ]
                    })
                    await newWallet.save()
                }
                res.status(200).json({ success: true });
            }
        } else {
            res.status(200).json({ success: false, message: "Order already Returned" });
        }

    } catch (error) {
        console.error(error)
    }
};
const invoiceDownload = async (req,res)=>{
    try {
        const orderId = req.params.orderId;

        const order = await Order.findById(orderId).populate('products.productId');
    
        if (!order) {
            return res.status(404).send("Order not found");
        }
    
        const invoicesDir = path.join(__dirname, 'invoices');
        const pdfPath = path.join(invoicesDir, `${orderId}_invoice.pdf`);
    
        if (!fs.existsSync(invoicesDir)) {
            fs.mkdirSync(invoicesDir, { recursive: true });
        }
    
        const doc = new PDFDocument();
        const writeStream = fs.createWriteStream(pdfPath);
        doc.pipe(writeStream);
    
        doc.fontSize(18).text('Invoice', { align: 'center' });
        doc.fontSize(14).text(`Order ID: ${order._id}`);
        doc.text(`Order Date: ${new Date(order.orderedAt).toDateString()}`);
        doc.text(`Total Amount:  ${order.totalPrice}`);
        doc.text(`Payment Method:  ${order.paymentMethod}`);
        doc.text(`Payment Status:  ${order.paymentStatus}`);
        if (order.couponCode) {
            doc.text(`Coupon Code: ${order.couponCode}`);
            doc.text(`Discount: ₹${order.discountValue}`);
        }
    
        doc.moveDown().text('Items:', { underline: true });
    
        order.products.forEach(product => {
            doc.moveDown();
            doc.text(`Product: ${product.productId.name}`);
            doc.text(`Quantity: ${product.quantity}`);
            const price = product.productId.offerId ? (product.price - product.productId.offerPrice) : product.price;
            doc.text(`Price: ${price}`);
            doc.text(`Subtotal: ${price * product.quantity}`);
        });
    
        doc.end();
    
        writeStream.on('finish', () => {
            res.download(pdfPath, `${orderId}_invoice.pdf`, (err) => {
                if (err) {
                    console.error('Error downloading file:', err);
                    return res.status(500).send("Could not download the file");
                }
    
                fs.unlink(pdfPath, (unlinkErr) => {
                    if (unlinkErr) console.error('Error deleting file:', unlinkErr);
                });
            });
        });
    
        writeStream.on('error', (err) => {
            console.error('Error writing PDF file:', err);
            res.status(500).send("Error generating PDF");
        });

    } catch (error) {
        console.error(error)
    }
}


//Logout//
const logout = async (req, res) => {
    try {
        req.session.userLogin = null
        res.redirect("/login");
    } catch (error) {
        console.error(error);
    }
}

module.exports = {
    userHome,
    loadShop,
    getSortFilterSearchData,
    loginPage,
    signupPage,
    landingPage,
    userInsert,
    loadOtp,
    verifyOtp,
    verifyLogin,
    resendOtp,
    productDetails,
    loadCart,
    addToCart,
    deleteCart,
    updateQuantity,
    loadAccount,
    accUpdate,
    addAddress,
    deleteAddress,
    editAddress,
    loadEditAdd,
    loadChechout,
    loadOrderSuccces,
    placeOrder,
    loadOrderDetails,
    cancelOrder,
    returnOrder,
    forgetPassword,
    loadForgotPass,
    loadResetPassword,
    resetPassword,
    sortShop,
    loadWishlist,
    addWishlist,
    deleteWishlist,
    verifyCoupon,
    removeCoupon,
    invoiceDownload,
    logout
}