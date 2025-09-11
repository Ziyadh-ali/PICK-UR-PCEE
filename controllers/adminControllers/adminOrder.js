const Product = require("../../model/productModel");
const Order = require("../../model/orderModel");

const orderList = async (req, res) => {
    try {
        
        const search = req.query.search || '';
        const page = parseInt(req.query.page) || 1;
        const limit = 3; 
        const searchQuery = search
            ? {
                $or: [
                    { 'selectedAddress.fullName': { $regex:new RegExp(search, "i") } },
                    { 'orderStatus': { $regex:new RegExp(search, "i")} },
                ],
            }
            : {};

        const totalOrders = await Order.countDocuments(searchQuery);

      
        const orders = await Order.find(searchQuery)
            .populate('products.productId').populate('userId')
            .sort({ orderedAt: -1 }) 
            .skip((page - 1) * limit)
            .limit(limit);

        
        const totalPages = Math.ceil(totalOrders / limit);
        res.render('orderList', {
            orders,
            currentPage: page,
            totalPages,
            search,
        });
    } catch (error) {
        console.error('Error fetching orders:', error);
    }
};
const orderDetails = async (req,res) =>{
    try {
        const {id} = req.params
        const order = await Order.findById(id).populate('products.productId').populate('userId')
        res.render("orderDetails",({
            order
        }))
    } catch (error) {
        console.error(error);
    }
}

const statusChange = async (req,res)=>{
    try {
        const {statusSelected , orderId} = req.body;
        const order = await Order.findById(orderId);
        for (let product of order.products) {
            await Product.updateOne(
                { _id: product.productId._id },
                { $inc: { stock: (product.quantity) } }
            );
        }
        const changeStatus = await Order.findByIdAndUpdate(orderId,
            {$set : {orderStatus : statusSelected}}
        )
        if(changeStatus){
            res.status(200).json({success : true});
        }
        
        
        
    } catch (error) {
        console.error(error)
    }
}

module.exports = {
    orderList,
    orderDetails,
    statusChange
}