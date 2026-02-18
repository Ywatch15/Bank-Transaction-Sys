const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema({
    email:{
        type:String,
        required:[true,"Email is required."],
        trim:true,
        lowercase:true,
        unique:[true,"Email already exists."],
        match:[/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, "Please provide a valid email address."]
    },
    name:{
        type:String,
        required:[true,"Name is required."],
        trim:true
    },
    password:{
        type:String,
        required:[true,"Password is required."],
        minlength:[6,"Password must be at least 6 characters long."],
        select:false
    }
},{
    timestamps:true
})

userSchema.pre("save", async function(){
    if(!this.isModified("password")){
        return;
    }
    const hash = await bcrypt.hash(this.password,10);
    this.password = hash;
    return;
})


userSchema.methods.comparePassword = async function(candidatePassword){
    return await bcrypt.compare(candidatePassword,this.password);
}


const userModel = mongoose.model("user",userSchema);

module.exports = userModel;