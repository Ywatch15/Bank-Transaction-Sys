const userModel = require("../models/user.model");
const accountModel = require("../models/account.model");
const jwt = require("jsonwebtoken");
const emailService = require("../services/email.service")
const tokenBlackListModel = require("../models/blackList.model");
const { validationResult } = require("express-validator");

/** Cookie options — secure in production, httpOnly always */
function cookieOptions() {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'strict' : 'lax',
    maxAge: 3 * 24 * 60 * 60 * 1000, // 3 days (matches JWT expiry)
  };
}


/**
 * - user register controller
 * - POST /api/auth/register
 */
async function userRegisterController(req,res){
    // Check express-validator results from route-level validators
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ success: false, errors: errors.array() });
    }

    const {email,name,password} = req.body;

    const isExists = await userModel.findOne({
        email:email
    })

    if(isExists){
        return res.status(422).json({
            success:false,
            message:"Email already exists."
        })
    }

    const user = await userModel.create({
        email, password, name
    })

    // Create a default INR account with ₹4000 starter balance for new users
    await accountModel.create({
        user: user._id,
        currency: "INR",
        balance: 4000,
        status: "ACTIVE",
    });

    const token = jwt.sign({
        userId:user._id,
        isAdmin: false
    }, process.env.JWT_SECRET, {expiresIn:"3d"});

    res.cookie("token", token, cookieOptions());

    res.status(201).json({
        user:{
            _id:user._id,
            email:user.email,
            name:user.name
        }, 
        token
    })


    await emailService.sendRegistrationEmail(user.email,user.name);
}


/**
 * - user login controller
 * - POST /api/auth/login
 */
async function userLoginController(req,res){
    // Check express-validator results
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ success: false, errors: errors.array() });
    }

    const {email,password} = req.body;
    const user = await userModel.findOne({email}).select("+password");

    if(!user){
        return res.status(401).json({
            message:"Invalid email or password.",
            
        })
    }

    const isValidPassword = await user.comparePassword(password);
    if(!isValidPassword){
        return res.status(401).json({
            message:"Invalid email or password."
        })
    }

    // Include isAdmin in JWT so the frontend can check without extra API calls
    const userWithAdmin = await userModel.findById(user._id).select("+isAdmin");
    const token = jwt.sign({
        userId:user._id,
        isAdmin: userWithAdmin?.isAdmin === true
    }, process.env.JWT_SECRET, {expiresIn:"3d"});

    res.cookie("token", token, cookieOptions());

    res.status(200).json({
        user:{
            _id:user._id,
            email:user.email,
            name:user.name
        },
        token
    })
}

/**
 * - User Logout Controller
 * - POST /api/auth/logout
 */
async function userLogoutController(req,res){
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

    if(!token){
        return res.status(200).json({
            message:"User is already logged out."
        })
    }

    
    await tokenBlackListModel.create({
        token: token
    });
    
    res.clearCookie("token","");
    
    res.status(200).json({
        message: "User logged out successfully."
    })
}

module.exports = {
    userRegisterController,
    userLoginController,
    userLogoutController
}