const Brand = require("../../model/brandsModel");

const loadBrands = async (req, res) => {
    try {
        const Brands = await Brand.find({});
        res.render("brands",({Brands}));
    } catch (error) {
        console.error(error);
    }
}
const addBrands = async (req, res) => {
    try {
        const { name, description } = req.body;
        const isBrandExists = await Brand.findOne({ name: req.body.name.trim() });

        if (!isBrandExists) {
            const brand = new Brand({
                name: name,
                description: description
            });
            await brand.save();
            req.flash("right_message", "Brand added successfully!");
            res.redirect("/admin/brands");
        } else {
            req.flash("err_message", "Brand already exists");
            res.redirect("/admin/brands");
        }
    } catch (error) {
        console.error(error);
    }
}
const unlistBrand = async (req, res) => {
    try {
        const id = req.params.id;
        const list = await Brand.findByIdAndUpdate(id, { status: false });
        res.redirect("/admin/brands");
    } catch (error) {
        console.error(error);
    }
}
const listBrand = async (req, res) => {
    try {
        const id = req.params.id;
        const list = await Brand.findByIdAndUpdate(id, { status: true });
        res.redirect("/admin/brands");
    } catch (error) {
        console.error(error);
    }
}
const loadEditBrands = async (req, res) => {
    try {
        const id = req.params.id;
        const Brands = await Brand.findById(id);
        res.render("editBrands", ({ Brands }));
    } catch (error) {
        console.error(error);
    }
}
const editBrand = async (req, res) => {
    try {
        const id = req.params.id;
        const Brands = await Brand.findById(id);
        let nameChanged = false;
        let descriptionChanged = false;
        if (req.body.name !== Brands.name) {
            nameChanged = true
        }
        if (req.body.description !== Brands.description) {
            descriptionChanged = true
        }
        
        if (nameChanged) {
            const nameExists = await Brand.findOne({ name: req.body.name });
            if (nameExists) {
                req.flash("err_message", "Brand already exists");
                res.redirect(`/admin/brands/edit/${req.params.id}`);
            }
        }
        if (nameChanged || descriptionChanged) {
            const edit = await Brand.findByIdAndUpdate(id, { name: req.body.name , description:req.body.description});
            req.flash("right_message", "Edit successfull");
            res.redirect("/admin/brands");
        } else {
            res.redirect("/admin/brands");
        }

    } catch (error) {
        console.error(error);
    }
}

module.exports = {
    addBrands,
    loadBrands,
    listBrand,
    unlistBrand,
    loadEditBrands,
    editBrand
}