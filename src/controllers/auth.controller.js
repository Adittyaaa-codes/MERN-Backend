import AsyncHandler from "../utils/AsyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import User from "../models/user.models.js";
import RefreshToken from "../models/refreshToken.model.js";
import jwt from "jsonwebtoken";

const getCookieOptions = (maxAge) => {
    const isProduction = process.env.NODE_ENV === "production";
    
    return {
        httpOnly: true,
        secure: true,
        sameSite: isProduction ? "none" : "lax",
        maxAge: maxAge,
        path: "/"
    };
};

const ACCESS_TOKEN_COOKIE_OPTIONS = () => getCookieOptions(15 * 60 * 1000);
const REFRESH_TOKEN_COOKIE_OPTIONS = () => getCookieOptions(7 * 24 * 60 * 60 * 1000);

const getRefreshTokenExpiry = () => {
    const days = parseInt(process.env.REFRESH_TOKEN_EXPIRES_DAYS) || 7;
    return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
};

const getClientInfo = (req) => ({
    userAgent: req.headers["user-agent"] || "unknown",
    ipAddress: req.ip || req.connection?.remoteAddress || "unknown"
});

const sanitizeInput = (input) => {
    if (typeof input !== "string") return "";
    return input.replace(/[<>'"]/g, "").trim();
};

const login = AsyncHandler(async (req, res) => {
    const { username, email, password } = req.body;
    
    const identifier = username || email;
    if (!identifier) {
        throw new ApiError(400, "Username or email is required");
    }
    
    if (!password) {
        throw new ApiError(400, "Password is required");
    }
    
    const sanitizedIdentifier = sanitizeInput(identifier.toLowerCase());
    
    const user = await User.findOne({
        $or: [
            { username: sanitizedIdentifier },
            { email: sanitizedIdentifier }
        ]
    });
    
    if (!user) {
        throw new ApiError(401, "Invalid credentials");
    }
    
    if (user.accountStatus === "banned") {
        throw new ApiError(403, "Account has been permanently suspended");
    }
    
    if (user.accountStatus === "suspended") {
        throw new ApiError(403, "Account is temporarily suspended");
    }
    
    if (user.isAccountLocked()) {
        const lockTimeRemaining = Math.ceil((user.lockoutUntil - Date.now()) / 60000);
        throw new ApiError(423, `Account locked. Try again in ${lockTimeRemaining} minutes`);
    }
    
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
        await user.incrementFailedAttempts();
        throw new ApiError(401, "Invalid credentials");
    }
    
    await user.resetFailedAttempts();
    
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    
    const tokenFamily = RefreshToken.generateTokenFamily();
    
    const { userAgent, ipAddress } = getClientInfo(req);
    await RefreshToken.createToken({
        userId: user._id,
        token: refreshToken,
        tokenFamily,
        expiresAt: getRefreshTokenExpiry(),
        userAgent,
        ipAddress
    });
    
    const userInfo = user.toSafeObject();
    
    res
        .status(200)
        .cookie("AccessToken", accessToken, ACCESS_TOKEN_COOKIE_OPTIONS())
        .cookie("RefreshToken", refreshToken, REFRESH_TOKEN_COOKIE_OPTIONS())
        .json(new ApiResponse(200, "Login successful", { 
            user: userInfo
        }));
});

const refreshAccessToken = AsyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies?.RefreshToken;
    
    if (!incomingRefreshToken) {
        throw new ApiError(401, "Refresh token required");
    }
    
    const reuseCheck = await RefreshToken.isTokenReused(incomingRefreshToken);
    
    if (reuseCheck.exists && reuseCheck.reused) {
        console.warn(`⚠️ SECURITY: Refresh token reuse detected for user ${reuseCheck.userId}`);
        console.warn(`⚠️ Token family ${reuseCheck.tokenFamily} compromised - revoking all sessions`);
        
        await RefreshToken.revokeAllUserTokens(reuseCheck.userId);
        
        res.clearCookie("AccessToken", { ...ACCESS_TOKEN_COOKIE_OPTIONS(), maxAge: 0 });
        res.clearCookie("RefreshToken", { ...REFRESH_TOKEN_COOKIE_OPTIONS(), maxAge: 0 });
        
        throw new ApiError(401, "Session invalidated for security. Please login again");
    }
    
    let decoded;
    try {
        decoded = jwt.verify(incomingRefreshToken, process.env.JWT_REFRESH_SECRET_KEY);
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            throw new ApiError(401, "Refresh token expired. Please login again");
        }
        throw new ApiError(401, "Invalid refresh token");
    }
    
    const tokenDoc = await RefreshToken.findValidToken(incomingRefreshToken);
    
    if (!tokenDoc) {
        throw new ApiError(401, "Invalid or expired refresh token");
    }
    
    const user = await User.findById(decoded._id);
    
    if (!user) {
        throw new ApiError(401, "User not found");
    }
    
    if (user.passwordChangedAfter(decoded.iat)) {
        await RefreshToken.revokeAllUserTokens(user._id);
        throw new ApiError(401, "Password changed. Please login again");
    }
    
    if (user.accountStatus !== "active") {
        await RefreshToken.revokeAllUserTokens(user._id);
        throw new ApiError(403, "Account is not active");
    }
    
    await RefreshToken.markAsUsed(tokenDoc._id);
    
    const newAccessToken = user.generateAccessToken();
    const newRefreshToken = user.generateRefreshToken();
    
    const { userAgent, ipAddress } = getClientInfo(req);
    await RefreshToken.createToken({
        userId: user._id,
        token: newRefreshToken,
        tokenFamily: tokenDoc.tokenFamily,
        expiresAt: getRefreshTokenExpiry(),
        userAgent,
        ipAddress
    });
    
    res
        .status(200)
        .cookie("AccessToken", newAccessToken, ACCESS_TOKEN_COOKIE_OPTIONS())
        .cookie("RefreshToken", newRefreshToken, REFRESH_TOKEN_COOKIE_OPTIONS())
        .json(new ApiResponse(200, "Token refreshed successfully", {
            user: user.toSafeObject()
        }));
});

const logout = AsyncHandler(async (req, res) => {
    const refreshToken = req.cookies?.RefreshToken;
    
    if (refreshToken) {
        await RefreshToken.revokeToken(refreshToken);
    }
    
    const clearOptions = {
        httpOnly: true,
        secure: true,
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        path: "/"
    };
    
    res
        .clearCookie("AccessToken", clearOptions)
        .clearCookie("RefreshToken", clearOptions)
        .json(new ApiResponse(200, "Logged out successfully"));
});

const logoutAll = AsyncHandler(async (req, res) => {
    await RefreshToken.revokeAllUserTokens(req.user._id);
    
    const clearOptions = {
        httpOnly: true,
        secure: true,
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        path: "/"
    };
    
    res
        .clearCookie("AccessToken", clearOptions)
        .clearCookie("RefreshToken", clearOptions)
        .json(new ApiResponse(200, "Logged out from all devices"));
});

const getCurrentUser = AsyncHandler(async (req, res) => {
    if (!req.user) {
        throw new ApiError(401, "Not authenticated");
    }
    
    const user = await User.findById(req.user._id).select("-password");
    
    if (!user) {
        throw new ApiError(404, "User not found");
    }
    
    res.status(200).json(new ApiResponse(200, "User fetched successfully", {
        user: user.toSafeObject()
    }));
});

const getSessions = AsyncHandler(async (req, res) => {
    const sessions = await RefreshToken.getUserSessions(req.user._id);
    
    res.status(200).json(new ApiResponse(200, "Sessions fetched", {
        sessions: sessions.map(session => ({
            id: session._id,
            createdAt: session.createdAt,
            expiresAt: session.expiresAt,
            userAgent: session.userAgent,
            ipAddress: session.ipAddress
        }))
    }));
});

const revokeSession = AsyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    
    const session = await RefreshToken.findOne({
        _id: sessionId,
        userId: req.user._id,
        isRevoked: false
    });
    
    if (!session) {
        throw new ApiError(404, "Session not found");
    }
    
    session.isRevoked = true;
    await session.save();
    
    res.status(200).json(new ApiResponse(200, "Session revoked successfully"));
});

const cleanupTokens = AsyncHandler(async (req, res) => {
    const deletedCount = await RefreshToken.cleanupExpiredTokens();
    
    res.status(200).json(new ApiResponse(200, "Cleanup completed", {
        deletedCount
    }));
});

export {
    login,
    refreshAccessToken,
    logout,
    logoutAll,
    getCurrentUser,
    getSessions,
    revokeSession,
    cleanupTokens
};
