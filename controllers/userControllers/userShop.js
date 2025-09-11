const Category = require("../../model/categoryModel");
const Brand = require("../../model/brandsModel");
const Product = require("../../model/productModel");
const Wishlist = require("../../model/wishlistModel");

const userHome = async (req, res) => {
    try {
        const Products = await Product.find({isActive : true}).populate("category");
        const user = req.session.userLogin
        const wishlist = await Wishlist.findOne({ userId: user });

        res.render("home", ({
            user,
            Products,
            wishlist,
        }));
    } catch (error) {
        console.error(error);
    }
}

const loadShop = async (req, res) => {
    try {
        const user = req.session.userLogin;
        const wishlist = await Wishlist.findOne({ userId: user });
        const page = 1

        const limit = 6;
        const skip = (page - 1) * limit;

        const totalProductCount = await Product.countDocuments();
        const totalPages = Math.ceil(totalProductCount / limit);

        const productDetails = await Product.find({isActive : true})
            .populate('category')
            .skip(skip)
            .limit(limit)



        const Brands = await Brand.find({ status: true });
        const Categories = await Category.find({ status: true });
        const currentPage = 1
        res.render("shop", {
            Products: productDetails,
            user,
            Brands,
            Categories,
            currentPage,
            totalPages,
            wishlist
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
}

const getSortFilterSearchData = async (req, res) => {

    let { page = 1, selectedCategories = [], selectedBrands = [], searchTerm = '', sortOption } = req.query;

    page = parseInt(page);

    const limit = 6;
    const skip = (page - 1) * limit;

    const filter = {isActive : true};

    if (Array.isArray(selectedBrands) && selectedBrands.length > 0) {
        const brandIds = await Brand.find({
            name: { $in: selectedBrands },
        }).distinct("_id");
        filter.brands = { $in: brandIds };
    }

    if (Array.isArray(selectedCategories) && selectedCategories.length > 0) {
        const categoryIds = await Category.find({
            name: { $in: selectedCategories },
        }).distinct("_id");
        filter.category = { $in: categoryIds };
    }

    if (searchTerm) {
        filter.name = { $regex: new RegExp(`${searchTerm}`, "i") };
    }


    const totalProductCount = await Product.countDocuments({filter});
    const totalPages = Math.ceil(totalProductCount / limit);

    const sortBy = {};
    switch (sortOption) {
        case "priceLowHigh":
            sortBy.price = 1;
            break;
        case "priceHighLow":
            sortBy.price = -1;
            break;
        case "a-z":
            sortBy.name = 1;
            break;
        case "z-a":
            sortBy.name = -1;
            break;
        case "latest":
            sortBy.createdAt = -1;
            break;
        default:
            sortBy.createdAt = -1;
            break;
    }

    const productDetails = await Product.find(filter)
        .populate('category')
        .sort(sortBy)
        .skip(skip)
        .limit(limit);

    res.json({
        Products: productDetails,
        currentPage: page,
        totalPages: totalPages
    });
}

const sortShop = async (req, res) => {
    try {

    } catch (error) {
        console.error(error)
    }
}


const productDetails = async (req, res) => {
    try {
        const user = req.session.userLogin
        const wishlist = await Wishlist.findOne({ userId: user });
        const id = req.params.id;
        const Products = await Product.findOne({_id : id , isActive : true}).populate("category").populate("brands").populate("offerId");
        const relatedProducts = await Product.find({ isActive : true,category: Products.category }).populate("category").populate("brands").limit(8);
        res.render("productsDetails", ({
            Products,
            user,
            relatedProducts,
            wishlist
        }));
    } catch (error) {
        console.error(error);
    }
}

module.exports = {
    userHome,
    loadShop,
    getSortFilterSearchData,
    productDetails,
    sortShop
}