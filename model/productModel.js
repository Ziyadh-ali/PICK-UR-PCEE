const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
    name : {
        type : String,
        
    },
    description : {
        type : String,
       
    },
    specification : {
        type : String,
        
    },
    category : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "Category"
    },
    brands : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "Brands"
    },
    stock : {
        type : Number
    },
    price : {
        type : Number 
    },
    offerId : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "Offer",
        default : null
    },
    offerPrice : {
        type : Number ,
        default : null
    },
    isActive : {
        type : Boolean,
        default : true
    },
    image : [
        {
            type : String
        }
    ],
    createdAt : {
        type : Date,
        default : Date.now()
    }
});

module.exports = mongoose.model("Product",productSchema);