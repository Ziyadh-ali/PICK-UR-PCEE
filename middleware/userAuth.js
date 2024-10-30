const User = require("../model/userModel");


const isLogin = async (req,res,next)=>{
    try{
        const userId = req.session.userLogin
        if(userId){
            const user = await User.findById(userId);
            if(!user.isBlocked){
                next()
            }else{
                req.session.userLogin = null
                req.flash("error_message","You have been blocked")
                res.redirect("/login");
            }
            
        }else{
            req.flash("error_message","You needed to be login to use this Function")
            res.redirect("/login");
        }
    }catch(error){
        console.error(error);
    }
}
const isLogout = async (req,res,next)=>{
    try{
        if(req.session.userLogin){
            res.redirect("/")
        }else{
            next();
        }
    }catch(error){
        console.error(error)
    }
}

module.exports = {
    isLogin,
    isLogout
}