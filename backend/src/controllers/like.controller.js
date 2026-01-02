import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import ApiError from "../utils/ApiError.js"
import ApiResponse from "../utils/ApiResponse.js"
import AsyncHandler from "../utils/AsyncHandler.js"

const toggleVideoLike = AsyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const userId = req.user._id;

  const existingLike = await Like.findOne({
    video: videoId,
    likedBy: userId,
  });

  let isLiked;

  if (existingLike) {
    await Like.findByIdAndDelete(existingLike._id);
    isLiked = false;
  } else {
    await Like.create({
      video: videoId,
      likedBy: userId,
    });
    isLiked = true;
  }

  const likeCount = await Like.countDocuments({ video: videoId });

  return res.status(200).json(
    new ApiResponse(200, { isLiked, likeCount }, "Like toggled")
  );
});


const toggleCommentLike = AsyncHandler(async (req, res) => {
    try {
        const {commentId} = req.params
        
        const like = await Like.findOne({
            comment: mongoose.Types.ObjectId(commentId),
            likedBy: mongoose.Types.ObjectId(req.user?._id)
        })
    
        if(like){
            //unlike
            await Like.findByIdAndDelete(like._id)
        } else {
            //like
            await Like.create({
                comment: mongoose.Types.ObjectId(commentId),
                likedBy: mongoose.Types.ObjectId(req.user?._id)
            })
        }
    
        return res.status(200).json(new ApiResponse(200, like ? "Comment unliked successfully" : "Comment liked successfully", null))
    } catch (error) {
        throw new ApiError(500, "Internal Server Error")
    }
    

})

const getLikedVideos = AsyncHandler(async (req, res) => {
    try {
        const likedVideos = await Like.find({
            likedBy: mongoose.Types.ObjectId(req.user?._id),
            video: { $ne: null }
        }).populate('video')
    
        const videos = likedVideos.map(like => like.video)
        return res.status(200).json(new ApiResponse(200, "Liked videos fetched successfully", videos))
    } catch (error) {
        throw new ApiError(500, "Internal Server Error")
    }
})

export {
    toggleCommentLike,
    toggleVideoLike,
    getLikedVideos
}
