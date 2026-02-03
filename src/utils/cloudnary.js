import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config()
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET
});

const uploadOncloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;

        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "image"
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
export const uploadResolutionToCloudinary=async(outputDir,label)=>{
    const allFiles=fs.readdirSync(outputDir)
    const tsFiles=allFiles.filter(f => f.startsWith(`${label}_`) && f.endsWith(".ts")).sort()
    const segmentUrls={}
    for (const tsfile of tsFiles){
        const res=await cloudinary.uploader.upload(
            path.join(outputDir,tsfile),{ resource_type: "raw", public_id: `hls/${tsFile}` }
        )
        segmentUrls[tsfile]=res.url
    }
    const playlistPath = path.join(outputDir, `${label}.m3u8`);
    let   playlistText = fs.readFileSync(playlistPath, "utf-8");
    for (const [filename, url] of Object.entries(segmentUrls)) {
        playlistText = playlistText.replace(filename, url);
    }
    fs.writeFileSync(playlistPath, playlistText);
    const playlistRes = await cloudinary.uploader.upload(playlistPath, {
        resource_type: "raw",
        public_id: `hls/${label}.m3u8`
    });
    return playlistRes.url;
}
const uploadMasterPlaylist = async (outputDir, resolutionUrls) => {
    const masterPath = path.join(outputDir, "master.m3u8");
    let   masterText = fs.readFileSync(masterPath, "utf-8");
    masterText = masterText.replace("360p.m3u8", resolutionUrls["360p"]);
    masterText = masterText.replace("720p.m3u8", resolutionUrls["720p"]);
    fs.writeFileSync(masterPath, masterText);
    const res = await cloudinary.uploader.upload(masterPath, {
        resource_type: "raw",
        public_id: "hls/master.m3u8"
    });
    return res.url;
};
export default uploadOncloudinary;
