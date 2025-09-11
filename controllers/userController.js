const User = require("../model/userModel");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const randomstring = require("randomstring");
const Category = require("../model/categoryModel");
const Brand = require("../model/brandsModel");
const Product = require("../model/productModel");
const Cart = require("../model/cartModel");
const Address = require("../model/addressModel");
const Order = require("../model/orderModel");
const Offer = require("../model/offerModel")
const PDFDocument = require('pdfkit');
const crypto = require('crypto');
const fs = require('fs');
const path = require("path");
const Wishlist = require("../model/wishlistModel");
const Coupon = require("../model/couponModel");
const Wallet = require("../model/walletModel");

const invoiceDownload = async (req,res)=>{
    try {
        const orderId = req.params.orderId;

        const order = await Order.findById(orderId).populate('products.productId');
    
        if (!order) {
            return res.status(404).send("Order not found");
        }
    
        const invoicesDir = path.join(__dirname, 'invoices');
        const pdfPath = path.join(invoicesDir, `${orderId}_invoice.pdf`);
    
        if (!fs.existsSync(invoicesDir)) {
            fs.mkdirSync(invoicesDir, { recursive: true });
        }
    
        const doc = new PDFDocument();
        const writeStream = fs.createWriteStream(pdfPath);
        doc.pipe(writeStream);
    
        doc.fontSize(18).text('Invoice', { align: 'center' });
        doc.fontSize(14).text(`Order ID: ${order._id}`);
        doc.text(`Order Date: ${new Date(order.orderedAt).toDateString()}`);
        doc.text(`Total Amount:  ${order.totalPrice}`);
        doc.text(`Payment Method:  ${order.paymentMethod}`);
        doc.text(`Payment Status:  ${order.paymentStatus}`);
        if (order.couponCode) {
            doc.text(`Coupon Code: ${order.couponCode}`);
            doc.text(`Discount: ₹${order.discountValue}`);
        }
    
        doc.moveDown().text('Items:', { underline: true });
    
        order.products.forEach(product => {
            doc.moveDown();
            doc.text(`Product: ${product.productId.name}`);
            doc.text(`Quantity: ${product.quantity}`);
            const price = product.productId.offerId ? (product.price - product.productId.offerPrice) : product.price;
            doc.text(`Price: ${price}`);
            doc.text(`Subtotal: ${price * product.quantity}`);
        });
    
        doc.end();
    
        writeStream.on('finish', () => {
            res.download(pdfPath, `${orderId}_invoice.pdf`, (err) => {
                if (err) {
                    console.error('Error downloading file:', err);
                    return res.status(500).send("Could not download the file");
                }
    
                fs.unlink(pdfPath, (unlinkErr) => {
                    if (unlinkErr) console.error('Error deleting file:', unlinkErr);
                });
            });
        });
    
        writeStream.on('error', (err) => {
            console.error('Error writing PDF file:', err);
            res.status(500).send("Error generating PDF");
        });

    } catch (error) {
        console.error(error)
    }
};
//Logout//
const logout = async (req, res) => {
    try {
        req.session.userLogin = null
        res.redirect("/login");
    } catch (error) {
        console.error(error);
    }
}

module.exports = {
    invoiceDownload,
    logout
}