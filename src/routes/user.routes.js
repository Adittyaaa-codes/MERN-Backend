import { userRegister,userLogin,userLogout,userRefreshAccessToken} from "../controllers/user.controllers.js";
import {Router} from "express"
import {upload} from "../middlewares/multer.middlewares.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()

router.route('/register').post(upload.fields(
    [
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name : "coverImage",
            maxCount:1
        }
    ]
),userRegister)
router.route('/login').post(userLogin);
router.route('/logout').post(verifyJWT,userLogout);
router.route('/refresh-token').post(userRefreshAccessToken)

export default router



