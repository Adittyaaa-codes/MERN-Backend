import mongoose from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {AsyncHandler} from "../utils/AsyncHandler.js"

const getVideoComments = AsyncHandler(async (req, res) => {
    const {id: videoId} = req.params
    const {page = 1, limit = 10, sortBy , sortType} = req.query

    const comments = await Comment.find({video: videoId})
        .populate("owner", "fullname username avatar")
        .sort({[sortBy || "createdAt"]: sortType === "desc" ? -1 : 1})
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
    
    const totalComments = await Comment.countDocuments({video: videoId})

    return res.status(200).json(new ApiResponse(200, "Comments fetched successfully", {
        comments,
        pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalComments / limit),
            totalComments,
            limit: parseInt(limit)
        }
    }))
})

const addComment = AsyncHandler(async (req, res) => {
    const { id:videoId} = req.params;
    const {content} = req.body;

    const comment = await Comment
    .create([{
        content:content,
        video:mongoose.Types.ObjectId(videoId),
        owner:mongoose.Types.ObjectId(req.user?._id)
    }])

    return res.status(201).json(new ApiResponse(201, "Comment added successfully", comment))
})

const updateComment = AsyncHandler(async (req, res) => {
    const commentId = req.params
    const {content} = req.body

    if(!content){
        throw new ApiError(400,"Content is required")
    }

    if(!mongoose.Types.ObjectId.isValid(commentId)){
        throw new ApiError(400,"Invalid Comment ID")
    }

    const comment = await Comment
    .findById(commentId)

    if(!comment){
        throw new ApiError(404,"Comment not found")
    }

    if(comment.owner.toString() !== req.user._id.toString()){
        throw new ApiError(400,"You can only update your own comments")
    }

    comment.content = content;
    await comment.save();

    return res.status(200).json(new ApiResponse(200, "Comment updated successfully", comment))
})

const deleteComment = AsyncHandler(async (req, res) => {
    const commentId = req.params

    if(!mongoose.Types.ObjectId.isValid(commentId)){
        throw new ApiError(400,"Invalid Comment ID")
    }

    const comment = await Comment
    .findById(commentId)

    if(!comment){
        throw new ApiError(404,"Comment not found")
    }

    if(comment.owner.toString() !== req.user._id.toString()){
        throw new ApiError(400,"You can only update your own comments")
    }

    await comment.deleteOne({_id: commentId});

    return res.status(200).json(new ApiResponse(200, "Comment deleted successfully", null))
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }