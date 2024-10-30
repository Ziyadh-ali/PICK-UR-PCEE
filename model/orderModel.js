const mongoose = require("mongoose");
const ObjectId = mongoose.Schema.Types.ObjectId;

const orderSchema = new mongoose.Schema({
    userId : {
        type : ObjectId,
        ref : "User"
    },
    selectedAddress : {
        fullName: {
            type: String,
        },
        pincode: {
            type: Number,
        },
        address: {
            type: String,
        },
        mobile: {
            type: Number,
        },
        city : {
            type: String,
           
        },
        state: {
            type: String,
        },
        altMobile: {
            type: String,
            default : null
        },
        addressType : {
            type : String,
        }
    },
    products : [
        {
            productId : { 
                type : ObjectId,
                ref : "Product"
            },
            quantity : {
                type : Number,
                min : 1,
                max : 5
            },
            offerPrice : Number,
            status :{
                type :  String,
                default : null
            },
        },
    ],
    totalPrice : Number,
    paymentMethod : {
        type : String,
        enum : ["Paypal","Wallet","Cash on Delivery"]
    },
    orderStatus : {
        type : String,
        enum : ["Processing","Shipped","Delivered","Cancelled"]
    },
    orderedAt : {
        type : Date,
        default : Date.now()
    },
    deliveredAt : Date,
    cancelledAt : Date

  },
);

module.exports = mongoose.model("Order",orderSchema);