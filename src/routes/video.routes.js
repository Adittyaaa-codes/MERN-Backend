import {Router} from "express"
import {upload} from "../middlewares/multer.middlewares.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { watchVideo, uploadVideo,updateVid,delVid,getAllVids,togglePublishStatus} from "../controllers/video.controller.js";

const router = Router();

router.use(verifyJWT)

router.route('/upload').post(
    upload.fields([
        {
            name: "video",
            maxCount: 1
        },
        {
            name: "thumbnail",
            maxCount: 1
        }
    ]),
    uploadVideo
);

router.route('/watch/v=:id').get(watchVideo);
router.route('/update/v=:id').post(upload.single("thumbnail"),updateVid);
router.route('/delete/v=:id').post(delVid);
router.route('/feed').get(getAllVids);
router.route('/toggle-publish/v=:id').post(togglePublishStatus);

export default router