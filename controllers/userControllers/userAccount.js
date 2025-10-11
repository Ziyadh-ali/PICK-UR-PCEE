const Address = require("../../model/addressModel");
const Order = require("../../model/orderModel");
const Wallet = require("../../model/walletModel");
const User = require("../../model/userModel");

const loadAccount = async (req, res) => {
    try {
        const user = req.session.userLogin;
        const userData = await User.findById(user);
        const address = await Address.findOne({ userId: user });
        const wallet = await Wallet.findOne({ userId: user });

        // Pagination parameters
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 2;
        const skip = (page - 1) * limit;

        // Get active tab from query parameter or default to 'profile'
        const activeTab = req.query.tab || 'profile';

        // Get orders with pagination
        
        const orders = await Order.find({ userId: user })
            .sort({ orderedAt: -1 })
            .skip(skip)
            .limit(limit)

        // Get total count for pagination
        const totalOrders = await Order.countDocuments({ userId: user });
        const totalPages = Math.ceil(totalOrders / limit);

        const getStatusColor = (status) => {
            switch (status) {
                case "Processing":
                    return "color: orange; font-weight: bold;";
                case "Shipped":
                    return "color: blue; font-weight: bold;";
                case "Delivered":
                    return "color: green; font-weight: bold;";
                case "Returned":
                    return "color: grey; font-weight: bold;";
                case "Failed":
                case "Cancelled":
                    return "color: red; font-weight: bold;";
                default:
                    return "color: gray;";
            }
        };

        res.render("userAccount", {
            user,
            userData,
            address,
            orders,
            wallet,
            getStatusColor,
            currentPage: page,
            totalPages,
            limit,
            activeTab,
            totalOrders
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Server Error");
    }
};
const accUpdate = async (req, res) => {
    try {
        const { firstName, lastName, mobile } = req.body;
        const id = req.session.userLogin;
        const user = await User.findByIdAndUpdate(id, {
            firstName: firstName,
            lastName: lastName,
            mobile: mobile
        });
        const save = await user.save();
        if (save) {
            res.status(200).json({ success: true });
        } else {
            res.status(200).json({ success: false, message: "error in saving" });
        }
    } catch (error) {
        console.error(error);
    }
}
const addAddress = async (req, res) => {
    try {
        const { fullName, addMobile, userAddress, city, state, pincode, altMobile, type } = req.body;
        let userId = req.session.userLogin;
        const address = await Address.findOne({ userId: userId });
        if (address) {
            address.addresses.push({
                fullName: fullName,
                mobile: addMobile,
                address: userAddress,
                pincode: pincode,
                altMobile: altMobile,
                state: state,
                city: city,
                addressType: type
            });
            await address.save();
            res.status(200).json({ success: true })

        } else {
            const newAdd = new Address({
                userId: userId,
                addresses: [{
                    fullName: fullName,
                    mobile: addMobile,
                    address: userAddress,
                    pincode: pincode,
                    altMobile: altMobile,
                    state: state,
                    city: city,
                    addressType: type
                }]
            });
            await newAdd.save();
            res.status(200).json({ success: true })
        }
    } catch (error) {
        console.error(error);
    }
}
const deleteAddress = async (req, res) => {
    try {
        const { name } = req.body;
        const userId = req.session.userLogin;
        const remove = await Address.updateOne({ userId: userId }, { $pull: { addresses: { fullName: name } } });
        if (remove) {
            return res.status(200).json({ success: true });
        } else {
            return res.status(200).json({ success: false });
        }


    } catch (error) {
        console.error(error);
    }
}
const loadEditAdd = async (req, res) => {
    try {
        const name = req.params.name
        const user = req.session.userLogin
        const from = req.query.from
        const userAddress = await Address.findOne(
            { userId: user, "addresses.fullName": name },
            { "addresses.$": 1 }
        );
        const address = userAddress.addresses[0];
        res.render("addressEdit", ({
            user,
            address,
            from
        }));
    } catch (error) {
        console.error(error);
    }
}
const editAddress = async (req, res) => {
    try {
        const { fullName, addMobile, userAddress, city, state, pincode, altMobile, type } = req.body;
        const { name } = req.params
        userId = req.session.userLogin;
        const updatedAddress = await Address.updateOne(
            { userId, "addresses.fullName": name },
            {
                $set: {
                    "addresses.$.fullName": fullName,
                    "addresses.$.mobile": addMobile,
                    "addresses.$.address": userAddress,
                    "addresses.$.city": city,
                    "addresses.$.state": state,
                    "addresses.$.pincode": pincode,
                    "addresses.$.altMobile": altMobile,
                    "addresses.$.addressType": type

                }
            }
        );
        return res.status(200).json({ success: true })
    } catch (error) {
        console.error(error);
    }
}

module.exports = {
    loadAccount,
    accUpdate,
    addAddress,
    deleteAddress,
    editAddress,
    loadEditAdd
}