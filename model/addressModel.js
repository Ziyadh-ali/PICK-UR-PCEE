const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema({
    userId :{
        type : mongoose.Schema.Types.ObjectId,
        ref : "User"
    },
    addresses : [
        {
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
        }
    ]
    
},
    {timestamps : true}
);

module.exports = mongoose.model("Address", addressSchema);
