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
        type : Number,
        
    },
    offerPrice : {
        type : Number 
    },
    isActive : {
        type : Boolean,
        default : true
    },
    image : [
        {
            type : String
        }
    ]
});

module.exports = mongoose.model("Product",productSchema);