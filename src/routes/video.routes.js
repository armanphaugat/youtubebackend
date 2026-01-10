import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import upload from "../middlewares/multer.middleware.js";
import { deleteVideo, makePrivate, updateThumbnail, updateTitle, uploadVideo ,makePublic} from "../controllers/video.controller.js";

const route=Router()
route.post("/upload-Video",verifyJWT,upload.fields([
    { name: "videofile", maxCount: 1 },
        { name: "thumbnailfile", maxCount: 1 }
]),uploadVideo)
route.delete("/delete-video",verifyJWT,deleteVideo)
route.patch("/update-thumbnail",verifyJWT,upload.single("thumbnailFile"),updateThumbnail)
route.patch("/update-title",verifyJWT,updateTitle)
route.patch("/make-private",verifyJWT,makePrivate)
route.patch("/make-public",verifyJWT,makePublic)
export {route as videoRouter}