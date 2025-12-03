import ApiError from "../utils/ApiError.js";
import AsyncHandler from "../utils/AsyncHandler.js"
import jwt from "jsonwebtoken"
import User from "../models/user.models.js";

const verifyJWT = AsyncHandler(async(req,res,next)=>{
    try {
        const token = req.cookies?.AccessToken 
        || req.header("Authorization")?.replace("Bearer ","");
    
        if(!token){
            throw new ApiError(400,"Authorisation Failed")
        }
    
        const decodedToken = jwt.verify(token,process.env.JWT_ACCESS_SECRET_KEY);
    
        if(!decodedToken){
            throw new ApiError(400,"Invalid Token Info");
        }

        console.log("DECOCED-TOKEN------->",decodedToken);
    
        const user = await User
        .findById(decodedToken._id)
        .select("-password -refreshToken")
    
        req.user = user;
        next();
    } catch (error) {
        throw new ApiError(500,error?.message);
    }
    
});

export {verifyJWT}