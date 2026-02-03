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

export default getVideoDuration;
