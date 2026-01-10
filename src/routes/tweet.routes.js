import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { deleteTweet, updateTweet, uploadTweet } from "../controllers/tweet.controller.js";
import rateLimiter from "../utils/RateLimiter.js";

const router=Router()
router.post("/upload-tweet",verifyJWT,rateLimiter({
    capacity:5,
    refillRate:1
}),uploadTweet)
router.delete("/delete-tweet",verifyJWT,rateLimiter({
    capacity:5,
    refillRate:1
}),deleteTweet)
router.patch("/update-tweet",verifyJWT,rateLimiter({
    capacity:5,
    refillRate:1
}),updateTweet)
export {router as tweetRouter}