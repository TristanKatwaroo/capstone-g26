const express = require('express');
const cors = require('cors');

const ffmpegService = require('./services/ffmpegService');
const { transcribeAudio, filterblackList } = require('./services/transcriptionService');

const app = express();
const PORT = 8080;

// const multer = require('multer');


// --- MIDDLEWARE ---
app.use(cors());
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

app.post("/api/process-video", ffmpegService.upload.single('file'), async (req, res) => {
  try {
    const videoPath = req.file.path;
    const audioPath = `uploads/${req.file.filename}.mp3`; // Determine output path

    // 1. Extract Audio (Await your new Promise-based function)
    await ffmpegService.extractAudio(videoPath, audioPath);

    // 2. Transcribe
    const transcript = await transcribeAudio(audioPath);

    console.log("\n🔍 --- FULL TRANSCRIPT ANALYSIS ---");
    transcript.words.forEach((word, index) => {
      console.log(
        `[${index}] Word: "${word.text}" | Confidence: ${(word.confidence * 100).toFixed(1)}%`
      );
    });
    console.log("------------------------------------\n");

    // 3. Filter
    const processedWords = filterblackList(transcript.words);

    // 4. Respond
    res.json({ 
      message: "Processing Complete", 
      words: processedWords 
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Processing failed" });
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

    // 1. Run the FFmpeg Job
    await ffmpegService.censorVideo(inputPath, outputPath, censorshipSegments);

    // 2. Send the file back to the user
    // res.download automatically sets the headers for a file download
    res.download(outputPath, `censored_${filename}`, (err) => {
      if (err) {
        console.error("Download error:", err);
        // Note: Can't send JSON error here if headers are already sent
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