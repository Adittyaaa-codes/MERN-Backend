import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        unique: true,
        required: [true, "Username is required"],
        lowercase: true,
        trim: true,
        index: true,
        minlength: [3, "Username must be at least 3 characters"],
        maxlength: [30, "Username cannot exceed 30 characters"],
        match: [/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"]
    },
    fullname: {
        type: String,
        required: [true, "Full name is required"],
        trim: true,
        minlength: [2, "Full name must be at least 2 characters"],
        maxlength: [100, "Full name cannot exceed 100 characters"]
    },
    email: {
        type: String,
        required: [true, "Email is required"],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/, "Please provide a valid email"]
    },
    avatar: {
        type: String,
        required: [true, "Avatar is required"]
    },
    coverImage: {
        type: String,
        default: ""
    },
    watchHistory: [
        {
            type: Schema.Types.ObjectId,
            ref: "Video"
        }
    ],
    password: {
        type: String,
        required: [true, "Password is required"],
        minlength: [8, "Password must be at least 8 characters"]
    },
    role: {
        type: String,
        enum: ["user", "creator", "moderator", "admin"],
        default: "user"
    },
    accountStatus: {
        type: String,
        enum: ["active", "suspended", "banned"],
        default: "active"
    },
    failedLoginAttempts: {
        type: Number,
        default: 0
    },
    lockoutUntil: {
        type: Date,
        default: null
    },
    lastLoginAt: {
        type: Date,
        default: null
    },
    passwordChangedAt: {
        type: Date,
        default: null
    }
}, { timestamps: true });


userSchema.pre("save", async function(next) {
    if (!this.isModified("password")) return next();
    
    this.password = await bcrypt.hash(this.password, 12);
    
    if (!this.isNew) {
        this.passwordChangedAt = new Date();
    }
    
    next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.passwordChangedAfter = function(tokenIssuedAt) {
    if (this.passwordChangedAt) {
        const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
        return tokenIssuedAt < changedTimestamp;
    }
    return false;
};

userSchema.methods.generateAccessToken = function() {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullname: this.fullname,
            role: this.role
        },
        process.env.JWT_ACCESS_SECRET_KEY,
        { 
            expiresIn: process.env.ACCESS_TOKEN_EXPIRES || "15m",
            algorithm: "HS256"
        }
    );
};

userSchema.methods.generateRefreshToken = function() {
    const crypto = require("crypto");
    return jwt.sign(
        {
            _id: this._id,
            jti: crypto.randomBytes(16).toString("hex")
        },
        process.env.JWT_REFRESH_SECRET_KEY,
        { 
            expiresIn: process.env.REFRESH_TOKEN_EXPIRES || "7d",
            algorithm: "HS256"
        }
    );
};

userSchema.methods.isAccountLocked = function() {
    if (!this.lockoutUntil) return false;
    return new Date() < this.lockoutUntil;
};

userSchema.methods.incrementFailedAttempts = async function() {
    this.failedLoginAttempts += 1;
    
    if (this.failedLoginAttempts >= 5) {
        this.lockoutUntil = new Date(Date.now() + 15 * 60 * 1000);
    }
    
    await this.save({ validateBeforeSave: false });
};

userSchema.methods.resetFailedAttempts = async function() {
    this.failedLoginAttempts = 0;
    this.lockoutUntil = null;
    this.lastLoginAt = new Date();
    await this.save({ validateBeforeSave: false });
};

userSchema.methods.toSafeObject = function() {
    const obj = this.toObject();
    delete obj.password;
    delete obj.failedLoginAttempts;
    delete obj.lockoutUntil;
    delete obj.passwordChangedAt;
    delete obj.__v;
    return obj;
};

const User = mongoose.model("User", userSchema);

export default User;