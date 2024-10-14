const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
    name : {
        type : String,
        required : false
    },
    description : {
        type : String,
        required : false
    },
    status : {
        type : Boolean,
        default : true
    }
});

module.exports = mongoose.model("Category",categorySchema);