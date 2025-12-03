const { spawn } = require('child_process');
const path = require('path');

// const ffmpegpath = './ffmpeg/ffmpeg.exe'
const ffmpegpath = 'ffmpeg'


const multer = require('multer');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads')
  },
  filename: function (req, file, cb) {
    // Generate a unique suffix: Timestamp + Random Number
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    
    // Create new name: fieldname-uniqueSuffix.extension
    // Example: file-168392019-482910.mp4
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({storage});


function extractAudio(input_file, output_file) {
    return new Promise((resolve, reject) => {
        const ffmpegProcess = spawn(ffmpegpath, ["-i", input_file, output_file]);
        
        ffmpegProcess.on('error', (error) => {
            console.log(`error: ${error.message}`);
            reject(error);
        });
        
        ffmpegProcess.on("close", (code) => {
            if (code === 0) {
                console.log("Audio Successfully Extracted.");
                resolve();
            } else {
                console.log(`Error Extracting Audio. Code ${code}`);
                reject(new Error(`FFmpeg exited with code ${code}`));
            }
        });
    });
};

function mergeAudioVideo(videofile, audiofile){

  const ffmpegProcess = spawn(ffmpegpath, ["-i", videofile, "-i", audiofile, "-c:v", "copy", "-c:a", "aac", "-map", "0:v:0", "-map", "1:a:0", "uploads/output.mp4"]);

  ffmpegProcess.on("error", (error) => [
    console.log(`error: ${error.message}`)
  ]);
  ffmpegProcess.stderr.on("data", (data) => {
    console.log(`stderr: ${data}`);
  });
  ffmpegProcess.on("close", (code) => {
    if(code==0){
      console.log("Mergeing audio and video successful");
    }else{
      console.log(`Error merging audio and video ${code}`);
    }
  });
}

/**
 * Creates a new video file with audio muted at specific intervals.
 * @param {string} inputFile - Path to the source video (e.g., 'uploads/input.mp4')
 * @param {string} outputFile - Path for the result (e.g., 'uploads/censored_input.mp4')
 * @param {Array} muteSegments - Array of objects { start: number, end: number } in seconds
 */
function censorVideo(inputFile, outputFile, muteSegments) {
  return new Promise((resolve, reject) => {
    // 1. Construct the FFmpeg filter string
    // It looks like: volume=0:enable='between(t,start1,end1)+between(t,start2,end2)...'
    
    let volumeFilter = "";
    
    if (muteSegments.length > 0) {
      const betweenFilters = muteSegments.map(seg => {
        // Ensure we have valid numbers
        const start = parseFloat(seg.start).toFixed(3);
        const end = parseFloat(seg.end).toFixed(3);
        return `between(t,${start},${end})`;
      });
      
      // Combine them with '+' (logical OR for the enable flag)
      volumeFilter = `volume=0:enable='${betweenFilters.join('+')}'`;
    } else {
      // If no segments, just pass audio through unchanged (volume=1)
      volumeFilter = "volume=1";
    }

    console.log(`🎬 Running FFmpeg Censor...`);

    // 2. Spawn the FFmpeg process
    const ffmpegProcess = spawn(ffmpegpath, [
      "-i", inputFile,       // Input
      "-filter:a", volumeFilter, // Apply our dynamic audio filter
      "-c:v", "copy",        // Copy video stream (FAST! Don't re-encode video)
      "-y",                  // Overwrite output if exists
      outputFile
    ]);

    // 3. Handle Events
    ffmpegProcess.stderr.on("data", (data) => {
      // console.log(`ffmpeg: ${data}`); // Uncomment for debugging
    });

    ffmpegProcess.on("close", (code) => {
      if (code === 0) {
        console.log("✅ Censored video created successfully.");
        resolve(outputFile);
      } else {
        console.error(`❌ FFmpeg failed with code ${code}`);
        reject(new Error(`FFmpeg error code ${code}`));
      }
    });
  });
}

module.exports = { extractAudio, mergeAudioVideo, censorVideo, upload, storage };