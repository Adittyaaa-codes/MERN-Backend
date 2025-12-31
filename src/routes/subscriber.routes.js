import { Router } from "express"
import { verifyJWT } from "../middlewares/auth.middleware.js"
import { 
    subscribeToggle
} from "../controllers/subscription.controller.js"

const router = Router();

router.use(verifyJWT);

router.route('/sub/:channelId').post(subscribeToggle);


export default router