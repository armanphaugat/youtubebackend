import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import uploadOncloudinary from "../utils/cloudnary.js";
import getVideoDuration from "../utils/ffmpeg.js";
import { Video } from "../models/video.model.js";
import fs from  "fs"
const uploadVideo=asyncHandler(async(req,res)=>{
    const videoLocalFilePath=req.files?.videofile?.[0]?.path
    const thumbnailLocalFilePath=req.files?.thumbnailfile?.[0]?.path
    if(!videoLocalFilePath) throw new ApiError(400,"Please Upload The Video")
    const duration=await getVideoDuration(videoLocalFilePath)
    const videourl=await uploadOncloudinary(videoLocalFilePath);
    let thumbnailurl;
    if(!thumbnailLocalFilePath) throw new ApiError(400,"Please Upload The Thumbnail")
    thumbnailurl=await uploadOncloudinary(thumbnailLocalFilePath)
    const {title}=req.body
    if(!title) throw new ApiError(400,"Please Enter The Title")
    const video=await Video.create({
        videofile:videourl.url,thumbnail:thumbnailurl.url,title,duration,owner:req.user._id
    })
    if(!video) throw new ApiError(500,"Internal Server Error")
    return res.status(201).json(
        new ApiResponse(201,video,"Video Uploaded Successfully")
    )
})
const deleteVideo=asyncHandler(async(req,res)=>{
    const videoId=req.body?.video._id
    if(!videoId) throw new ApiError(400,"Video Id required")
    const video=await Video.findById(videoId)
    if(!video) throw new ApiError(400,"Video Not Found")
    await video.remove()
    return res.status(200).json(
        new ApiResponse(200,{},"Video Deleted Successfully")
    )
})
const updateThumbnail=asyncHandler(async(req,res)=>{
    const videoId=req.body?.video._id
    if(!videoId) throw new ApiError(400,"Video Id required")
    const thumbnailLocalFilePath=req.file?.path
    if(!thumbnailLocalFilePath) throw new ApiError(400,"Upload The New Thumbnail")
    const thumbnail=await uploadOncloudinary(thumbnailLocalFilePath)
    if(!thumbnail) throw new ApiError(500,"Thumbnail Upload Failed")
    const video=await Video.findById(videoId)
    if(!video) throw new ApiError(404,"Video Not Found")
    video.thumbnail=thumbnail.url
    await video.save()
    return res.status(200).json(
        new ApiResponse(200, video, "Thumbnail updated successfully")
    )
})
const updateTitle=asyncHandler(async(req,res)=>{
    const videoId=req.body?.video._id
    const {title}=req.body
    if(!videoId) throw new ApiError(400,"Video Id required")
    const video=await Video.findById(videoId)
    if(!video) throw new ApiError(404,"Video Not Found")
    video.title=title
    await video.save()
    return res.status(200).json(
        new ApiResponse(200, video, "Title updated successfully")
    )
})
const makePrivate=asyncHandler(async(req,res)=>{
    const videoId=req.body?.video._id
    if(!videoId) throw new ApiError(400,"Video Id required")
    const video=await Video.findById(videoId)
    if(!video) throw new ApiError(404,"Video Not Found")
    video.isPublished=false
    await video.save()
    return res.status(200).json(
        new ApiResponse(200, video, "Video Privated successfully")
    )
})
const makePublic=asyncHandler(async(req,res)=>{
    const videoId=req.body?.video._id
    if(!videoId) throw new ApiError(400,"Video Id required")
    const video=await Video.findById(videoId)
    if(!video) throw new ApiError(404,"Video Not Found")
    video.isPublished=true
    await video.save()
    return res.status(200).json(
        new ApiResponse(200, video, "Video Publiced successfully")
    )
})
export {uploadVideo,deleteVideo,updateThumbnail,updateTitle,makePrivate,makePublic}