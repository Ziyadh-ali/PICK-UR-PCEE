const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../model/orderModel');
const Cart = require('../model/cartModel');
const Coupon = require('../model/couponModel');
const Product = require('../model/productModel');

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Create Razorpay order
const payWithRazorpay = async (req, res) => {
    try {
        req.session.payment = req.body;
        const totalPrice = req.body.totalPrice;

        // Razorpay expects amount in paise (INR × 100)
        const amountInPaise = totalPrice * 100;

        const options = {
            amount: amountInPaise,
            currency: "INR",
            receipt: `receipt_order_${Math.random() * 1000}`,
            payment_capture: 1
        };

        const order = await razorpay.orders.create(options);
        res.json({
            success: true,
            orderId: order.id,
            amount: options.amount,
            currency: options.currency,
            key: process.env.RAZORPAY_KEY_ID
        });

    } catch (error) {
        console.error("Razorpay order creation error:", error);
        res.status(500).json({ success: false, message: "Payment creation failed" });
    }
};

// Verify payment
const verifyRazorpayPayment = async (req, res) => {
    try {
        const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

        const generatedSignature = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(razorpay_order_id + "|" + razorpay_payment_id)
            .digest("hex");

        if (generatedSignature !== razorpay_signature) {
            return res.status(400).json({ success: false, message: "Payment verification failed" });
        }

        // Save order in DB (same as PayPal's paymentSuccess)
        const { paymentMethod, address } = req.session.payment;
        const userId = req.session.userLogin;
        const coupon = req.session.coupon;
        const cart = await Cart.findOne({ userId });

        let fullPrice = 0;
        cart.products.forEach(item => {
            let productPrice = item.productId.offerPrice || item.productId.price;
            fullPrice += productPrice * item.quantity;
        });

        if (coupon) {
            var coupons = await Coupon.findById(coupon._id);
            couponCode = coupon.code;
            discountValue = fullPrice - cart.totalPrice;
        }

        const newOrder = new Order({
            userId: userId,
            selectedAddress: address,
            ...(coupon ? { couponCode, discountValue } : {}),
            products: cart.products,
            totalPrice: cart.totalPrice,
            paymentMethod: paymentMethod,
            paymentId: razorpay_payment_id,
            paymentStatus: "Completed",
            orderStatus: "Processing"
        });

        await newOrder.save();
        await Cart.findByIdAndDelete(cart._id);

        for (const product of cart.products) {
            await Product.updateOne(
                { _id: product.productId._id },
                { $inc: { stock: -(product.quantity) } }
            );
        }
        if (coupon) {
            coupons.usedCount += 1;
            await coupons.save();
            req.session.coupon = "";
        }

        res.redirect("/orderSuccess");

    } catch (error) {
        console.error("Payment verification error:", error.message);
        res.status(500).json({ success: false, message: "Something went wrong" });
    }
};


const paymentFailedHandler = async (req, res) => {
    try {
        const { paymentMethod, address } = req.body;
        const userId = req.session.userLogin;
        const coupon = req.session.coupon;
        const cart = await Cart.findOne({ userId });

        let fullPrice = 0;
        cart.products.forEach(item => {
            let productPrice = item.productId.offerPrice || item.productId.price;
            fullPrice += productPrice * item.quantity;
        });

        if (coupon) {
            var coupons = await Coupon.findById(coupon._id);
            couponCode = coupon.code;
            discountValue = fullPrice - cart.totalPrice;
        }

        const newOrder = new Order({
            userId,
            selectedAddress: address,
            ...(coupon ? { couponCode, discountValue } : {}),
            products: cart.products,
            totalPrice: cart.totalPrice,
            paymentMethod,
            paymentId: null, // No payment ID because it failed
            paymentStatus: "Failed",
            orderStatus: "Failed"
        });

        await newOrder.save();
        await Cart.findByIdAndDelete(cart._id);

        // No stock deduction for failed payments

        if (coupon) {
            req.session.coupon = "";
        }

        res.json({ success: true, orderId: newOrder._id });
    } catch (error) {
        console.error("Payment failure order creation error:", error.message);
        res.status(500).json({ success: false, message: "Failed to create failed order" });
    }
};

const payWithRazorpayExistingOrder = async (req, res) => {
    try {
        const { orderId } = req.body; // From EJS page

        console.log(orderId)

        // Fetch existing order
        const existingOrder = await Order.findById(orderId);
        console.log(existingOrder)

        if (!existingOrder) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        // Amount in paise
        const amountInPaise = existingOrder.totalPrice * 100;

        const shortOrderId = orderId.toString().slice(-8);
        const options = {
            amount: amountInPaise,
            currency: "INR",
            receipt: `receipt_existing_order_${shortOrderId}`,
            payment_capture: 1
        };

        const razorpayOrder = await razorpay.orders.create(options);

        res.json({
            success: true,
            razorpayOrderId: razorpayOrder.id,
            amount: options.amount,
            currency: options.currency,
            key: process.env.RAZORPAY_KEY_ID
        });

    } catch (error) {
        console.error("Razorpay order creation for existing order error:", error);
        res.status(500).json({ success: false, message: "Payment creation failed" });
    }
};

// 2. Verify payment and update the existing order
const verifyRazorpayExistingOrderPayment = async (req, res) => {
    try {
        const { razorpay_payment_id, razorpay_order_id, razorpay_signature, orderId } = req.body;

        const generatedSignature = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(razorpay_order_id + "|" + razorpay_payment_id)
            .digest("hex");

        if (generatedSignature !== razorpay_signature) {
            return res.status(400).json({ success: false, message: "Payment verification failed" });
        }

        // Update existing order
        const updatedOrder = await Order.findByIdAndUpdate(
            orderId,
            {
                paymentId: razorpay_payment_id,
                paymentStatus: "Completed",
                orderStatus: "Processing"
            },
            { new: true }
        );

        if (!updatedOrder) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        res.redirect("/orderSuccess");

    } catch (error) {
        console.error("Payment verification for existing order error:", error.message);
        res.status(500).json({ success: false, message: "Something went wrong" });
    }
};

module.exports = { payWithRazorpay, verifyRazorpayPayment, paymentFailedHandler, payWithRazorpayExistingOrder, verifyRazorpayExistingOrderPayment };
