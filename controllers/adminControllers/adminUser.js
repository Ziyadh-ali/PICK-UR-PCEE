const User = require("../../model/userModel");
const cloudinary = require('cloudinary').v2;
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_KEY,
    api_secret: process.env.CLOUD_SECRET,
  });


const loadUserList = async (req, res) => {
    try {
        const users = await User.find({});
        res.render("user", ({ users }));
    } catch (error) {
        console.error(error);
    }
}
const unBlockUser = async (req, res) => {
    try {
        const id = req.params.id;
        const list = await User.findByIdAndUpdate(id, { isBlocked: false });
        res.redirect("/admin/userList");
    } catch (error) {
        console.error(error);
    }
}
const blockUser = async (req, res) => {
    try {
        const id = req.params.id;
        const list = await User.findByIdAndUpdate(id, { isBlocked: true });
        res.redirect("/admin/userList");
    } catch (error) {
        console.error(error);
    }
}

module.exports = {
    loadUserList,
    unBlockUser,
    blockUser,
}