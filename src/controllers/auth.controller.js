const userModel = require("../models/user.model");
const jwt = require("jsonwebtoken")

/* 
Register controller for
POST api ... /api/auth/register
*/

async function userRegisterController(req,res){
    const {email, password, name} = req.body;

    // Check user exists from email
    const isExists = await userModel.findOne({
        email:email
    })

    if(isExists){
        return res.status(422).json({
            message:"User already exists with email",
            status:"failed"
        })
    }

    const user = await userModel.create({
        email, password, name
    })

    // Longer the key, more is safety and more is computation power
    const token = jwt.sign({userId: user._id,}, process.env.JWT_SECRET, {expiresIn:"30d"})

    res.cookie("token", token)

    res.status(201).json({
        user:{
            _id:user._id,
            email:user.email,
            name:user.name
        },
        token
    })
}

/* 
Login controller for
POST api ... /api/auth/login
*/

async function userLoginController(req,res){
    const{email,password}= req.body;
    // .select added to make sure password is also read
    const user = await userModel.findOne({email}).select("+password")

    if(!user){
        return res.status(401).json({
            message:"Email or password is invalid"
        })
    }

    const isValidPassword = await user.comparePassword(password)

    if(!isValidPassword){
        return res.status(401).json({
            message:"Email or password is invalid"
        })
    }

    const token = jwt.sign({userId: user._id}, process.env.JWT_SECRET, {expiresIn:"30d"})

    res.cookie("token", token)

    res.status(200).json({
        user:{
            _id:user._id,
            email:user.email,
            // name:user.name
        },
        token
    })
}


module.exports = {
    userRegisterController,
    userLoginController
}