const Product = require("../../model/productModel");
const Cart = require("../../model/cartModel");
const Address = require("../../model/addressModel");
const Order = require("../../model/orderModel");
const Coupon = require("../../model/couponModel");
const Wallet = require("../../model/walletModel");

const loadCheckout = async (req, res) => {
    try {
        const userId = req.session.userLogin;
        const coupon = req.session.coupon || false;

        const cart = await Cart.findOne({ userId }).populate({
            path: "products.productId",
            populate: { path: "category" },
        });

        // Validate cart products
        if (cart && cart.products.length > 0) {
            let updatedProducts = [];
            let productsRemoved = false;

            for (const product of cart.products) {
                const productData = product.productId;

                if (!productData || productData.isActive === false || productData.stock <= 0) {
                    
                    await Cart.updateOne(
                        { userId },
                        { $pull: { products: { productId: productData?._id } } }
                    );
                    res.status(200).json({success: false,message: "Some products were removed from your cart as they are either blocked or out of stock.",});
                    productsRemoved = true;
                } else {
                    updatedProducts.push(product);
                }
            }

            cart.products = updatedProducts;
            await cart.save();

            if (productsRemoved) {
                res.status(200).json({success: false,message: "Some products were removed from your cart as they are either blocked or out of stock.",});
                setTimeout(() => {
                    return res.redirect("/cart");
                }, 2000);
            }
        }

        const address = await Address.findOne({ userId });
        const coupons = await Coupon.find({ expiryDate: { $gt: Date.now() } });

        if (!cart || cart.products.length < 1) {
            return res.redirect("/cart");
        }

        res.render("checkout", {
            user: userId,
            cart,
            address,
            coupon,
            coupons,
        });
    } catch (error) {
        console.error(error);
    }
};
const placeOrder = async (req, res) => {
    try {
        const address = req.body.address;
        const paymentMethod = req.body.paymentMethod;
        const userId = req.session.userLogin;
        const coupon = req.session.coupon;

        const cart = await Cart.findOne({ userId }).populate("products.productId");

        if (!cart || cart.products.length === 0) {
            return res.status(200).json({
                success: false,
                message: "Your cart is empty or contains invalid products.",
            });
        }

        let totalPrice = 0;
        const validProducts = [];

        for (const product of cart.products) {
            const productData = product.productId;

            if (!productData || productData.isActive === false || productData.stock <= 0) {
                await Cart.updateOne(
                    { userId },
                    { $pull: { products: { productId: productData?._id } } }
                );
                continue;
            }

            if (product.quantity > productData.stock) {
                product.quantity = productData.stock;
            }

            const productPrice = productData.offerPrice || productData.price;
            totalPrice += productPrice * product.quantity;

            validProducts.push(product);
        }

        if (validProducts.length === 0) {
            res.status(200).json({
                success: false,
                message: "Your cart contains blocked or out-of-stock products. Please update your cart.",
            });
            setTimeout(() => {
                return res.redirect("/cart");
            }, 2000);
        }

        cart.products = validProducts;
        await cart.save();

        let discountValue = 0;
        let couponCode = null;
        if (coupon) {
            const couponData = await Coupon.findById(coupon._id);
            if (couponData) {
                discountValue = totalPrice - cart.totalPrice;
                couponCode = coupon.code;
            }
        }

        const orderData = new Order({
            userId,
            selectedAddress: {
                fullName: address.fullName,
                addressType: address.addressType,
                address: address.address,
                city: address.city,
                state: address.state,
                mobile: address.mobile,
                pincode: address.pincode,
                altMobile: address.altMobile,
            },
            ...(coupon ? { couponCode, discountValue } : {}),
            products: validProducts,
            totalPrice: cart.totalPrice,
            paymentMethod,
            orderStatus: "Processing",
        });

        const saveOrder = await orderData.save();
        if (saveOrder) {
            await Cart.findByIdAndDelete(cart._id);

            for (const product of validProducts) {
                await Product.updateOne(
                    { _id: product.productId._id },
                    { $inc: { stock: -(product.quantity) } }
                );
            }

            if (coupon) {
                const couponData = await Coupon.findById(coupon._id);
                couponData.usedCount += 1;
                await couponData.save();
                req.session.coupon = null;
            }

            return res.status(200).json({ success: true });
        }
    } catch (error) {
        console.error(error);
    }
};
const placeOrderWithWallet = async (req, res) => {
    try {
        const address = req.body.address;
        const userId = req.session.userLogin;
        const coupon = req.session.coupon;

        const cart = await Cart.findOne({ userId }).populate("products.productId");
        const wallet = await Wallet.findOne({ userId });

        if (!cart || cart.products.length === 0) {
            return res.status(200).json({
                success: false,
                message: "Your cart is empty or contains invalid products.",
            });
        }

        let totalPrice = 0;
        const validProducts = [];

        for (const product of cart.products) {
            const productData = product.productId;

            if (!productData || productData.isActive == false || productData.stock <= 0) {
                await Cart.updateOne(
                    { userId },
                    { $pull: { products: { productId: productData?._id } } }
                );
                continue;
            }

            if (product.quantity > productData.stock) {
                product.quantity = productData.stock;
            }

            const productPrice = productData.offerPrice || productData.price;
            totalPrice += productPrice * product.quantity;

            validProducts.push(product);
        }

        if (validProducts.length === 0) {
            res.status(200).json({
                success: false,
                message: "Your cart contains blocked or out-of-stock products. Please update your cart.",
            });
            setTimeout(() => {
                return res.redirect("/cart");
            }, 2000);
        }

        cart.products = validProducts;
        await cart.save();

        let discountValue = 0;
        let couponCode = null;
        if (coupon) {
            const couponData = await Coupon.findById(coupon._id);
            if (couponData) {
                discountValue = totalPrice - cart.totalPrice;
                couponCode = coupon.code;
            }
        }

        totalPrice = cart.totalPrice;

        if (wallet.balance < totalPrice) {
            return res.status(200).json({success: false,message: "Insufficient wallet balance. Please recharge your wallet or choose another payment method.",})
        }

        wallet.balance -= totalPrice;
        wallet.walletHistory.push({
            transactionType: "debit",
            amount: totalPrice,
            description: "Purchase",
        });
        await wallet.save();

        const orderData = new Order({
            userId,
            selectedAddress: {
                fullName: address.fullName,
                addressType: address.addressType,
                address: address.address,
                city: address.city,
                state: address.state,
                mobile: address.mobile,
                pincode: address.pincode,
                altMobile: address.altMobile,
            },
            ...(coupon ? { couponCode, discountValue } : {}),
            products: validProducts,
            totalPrice: cart.totalPrice,
            paymentMethod: "Wallet",
            paymentStatus : "Completed",
            orderStatus: "Processing",
        });

        const saveOrder = await orderData.save();
        if (saveOrder) {
            await Cart.findByIdAndDelete(cart._id);

            for (const product of validProducts) {
                await Product.updateOne(
                    { _id: product.productId._id },
                    { $inc: { stock: -(product.quantity) } }
                );
            }

            if (coupon) {
                const couponData = await Coupon.findById(coupon._id);
                couponData.usedCount += 1;
                await couponData.save();
                req.session.coupon = null;
            }

            return res.status(200).json({ success: true });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};
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
};
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
};
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
};
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
};
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
};
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

module.exports = {
    cancelOrder,
    loadCheckout,
    placeOrderWithWallet,
    loadOrderDetails,
    placeOrder,
    returnOrder,
    removeCoupon,
    loadOrderSuccces,
    verifyCoupon,
}