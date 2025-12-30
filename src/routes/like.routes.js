import { Router } from "express"
import { upload } from "../middlewares/multer.middlewares.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"
import { 
    toggleCommentLike,
    toggleVideoLike,
    getLikedVideos 
} from "../controllers/like.controller.js"

const router = Router();

router.use(verifyJWT);

router.route('/video-like/:id').post(toggleVideoLike);
router.route('/comment-like/:id').post(toggleCommentLike);
router.route('/get-liked-videos').get(getLikedVideos);

export default router