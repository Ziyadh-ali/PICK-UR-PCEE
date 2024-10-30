const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema({
    code : {
        type : String,
        required : true,
        trim : true,
        uppercase : true
    },
    discoutType : {
        type : String,
        enum : ['percentage','fixed'],
        required : true
    },
    discoutValue : {
        type : Number,
        required : true,
        min : 0
    },
    minPurchaseValue : {
        type : Number,
        default : 0
    },
    maxPurchaseValue : {
        type : Number,
        default : null
    },
    expiryDate : {
        type : Date,
        required : true
    },
    usageLimit : {
        type : Number,
        default : null 
    },
    usedCount : {
        type : Number,
        default : 0 
    },
    isActive : {
        type : Boolean,
        default : true
    }
},{
    timestamps : true
});

module.exports = mongoose.model("Coupon",couponSchema);