const mongoose = require("mongoose");

const offerSchema = new mongoose.Schema({
    offerName : {
        type : String,
        required : true,
    },
    discountType : {
        type : String,
        enum : ['percentage','fixed'],
        required : true
    },
    discountValue : {
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
    brands : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "Brands",
        default : null 
    },
    categories : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "Category",
        default : null 
    },
    isActive : {
        type : Boolean,
        default : true
    }
},{
    timestamps : true
});

module.exports = mongoose.model("Offer",offerSchema);