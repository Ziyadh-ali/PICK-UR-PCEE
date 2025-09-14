const User = require("../../model/userModel");
const cloudinary = require('cloudinary').v2;
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_KEY,
    api_secret: process.env.CLOUD_SECRET,
});


const loadUserList = async (req, res) => {
    try {
        let { page = 1, search = "", status = "" } = req.query;
        page = parseInt(page);
        const limit = 3;

        const query = {};

        // Search by name or email
        if (search) {
            query.$or = [
                { firstName: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } }
            ];
        }

        // Filter by status
        if (status === "active") query.isBlocked = false;
        if (status === "blocked") query.isBlocked = true;

        const users = await User.find(query)
            .skip((page - 1) * limit)
            .limit(limit)
            .lean();

        const totalUsers = await User.countDocuments(query);
        const totalPages = Math.ceil(totalUsers / limit);

        res.render("user", {
            users,
            currentPage: page,
            totalPages,
            limit,
            search,
            status
        });
    } catch (error) {
        console.error(error);
    }
};

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