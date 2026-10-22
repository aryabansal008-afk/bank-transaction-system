const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
    email:{
        type:String,
        required:[true,"Email is requird for creating a user"],
        trim:true,
        lowercase:true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address'],
        unique:[true,"Email already exists"]
    },
    name:{
        type:String,
        required:[true, "Name is requird for creating an account"]
    },
    password:{
        type:String,
        required:[true,"Password is required for creating an account"],
        minlength:[6,"Atleast contain 6 characters"],
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

userSchema.methods.comparePassword = async function(password){
    console.log(password, this.password) // We can check which password is being passed or not passed, helps to solve errors
    return await bcrypt.compare(password, this.password)
}

const userModel = mongoose.model("user",userSchema)

module.exports = userModel