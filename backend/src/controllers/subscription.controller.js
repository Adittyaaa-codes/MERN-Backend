import mongoose from "mongoose"
import ApiError from "../utils/ApiError.js"
import ApiResponse from "../utils/ApiResponse.js"
import AsyncHandler from "../utils/AsyncHandler.js"
import  Subscription  from "../models/subscription.model.js"

const subscribeToggle = AsyncHandler(async (req, res) => {
    const subscriberId = req.user._id;
    const { channelId } = req.params;

    if (!channelId) {
        throw new ApiError(400, "Channel ID is required");
    }

    if (subscriberId.toString() === channelId) {
        throw new ApiError(400, "You cannot subscribe to yourself");
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
        new ApiResponse(
        200,
        {
            isSubscribed,
            subscribersCount
        },
        "Subscription toggled successfully"
        )
    );
});

export {subscribeToggle};
