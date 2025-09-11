const Product = require("../../model/productModel");
const Cart = require("../../model/cartModel");

const loadCart = async (req, res) => {
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

        let cart = await Cart.findOne({ userId: user }).populate({
            path: "products.productId",
            populate: { path: "category" },
        });

        if (cart) {
            let subTotal = 0;
            const updatedProducts = [];

            for (const product of cart.products) {
                const productData = product.productId;

                if (!productData || productData.isActive === false || productData.stock <= 0) {
                    await Cart.updateOne(
                        { userId: user },
                        { $pull: { products: { productId: productData?._id } } }
                    );
                    continue;
                }

                if (product.quantity > productData.stock) {
                    product.quantity = productData.stock;
                }

                const productPrice = productData.offerId
                    ? (product.price-productData.offerPrice)
                    : product.price;

                subTotal += productPrice * product.quantity;
                updatedProducts.push(product);
            }

            cart.products = updatedProducts;
            cart.totalPrice = subTotal;
            await cart.save();
        }

        res.render("cart", {
            user,
            cart,
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
};

const addToCart = async (req, res) => {
    try {
        const userId = req.session.userLogin;
        const { productId, quantity } = req.body;
        const product = await Product.findById(productId);
        let cart = await Cart.findOne({ userId: userId });
        if(!userId){
            return res.status(200).json({ success: false , message: "Please login"});
        }
        if (cart) {
            let itemIndex = cart.products.findIndex(product => product.productId == productId);

            if (itemIndex > -1) {
                return res.status(200).json({ success: false , message : "item already in cart"});
            } else {
                cart.products.push({
                    productId: productId,
                    quantity: quantity,
                    price: product.price
                });
            }
            cart = await cart.save();
            return res.status(200).json({ success: true });
        } else {
            const newCart = new Cart({
                userId: userId,
                products: [{
                    productId: productId,
                    quantity: quantity,
                    price: product.price
                }]
            });
            await newCart.save();
            return res.status(200).json({ success: true });
        }

    } catch (error) {
        console.error(error);
    }
}
const deleteCart = async (req, res) => {
    try {
        const productId = req.params.id;
        const userId = req.session.userLogin;
        const remove = await Cart.updateOne({ userId: userId }, { $pull: { products: { productId: productId } } });
        if (remove) {
            return res.status(200).json({ success: true });
        } else {
            return res.status(200).json({ success: false });
        }
    } catch (error) {
        console.error(error);
    }
}
const updateQuantity = async (req, res) => {
    try {
        const { productId, quantityInc } = req.body;
        const product = await Product.findById(productId);
        const userId = req.session.userLogin;
        const cart = await Cart.findOne({ userId: userId });
        const item = cart.products.find(product => product.productId.toString() === productId.toString());
        if (item) {
            if (quantityInc == 1) {
                if (item.quantity < 5 && item.quantity < product.stock) {
                    await Cart.updateOne(
                        { userId, "products.productId": productId },
                        { $inc: { "products.$.quantity": 1 } }
                    )
                    return res.status(200).json({ success: true })

                } else {
                    return res.status(200).json({ success: false, message: "cannot exceed maximum quantity or stock limit" })
                }
            } else {
                if (item.quantity > 1) {
                    await Cart.updateOne(
                        { userId, "products.productId": productId },
                        { $inc: { "products.$.quantity": -1 } }
                    )
                    return res.status(200).json({ success: true })

                } else {
                    return res.status(200).json({ success: false, message: "Quantity cannot be less than 1" });
                }
            }
        } else {
            return res.status(200).json({ success: false, message: "Error in increamenting" })
        }

    } catch (error) {
        console.error(error);
    }
}

module.exports = {
    addToCart,
    deleteCart,
    loadCart,
    updateQuantity 
}