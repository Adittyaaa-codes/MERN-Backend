import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
    login,
    refreshAccessToken,
    logout,
    logoutAll,
    getCurrentUser,
    getSessions,
    revokeSession,
    cleanupTokens
} from "../controllers/auth.controller.js";
import { verifyJWT, optionalAuth } from "../middlewares/auth.middleware.js";

const router = Router();

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: {
        statusCode: 429,
        message: "Too many login attempts. Please try again after 15 minutes",
        data: null,
        success: false
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => process.env.NODE_ENV === "test",
    keyGenerator: (req) => {
        const username = req.body?.username || req.body?.email || "";
        return `${req.ip}-${username.toLowerCase()}`;
    }
});

const refreshLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    message: {
        statusCode: 429,
        message: "Too many refresh attempts. Please try again later",
        data: null,
        success: false
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => process.env.NODE_ENV === "test"
});

const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: {
        statusCode: 429,
        message: "Too many requests. Please slow down",
        data: null,
        success: false
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => process.env.NODE_ENV === "test"
});

router.post("/login", loginLimiter, login);
router.post("/refresh", refreshLimiter, refreshAccessToken);
router.post("/logout", logout);

router.get("/me", generalLimiter, verifyJWT, getCurrentUser);
router.post("/logout-all", generalLimiter, verifyJWT, logoutAll);
router.get("/sessions", generalLimiter, verifyJWT, getSessions);
router.delete("/sessions/:sessionId", generalLimiter, verifyJWT, revokeSession);
router.post("/cleanup", generalLimiter, verifyJWT, cleanupTokens);

export default router;
