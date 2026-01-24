/**
 * User Routes
 * 
 * NOTE: Authentication routes (login, logout, refresh) have been moved to /auth/*
 * These routes are kept for backward compatibility but redirect to new auth system
 * 
 * New auth routes:
 * - POST /auth/login
 * - POST /auth/logout  
 * - POST /auth/refresh
 * - GET /auth/me
 */

import {
    userRegister,
    changePassword,
    changeUserInfo, 
    changeAvatar,
    getUserInfo,
    getWatchhistory
} from "../controllers/user.controllers.js";
import { Router } from "express";
import { upload } from "../middlewares/multer.middlewares.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

// Import auth controller for backward compatibility redirects
import {
    login,
    logout,
    refreshAccessToken,
    getCurrentUser
} from "../controllers/auth.controller.js";

const router = Router();

// ============================================================================
// BACKWARD COMPATIBILITY ROUTES
// These redirect to the new auth system at /auth/*
// Consider deprecating these in future versions
// ============================================================================

// GET /users/me - Now uses new auth controller
router.get("/me", verifyJWT, getCurrentUser);

// POST /users/login - Redirects to new auth system
router.route("/login").post(login);

// POST /users/logout - Redirects to new auth system
router.route("/logout").post(logout);

// POST /users/refresh-token - Redirects to new auth system
router.route("/refresh-token").post(refreshAccessToken);

// ============================================================================
// USER MANAGEMENT ROUTES
// ============================================================================

// POST /users/register - Create new user account
router.route("/register").post(
    upload.fields([
        { name: "avatar", maxCount: 1 },
        { name: "coverImage", maxCount: 1 }
    ]),
    userRegister
);

// POST /users/change-password - Update user password (requires auth)
router.route("/change-password").post(verifyJWT, changePassword);

// POST /users/change-user-info - Update user info (requires auth)
router.route("/change-user-info").post(verifyJWT, changeUserInfo);

// POST /users/change-avatar - Update user avatar (requires auth)
router.route("/change-avatar").post(
    verifyJWT, 
    upload.single("avatar"), 
    changeAvatar
);

// GET /users/user/:username - Get user profile by username (requires auth)
router.route("/user/:username").get(verifyJWT, getUserInfo);

// GET /users/history - Get user watch history (requires auth)
router.route("/history").get(verifyJWT, getWatchhistory);

export default router;



