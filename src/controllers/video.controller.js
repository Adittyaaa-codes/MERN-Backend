import AsyncHandler from "../utils/AsyncHandler.js"
import ApiError from "../utils/ApiError.js"
import Video from "../models/video.models.js"
import User  from "../models/user.models.js"
import uploadCloudinary from "../utils/Clodinary.js";
import ApiResponse from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"
import subscriptionModel from "../models/subscription.model.js";
import mongoose from "mongoose";
import {v2 as cloudinary} from 'cloudinary';




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
        duration:videoUploaded.duration
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

const getAllVids = AsyncHandler(async (req,res)=>{
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;

    const filter = {
        isPublished: true  
    };

    if (query) {
        filter.$or = [
            { title: { $regex: query, $options: 'i' } },
            { description: { $regex: query, $options: 'i' } }
        ];
    }

    if (userId) {
        filter.owner = userId;
    }

    let sortOptions = {};
    if (sortBy && sortType) {
        sortOptions[sortBy] = sortType.toLowerCase() === 'asc' ? 1 : -1;
    } else {
        sortOptions = { createdAt: -1 };
    }

    const videos = await Video.find(filter)
        .populate("owner", "username avatar") 
        .sort(sortOptions)
        .skip((page - 1) * limit)
        .limit(parseInt(limit));


    const totalVideos = await Video.countDocuments(filter);

    return res.status(200).json(new ApiResponse(200, "Videos fetched successfully", {
        videos,
        pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalVideos / limit),
            totalVideos,
            limit: parseInt(limit)
        }
    }));
});

const watchVideo = AsyncHandler(async (req, res) => {
  const { id: videoId } = req.params;

  if (!videoId) {
    throw new ApiError(400, "Video ID is required");
  }

  const userId = req.user?._id || null;

  const video = await Video.aggregate([
    {
      $match: { _id: new mongoose.Types.ObjectId(videoId) }
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $lookup: {
              from: "subscriptions",
              localField: "_id",
              foreignField: "channel",
              as: "subscribers"
            }
          },
          {
            $addFields: {
              subsCount: { $size: "$subscribers" },
              isSubscribed: {
                $cond: {
                  if: { $in: [userId, "$subscribers.subscriber"] },
                  then: true,
                  else: false
                }
              }
            }
          },
          {
            $project: {
              username: 1,
              avatar: 1,
              subsCount: 1,
              isSubscribed: 1
            }
          }
        ]
      }
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "video",
        as: "likes"
      }
    },
    {
      $lookup: {
        from: "comments",
        localField: "_id",
        foreignField: "video",
        as: "comments"
      }
    },
    {
      $addFields: {
        owner: { $first: "$owner" },
        likeCount: { $size: "$likes" },
        commentCount: { $size: "$comments" },
        isLiked: {
          $cond: {
            if: { $in: [userId, "$likes.likedBy"] },
            then: true,
            else: false
          }
        }
      }
    },
    {
      $project: {
        title: 1,
        description: 1,
        videoFile: 1,
        thumbnail: 1,
        views: 1,
        createdAt: 1,
        owner: 1,
        likeCount: 1,
        commentCount: 1,
        isLiked: 1
      }
    }
  ]);

  if (!video.length) {
    throw new ApiError(404, "Video not found");
  }

  await Video.findByIdAndUpdate(videoId, { $inc: { views: 1 } });

  // Add video to user's watch history if user is logged in
  if (userId) {
    await User.findByIdAndUpdate(
      userId,
      {
        $pull: { watchHistory: videoId }, // Remove if already exists
      }
    );
    
    await User.findByIdAndUpdate(
      userId,
      {
        $push: { watchHistory: { $each: [videoId], $position: 0 } } // Add at beginning
      }
    );
  }

  return res.status(200).json(
    new ApiResponse(200, video[0], "Video fetched successfully")
  );
});



const updateVid = AsyncHandler(async (req,res)=>{
    const {id:videoId} = req.params
    const {title, description,thumbnail} = req.body;

    if(!videoId){
        throw new ApiError(400,"Video ID is required");
    }

    const video = await Video.findById(videoId);
    
    if(!video){
        throw new ApiError(404,"Video not found");
    }

    if(video.owner.toString() !== req.user._id.toString()){
        throw new ApiError(400,"You can only update your own videos")
    }

    if (!title && !description) 
        throw new ApiError(400,"Title and Desc are required")
    
    video.title = title;
    video.description = description;

    if(thumbnail){
        video.thumbnail = thumbnail;
    }
    await video.save();

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        "Video updated successfully",
        video
    ));
})

const delVid = AsyncHandler(async (req,res)=>{
    const {id:videoId} = req.params

    if(!videoId){
        throw new ApiError(400,"Video ID is required");
    }

    const video = await Video.findById(videoId);
    
    if(!video){
        throw new ApiError(404,"Video not found");
    }

    if(video.owner.toString() !== req.user._id.toString()){
        throw new ApiError(400,"You can only delete your own videos")
    }

    
    const extractPublicId = (url) => {
        const parts = url.split('/');
        const fileName = parts[parts.length - 1];
        return fileName.split('.')[0];
    };

    try {
        const videoPublicId = extractPublicId(video.videoFile);
        await cloudinary.uploader.destroy(videoPublicId, { resource_type: 'video' });

        const thumbnailPublicId = extractPublicId(video.thumbnail);
        await cloudinary.uploader.destroy(thumbnailPublicId);
    } catch (error) {
        console.error("Cloudinary deletion error:", error);
    }

    await Video.deleteOne({_id: videoId});

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        "Video deleted successfully",
        null
    ));
});

const togglePublishStatus = AsyncHandler(async (req, res) => {
    const {id: videoId } = req.params;

    if (!videoId) {
        throw new ApiError(400, "Video ID is required");
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    if(video.owner.toString() !== req.user._id.toString()){
        throw new ApiError(400,"You can only update your own videos")
    }

    video.isPublished = !video.isPublished;
    await video.save();

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        `Video has been ${video.isPublished ? 'published' : 'unpublished'} successfully`,
        video
    ));
})

export {watchVideo,uploadVideo,updateVid,delVid,getAllVids,togglePublishStatus};