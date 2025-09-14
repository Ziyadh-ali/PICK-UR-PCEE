const Category = require("../../model/categoryModel");


const addCategory = async (req, res) => {
    try {
        const { name, description } = req.body;
        const isCategoryExists = await Category.findOne({ name: req.body.name.trim() });

        if (!isCategoryExists) {
            const category = new Category({
                name: name,
                description: description
            });
            await category.save();
            req.flash("right_message", "Category added successfully!");
            res.redirect("/admin/categories");
        } else {
            req.flash("err_message", "Category already exists");
            res.redirect("/admin/categories");
        }
    } catch (error) {
        console.error(error);
        req.flash("err_message", "An error occurred while adding the category");
        res.redirect("/admin/categories");
    }
};


const loadCategory = async (req, res) => {
    try {
        const perPage = 5;
        const page = parseInt(req.query.page) || 1;
        const search = req.query.search || "";
        const statusFilter = req.query.status || "all";

        let query = {};
        if (search) {
            query.name = { $regex: search, $options: "i" };
        }
        if (statusFilter !== "all") {
            query.status = statusFilter === "active";
        }

        const totalCategories = await Category.countDocuments(query);

        const Categories = await Category.find(query)
            .skip((page - 1) * perPage)
            .limit(perPage);

        res.render("categories", {
            Categories,
            currentPage: page,
            totalPages: Math.ceil(totalCategories / perPage),
            search,
            statusFilter,
        });
    } catch (error) {
        console.error(error);
    }
};


const listCategory = async (req, res) => {
    try {
        const id = req.params.id;
        const list = await Category.findByIdAndUpdate(id, { status: true });
        res.redirect("/admin/categories");
    } catch (error) {
        console.error(error);
    }
}
const unlistCategory = async (req, res) => {
    try {
        const id = req.params.id;
        const list = await Category.findByIdAndUpdate(id, { status: false });
        res.redirect("/admin/categories");
    } catch (error) {
        console.error(error);
    }
}
const loadEditCategory = async (req, res) => {
    try {
        const id = req.params.id;
        const Categories = await Category.findById(id);
        res.render("editCategories", ({ Categories }));
    } catch (error) {
        console.error(error);
    }
}
const editCategory = async (req, res) => {
    try {
        const id = req.params.id;
        const Categories = await Category.findById(id);
        let nameChanged = false;
        let descriptionChanged = false;
        if (req.body.name !== Categories.name) {
            nameChanged = true
        }
        if (req.body.description !== Categories.description) {
            descriptionChanged = true
        }
        let nameExists
        if (nameChanged) {
            nameExists = await Category.findOne({ name: req.body.name });
            if (nameExists) {
                return (req.flash("err_message", "Category already exists"), res.redirect(`/admin/categories/edit/${req.params.id}`))
            }

        }
        if ((nameChanged || descriptionChanged)) {
            const edit = await Category.findByIdAndUpdate(id, { name: req.body.name, description: req.body.description });
            req.flash("right_message", "Edit successfull");
            res.redirect("/admin/categories");
        } else {
            res.redirect("/admin/categories");
        }

    } catch (error) {
        console.error(error);
    }
}

module.exports = {
    addCategory,
    loadCategory,
    listCategory,
    unlistCategory,
    loadEditCategory,
    editCategory
}