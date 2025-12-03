import AsyncHandler from "../utils/AsyncHandler.js"
import ApiError from "../utils/ApiError.js"
import User from "../models/user.models.js"
import uploadCloudinary from "../utils/Clodinary.js";
import ApiResponse from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"

const userRegister = AsyncHandler(async (req,res) =>{
    const {username,fullname,email,password} = req.body;

    if([username,fullname,email,password].some((field)=>
        field?.trim() === "")){
            throw new ApiError(409,"All fields are required!!");
    }

    const userExists = await User.findOne({
        $or:[{email},{username}]
    });//userExists doesnt return true or false....if found then 
        //return document obj(truthy) otherwise return null(falsy)

    if(userExists){
        throw new ApiError(409,"User already exists!!");
    }

    // console.log("-------------------");
    // console.log(userExists);
    // console.log("-------------------");

    // Check if files were uploaded
    if (!req.files || !req.files.avatar || req.files.avatar.length === 0) {
        throw new ApiError(400, "Avatar file is required");
    }

    const avatarLocalPath = req.files.avatar[0].path;
    
    let coverImageLocalPath = null;
    if(req.files?.coverImage && req.files.coverImage.length > 0){
        coverImageLocalPath = req.files.coverImage[0].path;
    }

    const avatarUploaded = await uploadCloudinary(avatarLocalPath);
    const coverImageUploaded = await uploadCloudinary(coverImageLocalPath);

    if(!avatarUploaded){
        throw new ApiError(500,"Error while uploading avatar image");
    }

    const user = await User.create({
        fullname,
        email,
        password,
        avatar : avatarUploaded.url,
        coverImage : coverImageUploaded?.url || "",
        username: username.toLowerCase()
    });
    
    const userCreated = await User.findById(user._id).select(
        "-password -refreshToken");

    return res.status(200).json(
        new ApiResponse(200,"User created Successfully",userCreated)
    )
});

const userLogin = AsyncHandler(async (req,res)=>{
    const {username,password} = req.body;

    if(username === ""){
        throw new ApiError(400,"Enter Username");
    }

    const userFound = await User
    .findOne({username:username.toLowerCase()});

    if(!userFound){
        throw new ApiError(400,"No user found! Create an account");
    }

    const isPasswordMatched = await userFound.comparePassword(password);

    if(!isPasswordMatched){
        throw new ApiError(400,"Invalid credentials");
    }

    // userFound.password = undefined;
    // userFound.refreshToken = undefined;

    const AccessToken = userFound.generateAccessToken()
    const RefreshToken = userFound.generateRefreshToken()

    userFound.refreshToken = RefreshToken;
    await userFound.save();

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // only secure over HTTPS in prod
        sameSite: process.env.NODE_ENV === 'production' ? 'Strict' : 'Lax'
    }

    // console.log("----------------------");
    // console.log(AccessToken);
    // console.log("----------------------");
    // console.log(RefreshToken);
    // console.log("----------------------");

    const userInfo = await User.findById(userFound._id).select("-refreshToken -password");

    res
    .status(200)
    .cookie('AccessToken', AccessToken, options)
    .cookie('RefreshToken', RefreshToken, options)
    .json(
        new ApiResponse(200, 'Login successful!!', userInfo)
    );
})

const userLogout = AsyncHandler(async(req,res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        { $set: {refreshToken: null} },
        {new:true},
    );

    const options = {
        httpOnly : true,
        secure : true
    }

    res
    .clearCookie("refreshToken",options)
    .clearCookie("accessToken",options)
    .json(new ApiResponse(200,"user logged-out successfully"));
}
)

const userRefreshAccessToken = AsyncHandler(async(req,res)=>{

    const currentRefresh = req.cookies?.RefreshToken
    || (req.headers?.authorization || '').replace('Bearer ', '');

    if(!currentRefresh){
        throw new ApiError(400, 'Authorisation Failed!');
    }

    let decoded;
    try{
        decoded = jwt.verify(currentRefresh, process.env.JWT_REFRESH_SECRET_KEY);
    }catch(err){
        throw new ApiError(400, 'Authorisation Failed!!');
    }

    const user = await User.findById(decoded._id);
    if(!user){
        throw new ApiError(400, 'Authorisation Failed!!!');
    }

    const options = {
        httpOnly: true,
        secure: true
    }

    // res
    // .status(200)
    // .clearCookie("accessToken", options)
    // .json(new ApiResponse(200,"Removed!!!"));

    console.log('Current refresh token:', currentRefresh);
    console.log('Stored refresh token:', user.refreshToken);
    console.log('Tokens match:', currentRefresh === user.refreshToken);

    if(currentRefresh !== user.refreshToken){
        throw new ApiError(400, 'Refresh token does not match stored token');
    }
    
    const accessToken = user.generateAccessToken();

    res
    .cookie('AccessToken', accessToken, options)
    .json(new ApiResponse(200, 'Access token refreshed', { accessToken }));

})


export {userRegister,userLogin,userLogout,userRefreshAccessToken}