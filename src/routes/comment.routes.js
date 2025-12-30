import { Router } from "express"
import { upload } from "../middlewares/multer.middlewares.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"
import { 
    getVideoComments, 
    addVideoComment, 
    updateVideoComment,
    deleteVideoComment,
    getReply
} from "../controllers/comment.controllers.js"

const router = Router();

router.use(verifyJWT);

router.route('/all-comments/:id').get(getVideoComments);
router.route('/comment-add/:id').post(addVideoComment);
router.route('/comment-update/:id').post(updateVideoComment);
router.route('/comment-delete/:id').post(deleteVideoComment);

router.route('/reply/:id').get(getReply);

export default router