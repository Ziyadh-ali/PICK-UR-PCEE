const mongoose = require("mongoose");
const ObjectId = mongoose.Schema.Types.ObjectId;

const wishlistSchema = new mongoose.Schema({
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
        },
    ],
  },
  {timestamps : true}
);

module.exports = mongoose.model("Wishlist",wishlistSchema);