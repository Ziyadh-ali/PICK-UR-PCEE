const isLogin = async (req,res,next)=>{
    try{
        if(req.session.adminLogin){
            next();
        }else{
            res.redirect("/admin");
        }
    }catch(error){
        console.error(error);
    }
}
const isLogout = async (req,res,next)=>{
    try{
        if(req.session.adminLogin){
            res.redirect("/admin/dashboard")
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