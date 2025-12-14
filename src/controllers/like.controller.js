import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {AsyncHandler} from "../utils/AsyncHandler.js"

const toggleVideoLike = AsyncHandler(async (req, res) => {
    try {
        const {videoId} = req.params
        
        const like = await Like.findOne({
            video: mongoose.Types.ObjectId(videoId),
            likedBy: mongoose.Types.ObjectId(req.user?._id)
        })
    
        if(like){
            //unlike
            await Like.findByIdAndDelete(like._id)
        } else {
            //like
            await Like.create({
                video: mongoose.Types.ObjectId(videoId),
                likedBy: mongoose.Types.ObjectId(req.user?._id)
            })
        }
    
        return res.status(200).json(new ApiResponse(200, like ? "Video unliked successfully" : "Video liked successfully", null))
    } catch (error) {
        throw new ApiError(500, "Internal Server Error")
    }
})

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

const togglePostLike = AsyncHandler(async (req, res) => {
    try {
        const {postId} = req.params
        const like = await Like.findOne({
            post: mongoose.Types.ObjectId(postId),
            likedBy: mongoose.Types.ObjectId(req.user?._id)
        })
        if(like){
            //unlike
            await Like.findByIdAndDelete(like._id)
        } else {
            //like
            await Like.create({
                post: mongoose.Types.ObjectId(postId),
                likedBy: mongoose.Types.ObjectId(req.user?._id)
            })
        }   
    
        return res.status(200).json(new ApiResponse(200, like ? "Post unliked successfully" : "Post liked successfully", null))
    } catch (error) {
        throw new ApiError(500, "Internal Server Error")
    }
}
)

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
    togglePostLike,
    toggleVideoLike,
    getLikedVideos
}