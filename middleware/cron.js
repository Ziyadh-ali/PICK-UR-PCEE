const cron = require('node-cron');
const Product = require('../model/productModel'); 
const Offer = require('../model/offerModel');

const offerCheck = () => {
    cron.schedule('0 0 * * *', async () => {
        try {
            const currentDate = new Date();
            const products = await Product.find({ offerId: { $ne: null } });

            for (let product of products) {
                const offer = await Offer.findById(product.offerId);

                if (offer && offer.expiryDate < currentDate) {
                    offer.isActive = false;
                    await offer.save();

                    product.offerId = null;
                    product.offerPrice = null;
                    await product.save();
                }
            }
            console.log("Expired offers have been removed from products.");
        } catch (error) {
            console.error("Error checking and removing expired offers:", error);
        }
    });
};

module.exports = offerCheck;
