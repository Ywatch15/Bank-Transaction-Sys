const mongoose = require('mongoose');

const tokenBlacklistSchema = new mongoose.Schema({
    token:{
        type:String,
        required: [true, "Token is required to blacklist."],
        unique: [true, "Token is already blacklisted."]
    }
},{
    timestamps:true
})


tokenBlacklistSchema.index({createdAt:1},{
    expiredAfterSeconds: 60*60*24*3 // TTL is for 3 days
})


const tokenBlackListModel = mongoose.model("tokenBlackList", tokenBlacklistSchema);

module.exports = tokenBlackListModel;