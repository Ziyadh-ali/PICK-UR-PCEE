const User = require("../../model/userModel");
const bcrypt = require("bcrypt");

const adminLogin = async (req, res) => {
    try {
        res.render("adminLogin");
    } catch (error) {
        console.error(error);
    }
}
const verifyAdmin = async (req, res) => {
    try {
        const adminCheck = await User.findOne({ email: req.body.email });
        if(adminCheck){
            if(adminCheck.isAdmin ===  true){
                const passwordMatch = await bcrypt.compare(req.body.password, adminCheck.password);
            if (
                adminCheck.email === req.body.email &&
                passwordMatch === true
            ) {
                req.session.adminLogin = true;
                return res.status(200).json({
                    success:true
                });
            } else {
                return res.status(200).json({
                    success:false,
                    message:"Invalid Email or Password"
                });
            }
            }else{
                return res.status(200).json({
                    success:false,
                    message:"You are not an admin"
                });
            }
        }else{
            return res.status(200).json({
                success:false,
                message:"No user found"
            });
        }
    } catch (error) {
        console.error(error);
    }
}

module.exports = {
    adminLogin,
    verifyAdmin
}