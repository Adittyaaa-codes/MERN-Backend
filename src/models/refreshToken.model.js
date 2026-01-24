import mongoose, { Schema } from "mongoose";
import crypto from "crypto";

const refreshTokenSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    
    tokenHash: {
        type: String,
        required: true,
        index: true
    },
    
    tokenFamily: {
        type: String,
        required: true,
        index: true
    },
    
    expiresAt: {
        type: Date,
        required: true
    },
    
    isRevoked: {
        type: Boolean,
        default: false,
        index: true
    },
    
    isUsed: {
        type: Boolean,
        default: false,
        index: true
    },
    
    userAgent: {
        type: String,
        default: ""
    },
    
    ipAddress: {
        type: String,
        default: ""
    },
    
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    }
});

refreshTokenSchema.index({ tokenHash: 1, isRevoked: 1, isUsed: 1 });
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

refreshTokenSchema.statics.hashToken = function(token) {
    return crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");
};

refreshTokenSchema.statics.generateTokenFamily = function() {
    return crypto.randomBytes(16).toString("hex");
};

refreshTokenSchema.statics.createToken = async function({
    userId,
    token,
    tokenFamily,
    expiresAt,
    userAgent = "",
    ipAddress = ""
}) {
    const tokenHash = this.hashToken(token);
    
    return await this.create({
        userId,
        tokenHash,
        tokenFamily,
        expiresAt,
        userAgent,
        ipAddress
    });
};

refreshTokenSchema.statics.findValidToken = async function(token) {
    const tokenHash = this.hashToken(token);
    const now = new Date();
    
    return await this.findOne({
        tokenHash,
        isRevoked: false,
        isUsed: false,
        expiresAt: { $gt: now }
    }).populate("userId", "-password");
};

refreshTokenSchema.statics.markAsUsed = async function(tokenId) {
    return await this.findByIdAndUpdate(
        tokenId,
        { isUsed: true },
        { new: true }
    );
};

refreshTokenSchema.statics.revokeTokenFamily = async function(tokenFamily) {
    return await this.updateMany(
        { tokenFamily },
        { isRevoked: true }
    );
};

refreshTokenSchema.statics.revokeAllUserTokens = async function(userId) {
    return await this.updateMany(
        { userId },
        { isRevoked: true }
    );
};

refreshTokenSchema.statics.revokeToken = async function(token) {
    const tokenHash = this.hashToken(token);
    return await this.findOneAndUpdate(
        { tokenHash },
        { isRevoked: true },
        { new: true }
    );
};

refreshTokenSchema.statics.isTokenReused = async function(token) {
    const tokenHash = this.hashToken(token);
    const tokenDoc = await this.findOne({ tokenHash });
    
    if (!tokenDoc) return { reused: false, exists: false };
    
    return {
        reused: tokenDoc.isUsed || tokenDoc.isRevoked,
        exists: true,
        tokenFamily: tokenDoc.tokenFamily,
        userId: tokenDoc.userId
    };
};

refreshTokenSchema.statics.cleanupExpiredTokens = async function() {
    const now = new Date();
    const result = await this.deleteMany({
        $or: [
            { expiresAt: { $lt: now } },
            { isRevoked: true, createdAt: { $lt: new Date(now - 24 * 60 * 60 * 1000) } }
        ]
    });
    return result.deletedCount;
};

refreshTokenSchema.statics.getUserSessions = async function(userId) {
    const now = new Date();
    return await this.find({
        userId,
        isRevoked: false,
        isUsed: false,
        expiresAt: { $gt: now }
    }).select("createdAt userAgent ipAddress expiresAt");
};

const RefreshToken = mongoose.model("RefreshToken", refreshTokenSchema);

export default RefreshToken;
