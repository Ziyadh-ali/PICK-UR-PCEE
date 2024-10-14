const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
    },
    lastName: {
        type: String,
    },
    email: {
        type: String,  
    },
    password: {
        type: String,
    },
    mobile: {
        type: Number,
    },
    googleId : {
        type: String,
       
    },
    isBlocked: {
        type: Boolean,
        default: false
    },
    isAdmin : {
        type : Boolean,
        default : false
    },
    createdAt: {
        type: Date,
        default: Date.now()
    },
    updatedAt: {
        type: Date,
        default: Date.now()
    },
});

module.exports = mongoose.model("User", userSchema);
