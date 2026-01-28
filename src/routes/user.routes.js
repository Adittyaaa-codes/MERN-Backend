import {
    userRegister,
    userLogin,
    userLogout,
    userRefreshAccessToken,
    changePassword,
    changeUserInfo, 
    changeAvatar,
    getUserInfo,
    getWatchhistory,
    getCurrentUser
} from "../controllers/user.controllers.js";
import { Router } from "express";
import { upload } from "../middlewares/multer.middlewares.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/me", verifyJWT, getCurrentUser);
router.route("/login").post(userLogin);
router.route("/logout").post(verifyJWT, userLogout);
router.route("/refresh-token").post(userRefreshAccessToken);

router.route("/register").post(
    upload.fields([
        { name: "avatar", maxCount: 1 },
        { name: "coverImage", maxCount: 1 }
    ]),
    userRegister
);

router.route("/change-password").post(verifyJWT, changePassword);
router.route("/change-user-info").post(verifyJWT, changeUserInfo);

router.route("/change-avatar").post(
    verifyJWT, 
    upload.single("avatar"), 
    changeAvatar
);

router.route("/user/:username").get(verifyJWT, getUserInfo);
router.route("/history").get(verifyJWT, getWatchhistory);

export default router;

