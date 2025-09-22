
const Coupon = require("../../model/couponModel");
const cloudinary = require('cloudinary').v2;
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_KEY,
    api_secret: process.env.CLOUD_SECRET,
});


const loadCoupon = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 2;                 
        const skip = (page - 1) * limit;

        const totalCoupons = await Coupon.countDocuments();
        const coupons = await Coupon.find()
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });

        const totalPages = Math.ceil(totalCoupons / limit);

        res.render("coupons", {
            coupons,
            currentPage: page,
            totalPages
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Server Error");
    }
};
const addCoupons = async (req, res) => {
    try {
        const data = req.body
        if (data.couponCode !== data.couponCode.toUpperCase()) {
            return res.status(200).json({ success: false, message: "Coupon code should be in capital" });
        }
        const coupon = await Coupon.findOne({ code: data.couponCode.trim().toString() })
        if (coupon) {
            return res.status(200).json({ success: false, message: "coupon already exists" });
        }
        const newCoupon = new Coupon({
            code: data.couponCode,
            discountType: data.discountType,
            discountValue: data.discountValue,
            minPurchaseValue: data.minSpend,
            maxPurchaseValue: data.maxDiscount,
            expiryDate: data.expiryDate,
            usageLimit: data.usageLimit,
        })
        const save = await newCoupon.save();
        if (save) {
            res.status(200).json({ success: true });
        } else {
            res.status(200).json({ success: false, message: "Coupon not added" });
        }

    } catch (error) {
        console.error(error);
    }
}

const editCoupon = async (req, res) => {
    try {
        const { id } = req.params;
        
        await Coupon.findByIdAndUpdate(id, req.body,);
        res.status(200).json({ success: true, message: "Coupon edited", });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

const couponRemove = async (req, res) => {
    try {
        const { id } = req.params;
        const remove = await Coupon.findByIdAndDelete(id);
        if (remove) {
            res.status(200).json({ success: true });
        } else {
            res.status(200).json({ success: false });
        }
    } catch (error) {
        console.error(error)
    }
}

module.exports = {
    loadCoupon,
    addCoupons,
    couponRemove,
    editCoupon,
}