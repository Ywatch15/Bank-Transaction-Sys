const userModel = require("../models/user.model"); 
const jwt = require("jsonwebtoken");
const tokenBlackListModel = require("../models/blackList.model");



async function authMiddleware(req,res,next){
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

    if(!token){
        return res.status(401).json({
            success:false,
            message:"Unauthorized. No token provided."
        })
    }

    const isBlackListed = await tokenBlackListModel.findOne({token});

    if(isBlackListed){
        return res.status(401).json({
            message: "Unauthorized access, token is invalid"
        })
    }

    try{
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await userModel.findById(decoded.userId);

        req.user=user
        return next();
    }catch(err){
        return res.status(401).json({
            message:"Unauthorized. Invalid token."
        })
    }
}

async function authSystemUserMiddleware(req,res,next){
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

    if(!token){
        return res.status(401).json({
            success:false,
            message:"Unauthorized. No token provided."
        })
    }

    const isBlackListed = await tokenBlackListModel.findOne({token});

    if(isBlackListed){
        return res.status(401).json({
            message: "Unauthorized access, token is invalid"
        })
    }

    try{
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await userModel.findById(decoded.userId).select("+systemUser");
        if(!user.systemUser){
            return res.status(403).json({
                success:false,
                message:"Forbidden access. User is not a system user."
            })
        }
        req.user=user;
        return next();
    }catch(err){
        return res.status(401).json({
            success:false,
            message:"Unauthorized. Invalid token."
        })
    }
}

/**
 * authAdminMiddleware
 * Extends authMiddleware: also requires req.user.isAdmin === true.
 * Used exclusively by /api/admin/* routes.
 */
async function authAdminMiddleware(req, res, next) {
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

    if (!token) {
        return res.status(401).json({ success: false, message: "Unauthorized. No token provided." });
    }

    const isBlackListed = await tokenBlackListModel.findOne({ token });
    if (isBlackListed) {
        return res.status(401).json({ message: "Unauthorized access, token is invalid" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // Explicitly select isAdmin — field has select:false
        const user = await userModel.findById(decoded.userId).select("+isAdmin");

        if (!user || !user.isAdmin) {
            return res.status(403).json({
                success: false,
                message: "Forbidden. Admin privileges required."
            });
        }

        req.user = user;
        return next();
    } catch (err) {
        return res.status(401).json({ success: false, message: "Unauthorized. Invalid token." });
    }
}

module.exports={
    authMiddleware,
    authSystemUserMiddleware,
    authAdminMiddleware
}