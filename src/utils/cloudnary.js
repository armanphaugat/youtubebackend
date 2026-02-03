import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
dotenv.config()
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET
});

const VIDEO_EXTENSIONS = new Set([".mp4", ".webm", ".mov", ".avi", ".mkv", ".flv", ".wmv", ".m4v"]);

const getResourceType = (filePath) => {
    const ext = path.extname(filePath).toLowerCase();
    return VIDEO_EXTENSIONS.has(ext) ? "video" : "image";
};

const uploadOncloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;

        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: getResourceType(localFilePath)
        });

        fs.unlinkSync(localFilePath);
        return response;

    } catch (error) {
        console.error("Cloudinary Error:", error.message);
        if (localFilePath && fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }
        return null;
    }
};

export default uploadOncloudinary;