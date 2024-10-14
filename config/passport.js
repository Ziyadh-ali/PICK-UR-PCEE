const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../model/userModel");
const env = require("dotenv").config();


passport.use(new GoogleStrategy({
    clientID : process.env.GOOGLE_CLIENT_ID,
    clientSecret : process.env.GOOGLE_CLIENT_SECRET,
    callbackURL : process.env.GOOGLE_CLIENT_URL
},
async (accessToken,refreshToken,profile,done)=>{
    try{
        if (!profile.id) {
            return done(new Error('Google ID not available'), null);
        }
        let user = await User.findOne({googleId:profile.id});
        if(user){
            return done(null,user);
        }else{
            user = new User({
                firstName : profile._json.given_name,
                lastName : profile._json.family_name,
                email:profile._json.email,
                googleId : profile.id
            });
            await user.save();
            return done(null,user);
        }
    }catch(error){
        return done(error,null);
    }
}
));

passport.serializeUser((user,done)=>{
    done(null,user.id)
});

passport.deserializeUser((id,done)=>{
    User.findById(id)
    .then(user=>{
        done(null,user)
    })
    .catch(error=>{
        done(error,null)
    })
});


module.exports = passport