import AsyncHandler from "../utils/AsyncHandler.js"
import ApiError from "../utils/ApiError.js"
import { Video } from "../models/video.models.js"
import User  from "../models/user.models.js"
import uploadCloudinary from "../utils/Clodinary.js";
import ApiResponse from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"
import subscriptionModel from "../models/subscription.model.js";
import mongoose from "mongoose";

const uploadVideo = AsyncHandler(async (req,res)=>{
    const {title,description} = req.body

    if (!req.files || !req.files.video || req.files.video.length === 0
        || !req.files.thumbnail || req.files.thumbnail.length === 0
    ){
        throw new ApiError(400, "Video and Thumbnail files is required");
    }

    const videoLocalPath = req.files.video[0].path;
    const thumbnailLocalPath = req.files.thumbnail[0].path;

    const videoUploaded = await uploadCloudinary(videoLocalPath);
    const thumbnailUploaded = await uploadCloudinary(thumbnailLocalPath);

    if(!videoUploaded){
        throw new ApiError(500,"Video didnt uploaded");
    }

    if(!thumbnailUploaded){
        throw new ApiError(500,"Video didnt uploaded");
    }

    const user = await User.findById(req.user?._id);

    if(!user){
        throw new ApiError(500,"Cant Fetch User");
    }

    const video = await Video.create({
        videoFile : videoUploaded.url,
        thumbnail : thumbnailUploaded.url,
        title:title,
        description:description,
        owner:user,
    });

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            "Video and Thubmnail upload success",
            video
        )
    )

});

const watchVideo = AsyncHandler(async (req,res)=>{
    const {id: videoId} = req.params;

    if(!videoId){
        throw new ApiError(
            400,
            "Video not Found"
        )
    }

    const video = await Video.findById(videoId);

    if(!video){
        throw new ApiError(404, "Video not found");
    }

    // Safely increment views (handle undefined/null)
    video.views = (video.views || 0) + 1;
    await video.save();

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        "Fetch Video SuccessFully",
        video
    ))
});

export {watchVideo,uploadVideo};