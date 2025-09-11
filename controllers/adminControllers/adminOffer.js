const Category = require("../../model/categoryModel");
const Brand = require("../../model/brandsModel");
const Product = require("../../model/productModel");
const Offer = require("../../model/offerModel");


const loadOffer = async (req,res)=>{
    try {
        const offers = await Offer.find().populate('brands').populate('categories')
        const Brands = await Brand.find({status : true});
        const Categories = await Category.find({status : true})
        res.render("offers",({
            offers,
            Brands,
            Categories,
        }));
    } catch (error) {
        console.error(error);
    }
}
const addOffer = async (req,res)=>{
    try {
        const data = req.body
        const offer = new Offer({
            offerName : data.offerName,
            discountType : data.discountType,
            discountValue : data.discountValue,
            minPurchaseValue : data.minSpend,
            maxPurchaseValue : data.maxDiscount,
            expiryDate : data.expiryDate,
            brands : data.brand ? data.brand : null,
            categories : data.category ? data.category : null,
        })

        const save = await offer.save();
        if(save){
            let query = {}
            if(data.brand && data.category ){
                query = {brands : data.brand , categories : data.category}
            }else if (data.brand){
                query = {brands : data.brand}
            }else if (data.category){
                query = {category : data.category}
            }
            const products = await Product.find(query);
            const currentDate = new Date();
            for(let product of products){
                let skipUpdate = false;
                if(product.offerId){
                    const existingOffer = await Offer.findById(product.offerId);
                    if(existingOffer){
                        const timeDifference = (new Date(existingOffer.expiryDate)-currentDate) / (1000 * 60 * 60 * 24);
                        
                        if(timeDifference >= 5) {
                            skipUpdate = true
                        }
                    }
                }
                if(!skipUpdate){
                    let newOfferPrice = 0;
                    if(offer.discountType === "percentage"){
                         newOfferPrice = (product.price * offer.discountValue / 100)
                    }else if (offer.discountType === "fixed"){
                        newOfferPrice = offer.discountValue
                    }

                    product.offerPrice = newOfferPrice
                    product.offerId = offer._id;
                    await product.save();
                }
            }
            res.status(200).json({success : true});
        }else{
            res.status(200).json({success : false});
        }
        
    } catch (error) {
        console.error(error);
    }
}
const offerRemove = async (req,res)=>{
    try {
        const {id} = req.params;
        const productsWithOffer = await Product.find({ offerId: id });
        for(let product of productsWithOffer){
            product.offerId = null
            product.offerPrice = null
            await product.save()
        }
        if(productsWithOffer){
            const remove = await Offer.findByIdAndUpdate(id,{isActive : false});
            res.status(200).json({success : true});
        }else{
            res.status(200).json({success : false});
        }
    } catch (error) {
        console.error(error)
    }
}

module.exports = {
    loadOffer,
    addOffer,
    offerRemove,
}