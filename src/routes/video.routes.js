import { Router } from "express"
import { upload } from "../middlewares/multer.middlewares.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { watchVideo, uploadVideo,updateVid,delVid,getAllVids,togglePublishStatus} 
from "../controllers/video.controller.js";

const router = Router();


router.route('/upload').post(verifyJWT,
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

router.route('/watch/:id').get(verifyJWT,watchVideo);
router.route('/update/v=:id').post(verifyJWT,upload.single("thumbnail"),updateVid);
router.route('/delete/v=:id').post(verifyJWT,delVid);
router.route('/feed').get(verifyJWT,getAllVids);
router.route('/toggle-publish/v=:id').post(verifyJWT,togglePublishStatus);

export default router