require('dotenv').config();

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path')
const ffmpegService = require('./services/ffmpegService');
const { transcribeAudio, filterblackList } = require('./services/transcriptionService');

const app = express();
// Render (and most hosts) inject the port to bind via process.env.PORT.
const PORT = process.env.PORT || 8080;

// const multer = require('multer');

const allowedOrigins = [
  "http://localhost:3000/",
  process.env.FRONTEND_URL
]

// --- MIDDLEWARE ---
var corsOptions = {
  origin: allowedOrigins
}

app.use(cors(corsOptions))
app.use(express.json());

// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, 'uploads')
//   },
//   filename: function (req, file, cb) {
//     cb(null, file.originalname)
//   }
// });

// const upload = multer({storage});


// --- ROUTES ---
app.get('/api/test', (req, res) => {
  console.log("Received a request at /api/test");
  res.json({ message: "Hello from the Express backend! 👋" });
});

app.post("/api/upload", ffmpegService.upload.single('file'), (req, res) => {
  console.log("Request From Upload")
  res.send("Upload Complete");
});

app.post("/api/extractAudio", (req, res) => {
  ffmpegService.extractAudio("uploads/input.mp4");
  res.send("Audio Extracted")
})

app.post('/api/mergeAudioVideo', (req, res) => {
  ffmpegService.mergeAudioVideo("uploads/input.mp4", "test.mp3");
  res.send("Complete");
})

// --- TEMPORARY TEST ROUTE ---
// Usage: Make a POST request with a JSON body: { "filePath": "./sample.mp3" }
app.post('/api/test-transcription', async (req, res) => {
  try {
    const { filePath } = req.body;
    
    if (!filePath) {
      return res.status(400).json({ error: 'File path is required' });
    }

    // Transcribes test.mp3 audio file
    const transcript = await transcribeAudio(filePath);
    // Filters out black listed words in list
    const filteredWords = filterblackList(transcript.words);
    const filteredTranscript = filteredWords.map(w => w.text).join(" ");
    
    // Send back the words array so we can see the timestamps
    res.json({ 
      message: "Success", 
      // transcript: filteredTranscript,
      words: filteredWords 
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/video/:filename", async (req, res) => {
  //Extract filename passed to url
  
  const { filename } = req.params;

  //Validate File Extension
  const supportedFileTypes = ["mp4", "mov"];
  const extension = filename.split(".").pop().toLocaleLowerCase();
  try{
    if(!supportedFileTypes.includes(extension)){
      return res.status(404).json({error: "Unsupported file format"});
    }

  //Store only the file name and uploads folder path
  //Combine for final path location of the requested video
    const finalFileName = path.basename(filename);
    const finalUploadFolder = path.join(__dirname, 'uploads');

    const finalVideoPath = path.join(finalUploadFolder, finalFileName);



    if(!fs.existsSync(finalVideoPath)){
      console.log("Error");
      return res.status(404).json({error : "file not found on the server"});
    };

    res.sendFile(finalVideoPath);
  }catch(e){
    return res.status(404).json({error : "Server Error"})
    console.log(e.message)
  };

});

app.post("/api/process-video", ffmpegService.upload.single("file"), async (req, res) => {
  let videoPath = null;
  let audioPath = null;

  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    videoPath = req.file.path;
    audioPath = `uploads/${req.file.filename}.mp3`;

    // Parse custom word list BEFORE transcription
    let submittedWordList = null;

    if (req.body.wordList) {
      try {
        submittedWordList = JSON.parse(req.body.wordList);
      } catch (error) {
        console.error("Invalid wordList JSON:", error);
        return res.status(400).json({ error: "Invalid word list format" });
      }
    }

    console.log(`Processing: ${videoPath}`);
    console.log("Submitted word list:", submittedWordList);

    await ffmpegService.extractAudio(videoPath, audioPath);

    const transcript = await transcribeAudio(audioPath, submittedWordList);

    const processedWords = filterblackList(
      transcript.words,
      submittedWordList
    );

    res.json({
      message: "Processing Complete",
      words: processedWords,
      filename: req.file.filename,
      videoUrl: `/api/video/${req.file.filename}`
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Processing failed" });
  } finally {
    if (audioPath && fs.existsSync(audioPath)) {
      fs.unlink(audioPath, (err) => {
        if (err) console.error("Failed to delete audio:", err);
      });
    }
  }
});

app.post("/api/export-video", express.json(), async (req, res) => {
  try {
    const { filename, censorshipSegments } = req.body;

    if (!filename || !censorshipSegments) {
      return res.status(400).json({ error: "Filename and segments required" });
    }

    const inputPath = `uploads/${filename}`;
    const outputPath = `uploads/censored_${filename}`;

    console.log(`Processing export for: ${filename} with ${censorshipSegments.length} mutes.`);

    if (!fs.existsSync(inputPath)) {
        console.error("Input file not found:", inputPath);
        return res.status(404).json({ error: "Original video file expired or not found." });
    }

    // 1. Run the FFmpeg Job
    await ffmpegService.censorVideo(inputPath, outputPath, censorshipSegments);

    // 2. Send the file back to the user
    // res.download automatically sets the headers for a file download
    res.download(outputPath, `censored_video.mp4`, (err) => {
      if (err) {
        console.error("Download error:", err);
        // Note: Can't send JSON error here if headers are already sent
      }
      if (fs.existsSync(outputPath)) {
        fs.unlink(outputPath, () => {});
      }
    });

  } catch (error) {
    console.error("Export failed:", error);
    res.status(500).json({ error: "Export failed" });
  }
});

// --- START SERVER ---
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});