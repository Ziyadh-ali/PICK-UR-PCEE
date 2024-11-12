const mongoose = require("mongoose");
const ObjectId = mongoose.Schema.Types.ObjectId;

const cartSchema = new mongoose.Schema({
    userId : {
        type : ObjectId,
        ref : "User"
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
            price : Number,
        },
    ],
    totalPrice : {
        type : Number,
    }
  },
  {timestamps : true}
);

module.exports = mongoose.model("Cart",cartSchema);