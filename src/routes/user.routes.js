import { Router } from "express";
import  { registerUser,loginUser, logoutUser,refreshAccessToken, changecurrentPassword, getCurrentUser, updateAccountDetails, updateUserAvatar, getUserChannelProfile, getWatchHistory, getAllTweets } from "../controllers/user.controller.js";
import upload from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { get } from "mongoose";

const router = Router();
router.post(
    "/register",
    upload.fields([
        { name: "avatar", maxCount: 1 },
        { name: "coverimage", maxCount: 1 }
    ]),
    registerUser
);
router.post("/login",loginUser)
router.post("/logout",verifyJWT,logoutUser)
router.post("/refresh-token",verifyJWT,refreshAccessToken)
router.post("/change-password",verifyJWT,changecurrentPassword)
router.get("/current-user",verifyJWT,getCurrentUser)
router.patch("/update-user",verifyJWT,updateAccountDetails)
router.patch("/update-avatar",verifyJWT,upload.single("avatar"),updateUserAvatar)
router.get("/user-channel",verifyJWT,getUserChannelProfile)
router.get("/watch-history",verifyJWT,getWatchHistory)
router.get("/get-tweets",verifyJWT,getAllTweets)
export {router as userRouter};
