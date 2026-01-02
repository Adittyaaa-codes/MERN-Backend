import mongoose from "mongoose"
import ApiError from "../utils/ApiError.js"
import ApiResponse from "../utils/ApiResponse.js"
import AsyncHandler from "../utils/AsyncHandler.js"
import Subscription from "../models/subscription.model.js"

const subscribeToggle = AsyncHandler(async (req, res) => {
    const subscriberId = req.user._id;
    const { channelId } = req.params;

    if (!channelId) {
        throw new ApiError(400, "Channel ID is required");
    }

    if (!mongoose.isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID");
    }

    if (subscriberId.toString() === channelId) {
        throw new ApiError(400, "You cannot subscribe to yourself");
    }

    // Verify the channel exists
    const User = (await import("../models/user.models.js")).default;
    const channelExists = await User.findById(channelId);
    if (!channelExists) {
        throw new ApiError(404, "Channel not found");
    }

    const existingSub = await Subscription.findOne({
        subscriber: subscriberId,
        channel: channelId
    });

    let isSubscribed;

    if (existingSub) {
        await Subscription.findByIdAndDelete(existingSub._id);
        isSubscribed = false;
    } else {
        await Subscription.create({
            subscriber: subscriberId,
            channel: channelId
        });
        isSubscribed = true;
    }

    const subscribersCount = await Subscription.countDocuments({
        channel: channelId
    });

    return res.status(200).json(
        new ApiResponse(200, { isSubscribed, subscribersCount }, "Subscription toggled successfully")
    );
});

const getUserSubscriptions = AsyncHandler(async (req, res) => {
    const subscriberId = req.user._id;

    const subscriptions = await Subscription.aggregate([
        {
            $match: {
                subscriber: new mongoose.Types.ObjectId(subscriberId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "channelInfo"
            }
        },
        {
            $unwind: "$channelInfo"
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "channel",
                foreignField: "channel",
                as: "subscribersList"
            }
        },
        {
            $addFields: {
                subscribersCount: { $size: "$subscribersList" }
            }
        },
        {
            $project: {
                _id: "$channelInfo._id",
                username: "$channelInfo.username",
                fullname: "$channelInfo.fullname",
                avatar: "$channelInfo.avatar",
                subscribersCount: 1
            }
        }
    ]);

    return res.status(200).json(
        new ApiResponse(200, subscriptions, "Subscriptions fetched successfully")
    );
});

export {subscribeToggle, getUserSubscriptions};
