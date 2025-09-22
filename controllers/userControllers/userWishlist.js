
const Wishlist = require("../../model/wishlistModel");
const User = require("../../model/userModel")

const loadWishlist = async (req, res) => {
    try {
        const user = req.session.userLogin;
        if (!user) {
            req.flash("error_message", "You are not logged in! Please login");
            return res.redirect("/login");
        }

        const userCheck = await User.findById(user);
        if (userCheck.isBlocked) {
            req.session.userLogin = null;
            req.flash("error_message", "You are blocked by the admin");
            return res.redirect("/login");
        }

        // Load the wishlist
        let wishlist = await Wishlist.findOne({ userId: user }).populate({ 
            path: "products.productId", 
            populate: { path: "category" } 
        });

        if (wishlist && wishlist.products) {
            wishlist.products = wishlist.products.filter(product => {
                if (product.productId && product.productId.isActive === false) {
                    Wishlist.updateOne(
                        { userId: user },
                        { $pull: { products: { productId: product.productId._id } } }
                    ).catch(err => console.error("Failed to remove blocked product:", err));
                    return false;
                }
                return true;
            });
        }

        res.render("wishlist", {
            user,
            wishlist
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
};

const addWishlist = async (req, res) => {
    try {
        const { productId } = req.body;
        const userId = req.session.userLogin;
        let wishlist = await Wishlist.findOne({ userId: userId })
        if(!userId){
            return res.status(200).json({ success: false , message: "Please login"});
        }
        if (wishlist) {
            
            wishlist.products.push({
                productId: productId,
            });

            wishlist = await wishlist.save();
            return res.status(200).json({ success: true });
        } else {
            const newWishlist = new Wishlist({
                userId: userId,
                products: [{
                    productId: productId,
                }]
            });
            await newWishlist.save();
            return res.status(200).json({ success: true });
        }
    } catch (error) {
        console.error(error);
    }
}
const deleteWishlist = async (req, res) => {
    try {
        const productId = req.params.id;
        const userId = req.session.userLogin;
        const remove = await Wishlist.updateOne({ userId: userId }, { $pull: { products: { productId: productId } } });
        if (remove) {
            return res.status(200).json({ success: true });
        } else {
            return res.status(200).json({ success: false });
        }
    } catch (error) {
        console.error(error);
    }
}

module.exports = { 
    loadWishlist,
    addWishlist, 
    deleteWishlist
}