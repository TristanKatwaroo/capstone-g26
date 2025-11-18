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
    })

    console.log("Extracting Audio...")
};

module.exports = { extractAudio, upload, storage }