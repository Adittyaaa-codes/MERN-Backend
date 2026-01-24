import ApiError from "../utils/ApiError.js";
import AsyncHandler from "../utils/AsyncHandler.js";
import jwt from "jsonwebtoken";
import User from "../models/user.models.js";

const verifyJWT = AsyncHandler(async (req, res, next) => {
    try {
        const token = req.cookies?.AccessToken;
        
        if (!token) {
            throw new ApiError(401, "Authentication required");
        }
        
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET_KEY);
        } catch (error) {
            if (error.name === "TokenExpiredError") {
                throw new ApiError(401, "Access token expired");
            }
            if (error.name === "JsonWebTokenError") {
                throw new ApiError(401, "Invalid access token");
            }
            throw new ApiError(401, "Token verification failed");
        }
        
        const user = await User.findById(decoded._id).select("-password");
        
        if (!user) {
            throw new ApiError(403, "User not found");
        }
        
        if (user.accountStatus !== "active") {
            throw new ApiError(403, "Account is not active");
        }
        
        if (user.passwordChangedAfter && user.passwordChangedAfter(decoded.iat)) {
            throw new ApiError(401, "Password changed. Please login again");
        }
        
        req.user = user;
        req.tokenData = decoded;
        
        next();
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError(500, error?.message || "Authentication failed");
    }
});

const optionalAuth = AsyncHandler(async (req, res, next) => {
    try {
        const token = req.cookies?.AccessToken;
        
        if (!token) {
            req.user = null;
            req.tokenData = null;
            return next();
        }
        
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET_KEY);
        const user = await User.findById(decoded._id).select("-password");
        
        if (user && user.accountStatus === "active") {
            req.user = user;
            req.tokenData = decoded;
        } else {
            req.user = null;
            req.tokenData = null;
        }
        
        next();
    } catch (error) {
        req.user = null;
        req.tokenData = null;
        next();
    }
});

const requireRole = (...roles) => {
    return AsyncHandler(async (req, res, next) => {
        if (!req.user) {
            throw new ApiError(401, "Authentication required");
        }
        
        if (!roles.includes(req.user.role)) {
            throw new ApiError(403, "Insufficient permissions");
        }
        
        next();
    });
};

const requireAccountStatus = (...allowedStatuses) => {
    return AsyncHandler(async (req, res, next) => {
        if (!req.user) {
            throw new ApiError(401, "Authentication required");
        }
        
        if (!allowedStatuses.includes(req.user.accountStatus)) {
            throw new ApiError(403, "Account status does not permit this action");
        }
        
        next();
    });
};

export { verifyJWT, optionalAuth, requireRole, requireAccountStatus };