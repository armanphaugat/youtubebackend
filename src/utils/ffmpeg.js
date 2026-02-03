import { execFile } from "child_process";
import ffprobe from "ffprobe-static";
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
const transcodeResolution = (inputPath, outputDir, label, height) => {
    return new Promise((resolve, reject) => {
        ffmpeg(inputPath)
        .outputOptions([
                "-c:v", "libx264",          // H.264 video codec
                "-c:a", "aac",              // AAC audio codec
                "-vf", `scale=-2:${height}`,// keep width even, set height
                "-b:v", height === 360 ? "400k" : "1200k",   // video bitrate
                "-b:a", "128k",             // audio bitrate
                "-f", "hls",                // output format: HLS
                "-hls_time", "10",          // segment length in seconds
                "-hls_list_size", "0",      // keep ALL segments in playlist
                "-hls_flags", "delete_segments" // optional: clean old segments
        ])
        .output(path.join(outputDir, `${label}.m3u8`))
        .on("end",   () => resolve())
        .on("error", (err) => reject(err))
        .run();
    });
};
export const transcodeToHLS=async(rawVideoPath)=>{
    const uniqueId  = new mongoose.Types.ObjectId().toString();
    const outputDir = path.join(process.cwd(), "public", "temp", `hls_${uniqueId}`);
    fs.mkdirSync(outputDir, { recursive: true });
    await Promise.all([
      transcodeResolution(rawVideoPath,outputDir,"240p",240),
      transcodeResolution(rawVideoPath,outputDir,"360p",360),
      transcodeResolution(rawVideoPath,outputDir,"720p",720),
    ])
    const master =
        `#EXTM3U\n` +
        `#EXT-X-STREAM-INF:BANDWIDTH=400000,RESOLUTION=640x360\n360p.m3u8\n` +
        `#EXT-X-STREAM-INF:BANDWIDTH=1200000,RESOLUTION=1280x720\n720p.m3u8\n`;
    const masterPath=path.join(outputDir,"master.m3u8")
    fs.writeFileSync(masterPath, master);
    return { outputDir, masterPath };
}
export default getVideoDuration;
