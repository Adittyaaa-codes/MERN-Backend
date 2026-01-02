import AsyncHandler from "../utils/AsyncHandler.js"
import ApiError from "../utils/ApiError.js"
import User from "../models/user.models.js"
import uploadCloudinary from "../utils/Clodinary.js";
import ApiResponse from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"
import subscriptionModel from "../models/subscription.model.js";
import mongoose from "mongoose";

const getCurrentUser = AsyncHandler(async (req, res) => {
    return res.status(200).json(
        new ApiResponse(200, req.user, "User fetched")
    );
});

const userRegister = AsyncHandler(async (req, res) => {
    const { username, fullname, email, password } = req.body;

    if ([username, fullname, email, password].some((field) =>
        field?.trim() === "")) {
        throw new ApiError(409, "All fields are required!!");
    }

    const userExists = await User.findOne({
        $or: [{ email }, { username }]
    });

    if (userExists) {
        throw new ApiError(409, "User already exists!!");
    }

    console.log("Files received:", req.files);
    console.log("Body received:", req.body);

    if (!req.files || !req.files.avatar || req.files.avatar.length === 0) {
        throw new ApiError(400, "Avatar file is required");
    }

    const avatarLocalPath = req.files.avatar[0].path;

    let coverImageLocalPath = null;
    if (req.files?.coverImage && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }

    const avatarUploaded = await uploadCloudinary(avatarLocalPath);
    const coverImageUploaded = await uploadCloudinary(coverImageLocalPath);

    if (!avatarUploaded) {
        throw new ApiError(500, "Error while uploading avatar image");
    }

    const user = await User.create({
        fullname,
        email,
        password,
        avatar: avatarUploaded.url,
        coverImage: coverImageUploaded?.url || "",
        username: username.toLowerCase()
    });

    const userCreated = await User.findById(user._id).select(
        "-password -refreshToken");

    return res.status(200).json(
        new ApiResponse(200, "User created Successfully", userCreated)
    )
});

const userLogin = AsyncHandler(async (req, res) => {
    const { username, password } = req.body;

    if (username === "") {
        throw new ApiError(400, "Enter Username");
    }

    const userFound = await User
        .findOne({ username: username.toLowerCase() });

    if (!userFound) {
        throw new ApiError(400, "No user found! Create an account");
    }

    const isPasswordMatched = await userFound.comparePassword(password);

    if (!isPasswordMatched) {
        throw new ApiError(400, "Invalid credentials");
    }

    const AccessToken = userFound.generateAccessToken()
    const RefreshToken = userFound.generateRefreshToken()

    userFound.refreshToken = RefreshToken;
    await userFound.save();

    const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 24 * 60 * 60 * 1000
    };

    const refreshCookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000
    };

    const userInfo = await User.findById(userFound._id).select("-refreshToken -password");

    res
    .status(200)
    .cookie('AccessToken', AccessToken, cookieOptions)
    .cookie('RefreshToken', RefreshToken, refreshCookieOptions)
    .json(
    new ApiResponse(200, 'Login successful!!', { 
      user: userInfo, 
      accessToken: AccessToken, 
      refreshToken: RefreshToken 
    })
);
});

const userLogout = AsyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        { $set: { refreshToken: null } },
        { new: true },
    );

    const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 0
    };

    res
        .clearCookie("RefreshToken", cookieOptions)
        .clearCookie("AccessToken", cookieOptions)
        .json(new ApiResponse(200, "user logged-out successfully"));
});

const userRefreshAccessToken = AsyncHandler(async (req, res) => {

    const currentRefresh = req.cookies?.RefreshToken
        || (req.headers?.authorization || '').replace('Bearer ', '');

    if (!currentRefresh) {
        throw new ApiError(400, 'Authorisation Failed!');
    }

    let decoded;
    try {
        decoded = jwt.verify(currentRefresh, process.env.JWT_REFRESH_SECRET_KEY);
    } catch (err) {
        throw new ApiError(400, 'Authorisation Failed!!');
    }

    const user = await User.findById(decoded._id);
    if (!user) {
        throw new ApiError(400, 'Authorisation Failed!!!');
    }

    console.log('Current refresh token:', currentRefresh);
    console.log('Stored refresh token:', user.refreshToken);
    console.log('Tokens match:', currentRefresh === user.refreshToken);

    if (currentRefresh !== user.refreshToken) {
        throw new ApiError(400, 'Refresh token does not match stored token');
    }

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save();

    const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 24 * 60 * 60 * 1000
    };

    const refreshCookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000
    };

    res
        .cookie('AccessToken', accessToken, cookieOptions)
        .cookie('RefreshToken', refreshToken, refreshCookieOptions)
        .json(new ApiResponse(200, 'Access token refreshed', { accessToken }));
});

const changePassword = AsyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
        throw new ApiError(400, "Both old and new passwords are required");
    }

    const user = await User.findById(req.user?._id);
    const checkPassword = await user.comparePassword(oldPassword);

    if (!checkPassword) {
        throw new ApiError(400, "Invalid Old Password");
    }

    user.password = newPassword;
    await user.save()

    const userInfo = await User.findById(user._id).select(
        "-refreshToken -password"
    );

    return res
        .status(200)
        .json(new ApiResponse(200, "Password changed successfully", userInfo));
});

const changeUserInfo = AsyncHandler(async (req, res) => {
    const fullname = req.body.fullname;

    if (!fullname) {
        throw new ApiError(400, "fullname is required");
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                fullname: fullname,
            }
        },
        { new: true }
    );

    return res
        .status(200)
        .json(new ApiResponse(200, "User info updated success", user));
});

const changeAvatar = AsyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required");
    }

    const user = await User.findById(req.user._id).select("-password -refreshToken");

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    if (user.avatar?.public_id) {
        await cloudinary.uploader.destroy(user.avatar.public_id);
    }

    const avatarUploaded = await uploadCloudinary(avatarLocalPath);

    if (!avatarUploaded || !avatarUploaded.url) {
        throw new ApiError(400, "Error uploading new avatar");
    }

    user.avatar = {
        url: avatarUploaded.url,
        public_id: avatarUploaded.public_id
    };

    await user.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(new ApiResponse(200, user, "Avatar updated successfully"));
});

const updateUserCoverImage = AsyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path

    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover image file is missing")
    }

    const coverImage = await uploadCloudinary(coverImageLocalPath)

    if (!coverImage.url) {
        throw new ApiError(400, "Error while uploading on avatar")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        { new: true }
    ).select("-password")

    return res
        .status(200)
        .json(
            new ApiResponse(200, user, "Cover image updated successfully")
        )
});

const getUserInfo = AsyncHandler(async (req, res) => {
    const { username } = req.params;

    if (!username?.trim()) {
        throw new ApiError(400, "Cant get username");
    }

    const channel = await User.aggregate(
        [{
            $match: {
                username: username.toLowerCase()
            }
        }, {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        }, {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        }, {
            $addFields: {
                subsCount: {
                    $size: "$subscribers"
                },
                i_SubbedTo: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                        then: true,
                        else: false
                    }
                }
            }
        }, {
            $project: {
                username: 1,
                fullname: 1,
                avatar: 1,
                coverImage: 1,
                createdAt: 1,
                isSubscribed: 1,
                subsCount: 1,
                i_SubbedTo: 1,
            }
        }]);

    if (!channel?.length) {
        throw new ApiError(400, "No channel found");
    }

    console.log("Channel------>", channel);

    res
        .status(200)
        .json(
            new ApiResponse(200, channel[0], "User channel fetched successfully")
        );
});

const getWatchhistory = AsyncHandler(async (req, res) => {

    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        }, {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "userHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "users",
                            pipeline: [
                                {
                                    $project: {
                                        owner: 1,
                                        title: 1,
                                        views: 1,
                                        thumbnail: 1,
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            owner: {
                                $first: "$users"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "Watch history fetched successfully",
                user[0]?.userHistory || []
            )
        )
});

export {
    userRegister, userLogin, userLogout, userRefreshAccessToken,
    changePassword, changeUserInfo, changeAvatar, getUserInfo, getWatchhistory,
    updateUserCoverImage, getCurrentUser
}
