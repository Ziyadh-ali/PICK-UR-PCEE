const isLogin = async (req,res,next)=>{
    try{
        if(req.session.userLogin){
            next();
        }else{
            req.flash("success_message","You needed to be login to use this Function")
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