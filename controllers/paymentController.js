const paypal = require("paypal-rest-sdk");
const axios = require("axios");
const Coupon = require("../model/couponModel")
const Order = require("../model/orderModel");
const Cart = require("../model/cartModel");
const Product = require("../model/productModel");

const {PAYPAL_MODE, PAYPAL_CLIENT_ID , PAYPAL_CLIENT_SECRET} = process.env;

paypal.configure({
    'mode' : PAYPAL_MODE,
    'client_id' : PAYPAL_CLIENT_ID,
    'client_secret' : PAYPAL_CLIENT_SECRET
})

const convertCurrency = async (amountInINR) => {
    try {
      const response = await axios.get(
        "https://v6.exchangerate-api.com/v6/6765974cc9b55eda11675fa9/latest/INR"
      );
  
      const conversionRate = response.data.conversion_rates.USD;
      const amountInUSD = (amountInINR * conversionRate).toFixed(2);
      return amountInUSD;
    } catch (error) {
      console.error("Currency conversion error:", error.message);
      return null;
    }
  };

  const payWithPaypal = async (req, res) => {
    try {
      req.session.payment = req.body;
      const totalPrice = req.body.totalPrice;
      let total = await convertCurrency(totalPrice);
  
      const create_payment_json = {
        intent: "sale",
        payer: {
          payment_method: "paypal",
        },
        redirect_urls: {
          return_url: "http://localhost:3000/checkout/paymentSuccess",
          cancel_url: "http://localhost:3000/checkout/paymentFailed",
        },
        transactions: [
          {
            amount: {
              currency: "USD",
              total: total,
            },
          },
        ],
      };
      paypal.payment.create(create_payment_json, function (error, payment) {
        if (error) {
          console.error("Payment creation error:", error);
           res
            .status(500)
            .json({ success: false, message: "Payment creation failed" });
        } else {
          for (let i = 0; i < payment.links.length; i++) {
            if (payment.links[i].rel === "approval_url") {
              return res.json({
                success: true,
                redirectUrl: payment.links[i].href,
              });
            }
          }
          res.status(400).json({
            success: false,
            message: "Approval URL not found in PayPal response",
          });
        }
      });
    } catch (error) {
      console.error("payWithPaypal:", error.message);
    }
  };

  const paymentSuccess = async (req, res) => {
    try {
        const { paymentMethod, totalPrice, address } = req.session.payment;
        const { paymentId, PayerID, token } = req.query;
  
        const userId = req.session.userLogin
        const coupon = req.session.coupon;
        
        const cart = await Cart.findOne({ userId });
        let fullPrice = 0;
        cart.products.forEach(item => {
            let productPrice
            if(item.productId.offerPrice){
                 productPrice = item.productId.offerPrice;
            }else{
                 productPrice = item.productId.price;
            }
            
            const quantity = item.quantity;
            fullPrice += productPrice * quantity;
        });
        if (coupon) {
            var coupons = await Coupon.findById(coupon._id)
            couponCode = coupon.code;
            discountValue = fullPrice - cart.totalPrice;
        }
  
      const newOrder = new Order({
        userId: userId,
        selectedAddress: {
            fullName: address.fullName,
            addressType: address.addressType,
            address: address.address,
            city: address.city,
            state: address.state,
            mobile: address.mobile,
            pincode: address.pincode,
            altMobile: address.altMobile
        },
        ...(coupon ? { couponCode, discountValue } : {}),
        products: cart.products,
        totalPrice: cart.totalPrice,
        paymentMethod: paymentMethod,
        paymentId: paymentId,
        paymentStatus: "Completed",
        orderStatus: "Processing",
      });
  
      const savedOrder = await newOrder.save();
        if (savedOrder) {
            await Cart.findByIdAndDelete({ _id: cart._id });
            for (const product of cart.products) {
                await Product.updateOne(
                    { _id: product.productId._id },
                    { $inc: { stock: -(product.quantity) } }
                );
                if(coupon){
                    coupons.usedCount += 1
                    coupons.save();
                }
                req.session.coupon = ""
            }
            res.redirect("/orderSuccess") 
        }
      
    } catch (error) {
      console.error("paymentSuccess:",error.message);
    }
  };
  
  const paymentCancel = async (req, res) => {
    try {
        const { paymentMethod, totalPrice, address } = req.session.payment;
        const { paymentId, PayerID, token } = req.query;
  
        const userId = req.session.userLogin
        const coupon = req.session.coupon;
        
        const cart = await Cart.findOne({ userId });
        let fullPrice = 0;
        cart.products.forEach(item => {
            let productPrice
            if(item.productId.offerPrice){
                 productPrice = item.productId.offerPrice;
            }else{
                 productPrice = item.productId.price;
            }
            
            const quantity = item.quantity;
            fullPrice += productPrice * quantity;
        });
        if (coupon) {
            var coupons = await Coupon.findById(coupon._id)
            couponCode = coupon.code;
            discountValue = fullPrice - cart.totalPrice;
        }
  
      const newOrder = new Order({
        userId: userId,
        selectedAddress: {
            fullName: address.fullName,
            addressType: address.addressType,
            address: address.address,
            city: address.city,
            state: address.state,
            mobile: address.mobile,
            pincode: address.pincode,
            altMobile: address.altMobile
        },
        ...(coupon ? { couponCode, discountValue } : {}),
        products: cart.products,
        totalPrice: cart.totalPrice,
        paymentMethod: paymentMethod,
        paymentId: paymentId,
        paymentStatus: "Failed",
        orderStatus: "Failed",
      });
  
      const savedOrder = await newOrder.save();
        if (savedOrder) {
            await Cart.findByIdAndDelete({ _id: cart._id });
            for (const product of cart.products) {
                await Product.updateOne(
                    { _id: product.productId._id },
                    { $inc: { stock: -(product.quantity) } }
                );
                if(coupon){
                    coupons.usedCount += 1
                    coupons.save();
                }
                req.session.coupon = ""
            }
            res.redirect("/orderSuccess") 
        }
      
    } catch (error) {
        console.error("paymentCancel:",error.message);
    }
  }
  //pay from order
  const payFromOrder = async (req, res) => {
    try {
      req.session.orderId = req.body.orderId
      const order = await Order.findById(req.session.orderId)
      const totalPrice = order.totalPrice;
      let total = await convertCurrency(totalPrice);    
  
      const create_payment_json = {
        intent: "sale",
        payer: {
          payment_method: "paypal",
        },
        redirect_urls: {
          return_url: "http://localhost:3000/order/paymentSuccess",
          cancel_url: "http://localhost:3000/order/paymentFailed",
        },
        transactions: [
          {
            amount: {
              currency: "USD",
              total: total,
            },
          },
        ],
      };
      paypal.payment.create(create_payment_json, function (error, payment) {
        if (error) {
          console.error("Payment creation error:", error);
           res
            .status(500)
            .json({ success: false, message: "Payment creation failed" });
        } else {
          for (let i = 0; i < payment.links.length; i++) {
            if (payment.links[i].rel === "approval_url") {
              return res.json({
                success: true,
                redirectUrl: payment.links[i].href,
              });
            }
          }
          res.status(400).json({
            success: false,
            message: "Approval URL not found in PayPal response",
          });
        }
      });
    } catch (error) {
      console.error("payWithPaypal:", error.message);
    }
  };

  const orderPaymentSuccess = async (req, res) => {
    try {
        const orderId = req.session.orderId
        const statusChange = await Order.findByIdAndUpdate(orderId,({
            paymentStatus : "Completed",
            orderStatus : "Processing"
        }));
        if(statusChange){
            res.redirect(`/order/orderDetails/${orderId}`)
        }
    } catch (error) {
      console.error("paymentSuccess:",error.message);
    }
  };
  
  const orderPaymentCancel = async (req, res) => {
    try {
        const orderId = req.session.orderId
        res.redirect(`/order/orderDetails/${orderId}`)
    } catch (error) {
        console.error("paymentCancel:",error.message);
    }
  }

  
  module.exports = {
    payWithPaypal,
    paymentSuccess,
    paymentCancel,
    payFromOrder,
    orderPaymentSuccess,
    orderPaymentCancel,
  };