const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const randomstring = require("randomstring");
const crypto = require('crypto');

const hashPassword = async (password) => {
    try {
        const pass = await bcrypt.hash(password, 10);
        return pass;
    } catch (err) {
        console.error(err);
    }
};
const landingPage = async (req, res) => {
    try {
        res.render("landing");
    } catch (error) {
        console.error(error);
    }
};
const loginPage = async (req, res) => {
    try {
        res.render("login");
    } catch (error) {
        console.error(error);
    }
};
const signupPage = async (req, res) => {
    try {
        res.render("signup");
    } catch (error) {
        console.error(error);
    }
};
const verifyLogin = async (req, res) => {
    try {
        const userCheck = await User.findOne({ email: req.body.email }).select("+password");
        if (userCheck) {
            if (!userCheck.isBlocked) {
                const passwordMatch = await bcrypt.compare(req.body.password, userCheck.password);
                if (
                    userCheck.email === req.body.email &&
                    passwordMatch === true
                ) {
                    req.session.userLogin = userCheck._id;
                    return res.status(200).json({
                        success: true
                    });
                } else {
                    return res.status(200).json({
                        success: false,
                        message: "Invalid Email or Password"
                    });
                }
            } else {
                return res.status(200).json({
                    success: false,
                    message: "Your Blocked by the admin, Please contact the customer care"
                });
            }

        } else {
            return res.status(200).json({
                success: false,
                message: "User not find please register"
            });
        }
    } catch (error) {
        console.error(error);
    }
};
const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
        user: 'pickurpcee@gmail.com',
        pass: 'mkin ooqi woeg vvij'
    }
});
const userInsert = async (req, res) => {
    try {
        const isEmailExists = await User.findOne({ email: req.body.email });
        if (isEmailExists) {
            return res.status(200).json({
                success: false,
                message: "Email already exists"
            });
        } else {
            const hashedPassword = await hashPassword(req.body.password);
            const user = {
                firstName: req.body.firstName,
                lastName: req.body.lastName,
                email: req.body.email,
                mobile: req.body.mobile,
                password: hashedPassword,

                isAdmin: false
            };
            req.session.tempUser = user;

            const otp = randomstring.generate({
                length: 6,
                charset: "numeric"
            });
            console.log("otp" , otp)
            req.session.otp = otp
            req.session.timeLimit = Date.now() + 120000;
            transporter.sendMail({
                to: req.body.email,
                subject: "otp",
                text: `Otp for verification : ${otp}`
            });
            return res.status(200).json({ success: true });
        }

    } catch (error) {
        console.error(error);
    }
};
const resendOtp = async (req, res) => {
    try {
        const user = req.session.tempUser;
        if (!user) {
            return res.status(400).json({ success: false, message: "No user session found" });
        }

        const otp = randomstring.generate({
            length: 6,
            charset: "numeric"
        });
        req.session.otp = otp;
        req.session.timeLimit = Date.now() + 120000;

        await transporter.sendMail({
            to: user.email, 
            subject: "Resend OTP",
            text: `Your new OTP is: ${otp}`
        });
        return res.status(200).json({ success: true, message: "OTP resent successfully" });
    } catch (error) {
        console.error("Error resending OTP:", error);
        return res.status(500).json({ success: false, message: "Error resending OTP" });
    }
};
const loadForgotPass = async (req, res) => {
    try {
        res.render("forgotPassword")
    } catch (error) {
        console.error(error)
    }
};
const forgetPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(200).json({ success: false, message: 'No user found' });
        }
        const resetToken = crypto.randomBytes(32).toString('hex');
        const tokenExpiry = Date.now() + 120000;

        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = tokenExpiry;
        await user.save();

        const resetUrl = `http://localhost:3000/resetPassword?token=${resetToken}`;

        const mailOptions = {
            to: user.email,
            subject: 'Password Reset',
            text: `You are receiving this because you have requested the reset of the password for your account.\n\n
        Please click on the following link, or paste it into your browser to complete the process:\n\n
        ${resetUrl}\n\n
        If you did not request this, please ignore this email and your password will remain unchanged.\n`
        };

        transporter.sendMail(mailOptions)
        res.status(200).json({ success: true });


    } catch (error) {
        console.error(error);
    }
};
const loadResetPassword = async (req, res) => {
    try {
        const token = req.query.token
        res.render("resetPassword", ({
            token
        }))
    } catch (error) {
        console.error(error)
    }
};
const resetPassword = async (req, res) => {
    try {
        const { token, newPassword, confirmPassword } = req.body;
        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(200).json({ success: false, message: 'Invalid or expired token' });
        }
        if (newPassword !== confirmPassword) {
            return res.status(200).json({ success: false, message: 'Passwords do not match' });
        }
        const hashedPassword = await hashPassword(newPassword);
        user.password = hashedPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();
        res.status(200).json({ success: true });



    } catch (error) {
        console.error(error)
    }
};
const loadOtp = async (req, res) => {
    try {
        const user = req.session.timeLimit
        res.render("otpPage", ({
            user
        }));
    } catch (error) {
        console.error(error);
    }
};
const verifyOtp = async (req, res) => {
    try {
        const { otp1, otp2, otp3, otp4, otp5, otp6 } = req.body;
        const otpInput = `${otp1}${otp2}${otp3}${otp4}${otp5}${otp6}`;

        // Check if the OTP has expired
        if (Date.now() > req.session.timeLimit) {
            req.session.otp = null;
            return res.status(400).json({
                success: false,
                message: "The OTP has expired. Please request a new one."
            });
        }

        // Validate the OTP
        if (otpInput === req.session.otp) {
            const userDetails = new User(req.session.tempUser);

            // Save user details to the database
            await userDetails.save();

            // Clear session data after successful OTP verification
            req.session.otp = null;
            req.session.tempUser = null;

            return res.status(200).json({
                success: true,
                message: "OTP verified successfully. Registration complete."
            });
        } else {
            return res.status(400).json({
                success: false,
                message: "Invalid OTP. Please try again."
            });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "An error occurred during OTP verification. Please try again."
        });
    }
};

module.exports = {
    landingPage,
    loginPage,
    signupPage,
    verifyLogin,
    userInsert,
    loadOtp,
    verifyOtp,
    resendOtp,
    loadResetPassword,
    resetPassword,
    loadForgotPass,
    forgetPassword
}