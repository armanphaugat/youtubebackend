import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import User from "../models/user.model.js";
import uploadOncloudinary from "../utils/cloudnary.js";
import ApiResponse from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"
import dotenv from "dotenv"
import mongoose from "mongoose";
import { Tweet } from "../models/tweet.model.js";
dotenv.config()
const generateAccessAndRefereshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        if (!user) throw new Error("User not found");

        console.log("User found for token generation:", user._id);

        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        console.log("Generated tokens:", { accessToken, refreshToken });

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (err) {
        console.error("Error in generateAccessAndRefereshTokens:", err);
        throw new ApiError(500, "Token generation failed");
    }
};

const registerUser = asyncHandler(async (req, res) => {
    const { fullName, email, username, password } = req.body;
    console.log("FILES:", req.files);
    console.log(req.body);
    if(fullName==="") throw new ApiError(400,"Fullname Required")
    if(email==="") throw new ApiError(400,"Email Required")
    if(username==="") throw new ApiError(400,"Username Required")
    if(password==="") throw new ApiError(400,"Password Required")

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    });

    if (existedUser) {
        throw new ApiError(409, "User already exists");
    }

    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    const coverimageLocalPath = req.files?.coverimage?.[0]?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required");
    }

    const avatar = await uploadOncloudinary(avatarLocalPath);

    let coverImage;
    if (coverimageLocalPath) {
        coverImage = await uploadOncloudinary(coverimageLocalPath);
    }

    if (!avatar) {
        throw new ApiError(400, "Avatar upload failed");
    }

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    });

    const createdUser = await User.findById(user._id)
        .select("-password -refreshToken");

    return res.status(201).json(
        new ApiResponse(201, createdUser, "User Registered Successfully")
    );
});

const loginUser=asyncHandler(async (req,res)=>{
    ///req body->data
    ///username--email
    ///find the user
    ///check for the password
    ///access and refresh token
    ///send cookies
    ///send response
    const {username,email,password}=req.body
    if(!username && !email) throw new ApiError(400,"Enter The Credentials")
    const user=await User.findOne({
    $or:[{username},{email}]
    })
    if(!user) throw new ApiError(404,"User does not Exist")
    const isPasswordValid=await user.isPasswordCorrect(password)
    if(!isPasswordValid) throw new ApiError(401,"Password is Invalid")
    const {accessToken,refreshToken}=await generateAccessAndRefereshTokens(user._id)
    const loggedInUser=await User.findById(user._id).select("-password -refreshToken")
        const options={
            httpOnly:true,///only modify by server(cookie)
            secure:true
        }
    return res.status(200).cookie("accessToken",accessToken,options).cookie("refreshToken",refreshToken,options).json(
        new ApiResponse(200,{user:loggedInUser,accessToken,refreshToken},"User Logged In")
    )
})
const logoutUser=asyncHandler(async(req,res)=>{
    const user=await User.findByIdAndUpdate(req.user._id,{$set:{
        refreshToken:null
    }})
    const options={
        httpOnly:true,///only modify by server(cookie)
        secure:true
    }
    return res.status(200).clearCookie("accessToken",options).clearCookie("refreshToken",options).json(
        new ApiResponse(200,{},"User Logged Out")
    )
})
const refreshAccessToken=asyncHandler(async(req,res)=>{
    const incomingRefreshToken=req.cookies.refreshToken || req.body.refreshToken
    if(!incomingRefreshToken) throw new ApiError(401,"Unauthorised Request")
    try {
        const decodedToken=jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
        const user=await User.findById(decodedToken._id)
        if(!user) throw new ApiError(401,"InValid Refresh Token")
        if(user.refreshToken!==incomingRefreshToken) throw new ApiError(401,"RefreshToken is expired")
        const options={
            httpOnly:true,
            secure:true
        }
        const {accessToken,refreshToken}=await generateAccessAndRefereshTokens(user._id)
        return res.status(200).cookie("accessToken",accessToken,options).cookie("refreshToken",refreshToken,options).json(
            new ApiResponse(200,{accessToken,refreshToken},"Access Token Refreshed Successfully")
        )
    } catch (error) {
        throw new ApiError(401,error?.message || "Invalid Refresh Token")
    }
})
const changecurrentPassword=asyncHandler(async(req,res)=>{
    const {oldpassword,newpassword}=req.body
    const user=await User.findById(req.user?._id)
    if(!user) throw new ApiError(401,"Invalid User")
    const isPasswordCorrect=await user.isPasswordCorrect(oldpassword)
    if(!isPasswordCorrect) throw new ApiError(401,"Invalid Password")
    user.password=newpassword
    await user.save({validateBeforeSave:false})
    return res.status(200).json(
        new ApiResponse(200,{},"Password Changed")
    )
})

const getCurrentUser=asyncHandler(async (req,res) => {
    return res.status(200).json(
        new ApiResponse(200,req.user,"Current User Fetched Successfully")
    )
})
const updateAccountDetails=asyncHandler(async(req,res)=>{
    const {fullName,email}=req.body
    if(!fullName || !email) throw new ApiError(400,"All fields are Required")
    const user=await User.findByIdAndUpdate(req.user?._id,
        {
            $set:{
                fullName:fullName,
                email:email
            }
        },
        {new:true}
    ).select("-password")
    if(!user) throw new ApiError(400,"User Not Found")
    return res.status(200).json(
        new ApiResponse(200,user,"Account Details Updated SuccessFully")
    )
})
const updateUserAvatar=asyncHandler(async(req,res)=>{
    const user=await User.findById(req.user._id)
    const updatedlocalFileavatar=req.file?.path
    if(!updatedlocalFileavatar)  throw new ApiError(400,"File not Uploaded")
    const newavatar=await uploadOncloudinary(updatedlocalFileavatar)
    if (!newavatar) {
        throw new ApiError(400, "Avatar upload failed");
    }
    user.avatar=newavatar.url;
    await user.save({validateBeforeSave:false})
    return res.status(200).json(
        new ApiResponse(200, { avatar: user.avatar }, "Avatar Updated Successfully")
    )
})
const getUserChannelProfile=asyncHandler(async(req,res)=>{
    const {username}=req.params
    if(!username?.trim()) throw new ApiError(400,"Username is Missing")
    const channel=await User.aggregate([
        {
            $match:{
                username:username?.toLowerCase()
            }
        },{
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"channel",
                as:"subscribers"
            }
        },{
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"subscriber",
                as:"subscribedTo"
            }
        },{
            $addFields:{
                subscribersCount:{
                    $size:"$subscribers"
                },
                channelsSubscribedToCount:{
                    $size:"$subscribedTo"
                },
                isSubscribed:{
                    $cond:{
                        if:{$in:[req.user?._id,"$subscribers.subscriber"]},
                        then :true,
                        else:false
                    }
                }
            }
        },{
            $project:{
                fullName:1,
                username:1,
                subscribersCount:1,
                channelsSubscribedToCount:1,
                isSubscribed:1,
                avatar:1,
                email:1
            }
        }
    ])
    if(!channel?.length) throw new ApiError(404,"Channel does not exists")
    return res.status(200).json(
        new ApiResponse(200,channel[0],"User channel Fetched Succesfully")
    )
})
const getWatchHistory=asyncHandler(async(req,res)=>{
    const user=await User.aggregate([
        {
            $match:{
                _id:new mongoose.Types.ObjectId(req.user._id)
            }
        },{
            $lookup:{
                from:"Videos",
                localField:"watchHistory",
                foreignField:"_id",
                as:"watchHistory",
                pipeline:[
                    {
                        $lookup:{
                            from:"users",
                            localField:"owner",
                            foreignField:"_id",
                            as:"owner",
                            pipeline:[
                                {
                                    $project:{
                                        fullName:1,
                                        username:1,
                                        avatar:1
                                    }
                                }
                            ]
                        }
                    },{
                        $addFields:{
                            owner:{
                                $first:"$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])
    return res.status(200).json(
        new ApiResponse(200,user[0].watchHistory,"Watch History")
    )
})
const getAllTweets=asyncHandler(async(req,res)=>{
    const userId=req.user._id
    if(!userId) throw new ApiError(404,"Please Log In")
    const tweets=await Tweet.aggregate([
        {
        $match:{
            owner:new mongoose.Types.ObjectId(userId)
        }
        },
        {
            $lookup:{
                from:"users",
                localField:"owner",
                foreignField:"_id",
                as:"owner"
            }
        },
        {
            $unwind:"$owner"
        },{
            $project:{
                content:1,
                createdAt:1
            }
        },
        {
            $sort:{createdAt:-1}
        }
    ])
    return res.status(201).json(
        new ApiResponse(201,{tweets},"All tweets Fetched")
    )
})
export {registerUser,loginUser,logoutUser,refreshAccessToken,changecurrentPassword,getCurrentUser,updateAccountDetails,updateUserAvatar,getUserChannelProfile,getWatchHistory,getAllTweets};
