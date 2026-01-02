import mongoose, {Schema} from "mongoose";
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

const userSchema = new mongoose.Schema({
    username:{
        type:String,
        unique: true,
        required: true,
        lowercase:true,
        trim : true,
        index:true
    },
    fullname: {
        type: String,
        required: true,
        trim : true,
        index:true
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim : true,
    },
    avatar:{
        type:String, //url
        required: true
    },
    coverImage:{
        type:String, //url
    },
    watchHistory: [
        {
        type: Schema.Types.ObjectId,
        ref: "Video"
        }
    ],
    password:{
        type:String,
        required: [true,'password is required'],
    },
    refreshToken:{
        type: String,
    },
},{timestamps:true});

userSchema.pre('save',async function(next){
    if(!this.isModified('password')) 
        return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

userSchema.methods.comparePassword = async function(password){
    return await bcrypt.compare(password, this.password);
}

import dotenv from 'dotenv';
dotenv.config({
    path: './.env'
});

userSchema.methods.generateAccessToken = function(){
    return jwt.sign({
        _id: this._id,
        fullname: this.fullname,
        email: this.email,
        username: this.username
    }, process.env.JWT_ACCESS_SECRET_KEY, {expiresIn: process.env.ACCESS_TOKEN_EXPIRES});
}

userSchema.methods.generateRefreshToken = function(){
    return jwt.sign({
        _id: this._id
    }, process.env.JWT_REFRESH_SECRET_KEY, {expiresIn: process.env.REFRESH_TOKEN_EXPIRES});
}
const User = mongoose.model('User', userSchema);

export default User;