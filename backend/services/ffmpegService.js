const { spawn } = require('child_process');

const ffmpegpath = './ffmpeg/ffmpeg.exe'


const multer = require('multer');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads')
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname)
  }
});

const upload = multer({storage});


function extractAudio(input_file){
    const ffmpegProcess = spawn(ffmpegpath, ["-i", input_file, "uploads/output.mp3"]);
    
    ffmpegProcess.on('error', (error) => {
        console.log(`error: ${error.message}`)
    });
    ffmpegProcess.stderr.on("data", (data) => {
        console.log(`stderr: ${data}`);
    });
    ffmpegProcess.on("close", (code) => {
        if(code===0){
            console.log("Audio Successfully Extracted.");
        } else {
            console.log(`Error Extracting Audio. Code ${code}`);
        }
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

module.exports = { extractAudio, mergeAudioVideo,upload, storage }