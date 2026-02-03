import { execFile } from "child_process";
import ffprobe from "ffprobe-static";
import {exec} from "child_process" //very dangerous command
import ffmpegPath from "ffmpeg-static";
import mongoose from "mongoose";
export const getVideoDuration = (videoPath) => {
  return new Promise((resolve, reject) => {
    execFile(
      ffprobe.path,
      [
        "-v",
        "error",
        "-show_entries",
        "format=duration",
        "-of",
        "default=noprint_wrappers=1:nokey=1",
        videoPath
      ],
      (err, stdout) => {
        if (err) return reject(err);

        const duration = Math.round(parseFloat(stdout));
        resolve(duration);
      }
    );
  });
};
export const transcodeResolution=(inputPath,outputDir,label,height)=>{
  return new Promise((resolve,reject)=>{
    ffmpegPath(inputPath).outputOptions([
      "-c:v", "libx264",          // H.264 video codec
      "-c:a", "aac",              // AAC audio codec
      "-vf", `scale=-2:${height}`,// keep width even, set height
      "-b:v", height === 360 ? "400k" : "1200k",   // video bitrate
      "-b:a", "128k",             // audio bitrate
      "-f", "hls",                // output format: HLS
      "-hls_time", "10",          // segment length in seconds
      "-hls_list_size", "0",      // keep ALL segments in playlist
      "-hls_flags", "delete_segments" //clean old segments
    ]).output(path.join(outputDir,`${label}.m3u8`))
    .on("end",   () => resolve())
    .on("error", (err) => reject(err))
    .run();
  })
};
export const transcodeToHLS=async(rawVideoPath)=>{
  const uniqueId=new mongoose.Types.ObjectId().toString();
}


export default getVideoDuration;
