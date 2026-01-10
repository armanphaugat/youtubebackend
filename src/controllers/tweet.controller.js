import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { Tweet } from "../models/tweet.model.js";
const uploadTweet=asyncHandler(async (req,res)=>{
    const user=req.user._id
    if(!user) throw new ApiError(400,"User Must be Logged In")
    const {context}=req.body
    if(!context) throw new ApiError(400,"Please Enter The Tweet")
    if(context.length>280) throw new ApiError(400,"Word Must Be Less than The 280")
    const tweet=await   Tweet.create({
        owner:user,content:context
    })
    return res.status(200).json(
        new ApiResponse(200,{tweet},"Tweet Created!")
    )
})
const deleteTweet=asyncHandler(async(req,res)=>{
    const {tweetId}=req.body
    if(!tweetId) throw new ApiError(400,"Please Provide TweetId")
    const tweet=Tweet.findByIdAndDelete(tweetId)
    if(!tweet) throw new ApiError(400,"Tweet Not Found")
    return res.status(201).json(
        new ApiResponse(201,{},"TweetDeletedSuccessFully")
    )
})
const updateTweet=asyncHandler(async(req,res)=>{
    const {tweetId,updatedContent}=req.body
    if(!tweetId) throw new ApiError(400,"Please Provide TweetId")
    if(!updatedContent || updatedContent.length>280) throw new ApiError(400,"Please Provide Updated Tweet")
    const tweet=await Tweet.findById(tweetId)
    if(!tweet) throw new ApiError(404,"Tweet Not Found")
    if (tweet.owner.toString() !== req.user._id.toString()) throw new ApiError(403, "Not authorized to update this tweet");
    tweet.content=updatedContent
    await tweet.save()
    return res.status(200).json(
        new ApiResponse(200,{tweet},"Tweet Updated Succesfully" )
    )
})
export {uploadTweet,deleteTweet,updateTweet}