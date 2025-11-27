const express = require('express');
const cors = require('cors');
const { transcribeAudio, filterblackList } = require('./services/transcriptionService');
const app = express();
const PORT = 8080;

const multer = require('multer');


// --- MIDDLEWARE ---
app.use(cors());
app.use(express.json());

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads')
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname)
  }
});

const upload = multer({storage});


// --- ROUTES ---
app.get('/api/test', (req, res) => {
  console.log("Received a request at /api/test");
  res.json({ message: "Hello from the Express backend! 👋" });
});

app.post("/api/upload", upload.single('file'), (req, res) => {
  res.send("upload complete")
  //res.json(req.file)
});

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
      transcript: filteredTranscript,
      words: transcript.words 
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- START SERVER ---
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});