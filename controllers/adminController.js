const Product = require("../model/productModel");
const excelJS = require("exceljs");
const Order = require("../model/orderModel");
const cloudinary = require('cloudinary').v2;
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_KEY,
    api_secret: process.env.CLOUD_SECRET,
  });

const loadDashboard = async (req, res) => {
    try {
        const order = await Order.find({orderStatus : "Delivered"})
        const totalOrders = order.length
        const totalRevenue = order.reduce((acc,curr)=>{
            return acc += curr.totalPrice
        },0)
        res.render("dashboard",{
            totalOrders,
            totalRevenue
        });
    } catch (error) {
        console.error(error);
    }
};
const loadSalesReport = async (req,res)=>{
    try {
        const salesReports = await Order.find({orderStatus : "Delivered"}).populate("products.productId")
        const totalOrders = salesReports.length
        const totalRevenue = salesReports.reduce((acc,curr)=>{
            return acc += curr.totalPrice
        },0)
    
        let totalOfferDiscount = 0;
        let totalCouponDiscount = 0
        salesReports.forEach(sale => {
            sale.products.forEach(product => {
                if (product.productId.offerId) {
                    const discount = product.productId.offerPrice * product.quantity;
                    totalOfferDiscount += discount;
                }
            });
            totalCouponDiscount += sale.discountValue
            
        });
        const totalDiscount = totalOfferDiscount+totalCouponDiscount;
        
        res.render("salesReport",({
            sales : salesReports,
            totalOrders,
            totalRevenue,
            totalDiscount,
            totalOfferDiscount,
            totalCouponDiscount,
        }));
    } catch (error) {
        console.error(error);
    }
};
const generateRreport =  async (req, res) => {
    try {
    const { startDate, endDate, reportType } = req.body;

    let start, end ;

    const currentDate = new Date();
    if (reportType === "weekly") {

      const dayOfWeek = currentDate.getDay();
      start = new Date(currentDate);
      start.setDate(currentDate.getDate() - dayOfWeek);
      start.setHours(0, 0, 0, 0);

      end = new Date(currentDate);
      end.setHours(23, 59, 59, 999);
    } else if (reportType === "monthly") {

      start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      end = new Date(currentDate);
      end.setHours(23, 59, 59, 999);
    } else if (reportType === "yearly") {

      start = new Date(currentDate.getFullYear(), 0, 1);
      end = new Date(currentDate);
      end.setHours(23, 59, 59, 999);
    } else if (startDate && endDate) {

      start = new Date(startDate);
      end = new Date(endDate);
      end.setHours(23, 59, 59, 999); 
    } else if (reportType === "all") {
        start = new Date(0);
        end = new Date(currentDate); 
        end.setHours(23, 59, 59, 999);
    } else {
      return res.status(400).json({ error: "Invalid date range or report type." });
    }

      const matchQuery = { orderedAt: { $gte: start, $lte: end },orderStatus : "Delivered" };
      const reportData = await Order.find(matchQuery).populate('products.productId');
      const totalOrders = reportData.length
        const totalRevenue = reportData.reduce((acc,curr)=>{
            return acc += curr.totalPrice
        },0)
    
        let totalOfferDiscount = 0;
        let totalCouponDiscount = 0
        reportData.forEach(data => {
            data.products.forEach(product => {
                if (product.productId.offerId) {
                    const discount = product.productId.offerPrice * product.quantity;
                    totalOfferDiscount += discount;
                }
            });
            totalCouponDiscount += data.discountValue
            
        });
        const totalDiscount = totalOfferDiscount+totalCouponDiscount;
      res.status(200).json({
        data : reportData , 
        totalRevenue,
        totalOrders,
        totalDiscount,
        totalCouponDiscount,
        totalOfferDiscount
     });
    } catch (error) {
      console.error( "Failed to generate report" );
    }
};
const downloadExcel = async (req,res)=>{
    const data = req.body.salesData
    const {totalOrders,totalRevenue,totalDiscount,totalOfferDiscount,totalCouponDiscount} = req.body
    const workbook = new excelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sales Report');

    worksheet.addRow(['Summary']);
    worksheet.addRow(['Total Orders:', totalOrders]);
    worksheet.addRow(['Total Revenue:', `₹${totalRevenue}`]);
    worksheet.addRow(['Total Discounts:', `₹${totalDiscount}`]);
    worksheet.addRow(['Discount through Offer:', `₹${totalOfferDiscount}`]);
    worksheet.addRow(['Discount through Coupon:', `₹${totalCouponDiscount}`]);
    worksheet.addRow([]);

    worksheet.addRow(['Order ID', 'Buyer Name', 'Quantity', 'Total', 'Order Date', 'Status']);
    
    data.forEach(sale => {
        worksheet.addRow([
            sale.id,
            sale.fullName,
            sale.quantity,
            sale.totalPrice,
            sale.orderedAt,
            sale.orderStatus
        ]);
    });
    
    res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
        'Content-Disposition',
        'attachment; filename="SalesReport.xlsx"'
    );

    await workbook.xlsx.write(res);
    res.end();
};
const saleChart = async (req, res) => {
    try {
        const { filter } = req.query;
        let start, end;

        const currentDate = new Date();
        switch (filter) {
            case "weekly":
                const dayOfWeek = currentDate.getDay();
                start = new Date(currentDate);
                start.setDate(currentDate.getDate() - dayOfWeek);
                start.setHours(0, 0, 0, 0);

                end = new Date(currentDate);
                end.setHours(23, 59, 59, 999);
                break;

            case "monthly":
                start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
                end = new Date(currentDate);
                end.setHours(23, 59, 59, 999);
                break;

            case "yearly":
                start = new Date(currentDate.getFullYear(), 0, 1);
                end = new Date(currentDate);
                end.setHours(23, 59, 59, 999);
                break;
        }

        const matchQuery = { orderedAt: { $gte: start, $lte: end }, orderStatus: "Delivered" };
        const reportData = await Order.find(matchQuery);
        const aggregatedData = reportData.reduce((acc, curr) => {
            let label;
            if (filter === "weekly") {
                label = curr.orderedAt.toLocaleString('en-us', { weekday: 'long' });
            } else if (filter === "monthly") {
                label = curr.orderedAt.toLocaleString('en-us', { month: 'long' });
            } else if (filter === "yearly") {
                label = curr.orderedAt.toLocaleString('en-us', { month: 'short', year: 'numeric' });
            }

            const existingLabel = acc.find(item => item.label === label);
            if (existingLabel) {
                existingLabel.total += curr.totalPrice;
            } else {
                acc.push({ label: label, total: curr.totalPrice });
            }
            return acc;
        }, []);

        res.status(200).json(aggregatedData);

    } catch (error) {
        console.error("Error generating sales chart data:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
const topProducts = async (req, res) => {
    try {
        
        const topProducts = await Order.aggregate([
            { $match: { orderStatus: "Delivered" } },
            { $unwind: "$products" },
            { 
                $group: {
                    _id: "$products.productId",
                    totalSold: { $sum: "$products.quantity" }
                }
            },
            { $sort: { totalSold: -1 } },
            { $limit: 10 }
        ]);

        const productIds = topProducts.map(item => item._id);

        const products = await Product.find({ '_id': { $in: productIds } }).select('name _id');

        const populatedProducts = topProducts.map(product => {
            const productData = products.find(p => p._id.toString() === product._id.toString());
            return {
                label: productData ? productData.name : 'Unknown Product',
                total: product.totalSold
            };
        });

        res.status(200).json(populatedProducts);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "An error occurred" });
    }
};
const topCategories = async (req, res) => {
    try {
        const categories = await Order.aggregate([
            {$match : {orderStatus : "Delivered"}},
            { $unwind: "$products" },
            {
                $lookup: {
                    from: "products",
                    localField: "products.productId",
                    foreignField: "_id",
                    as: "productDetails"
                }
            },
            { $unwind: "$productDetails" },
            {
                $group: {
                    _id: "$productDetails.category",
                    total: { $sum: "$products.quantity" }
                }
            },
            {
                $lookup: {
                    from: "categories",
                    localField: "_id",
                    foreignField: "_id",
                    as: "categoryDetails"
                }
            },
            { $unwind: "$categoryDetails" },
            { $sort: { total: -1 } },
            { $limit: 10 }
        ]);

        const formattedCategories = categories.map(cat => ({
            label: cat.categoryDetails.name,
            total: cat.total
        }));

        res.json(formattedCategories);
    } catch (error) {
        console.error("Error fetching top categories:", error);
        res.status(500).json({ error: "Server error" });
    }
};
const topBrands = async (req, res) => {
    try {
        const brands = await Order.aggregate([
            {$match : {orderStatus : "Delivered"}},
            { $unwind: "$products" }, 
            {
                $lookup: {
                    from: "products", 
                    localField: "products.productId",
                    foreignField: "_id",
                    as: "productDetails"
                }
            },
            { $unwind: "$productDetails" }, 
            {
                $group: {
                    _id: "$productDetails.brands",
                    total: { $sum: "$products.quantity" } 
                }
            },
            {
                $lookup: {
                    from: "brands",
                    localField: "_id",
                    foreignField: "_id",
                    as: "brandDetails"
                }
            },
            { $unwind: "$brandDetails" },
            { $sort: { total: -1 } },
            { $limit: 10 }
        ]);

        const formattedBrands = brands.map(brand => ({
            label: brand.brandDetails.name,
            total: brand.total
        }));

        res.json(formattedBrands);
    } catch (error) {
        console.error("Error fetching top brands:", error);
        res.status(500).json({ error: "Server error" });
    }
};
const logout = async (req,res)=>{
    try {
        req.session.adminLogin = null
        res.redirect("/admin");
    } catch (error) {
        consoel.error(error);
    }
}


module.exports = {
    loadDashboard,
    loadSalesReport,
    generateRreport,
    downloadExcel,
    saleChart,
    topProducts,
    topCategories,
    topBrands,
    logout
}