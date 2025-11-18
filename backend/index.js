const express = require('express');
const cors = require('cors');
const { transcribeAudio } = require('./services/transcriptionService');
const app = express();
const PORT = 8080;

// --- MIDDLEWARE ---
app.use(cors());
app.use(express.json());

// --- ROUTES ---
app.get('/api/test', (req, res) => {
  console.log("Received a request at /api/test");
  res.json({ message: "Hello from the Express backend! 👋" });
});

// --- TEMPORARY TEST ROUTE ---
// Usage: Make a POST request with a JSON body: { "filePath": "./sample.mp3" }
app.post('/api/test-transcription', async (req, res) => {
  try {
    const { filePath } = req.body;
    
    if (!filePath) {
      return res.status(400).json({ error: 'File path is required' });
    }

    const transcript = await transcribeAudio(filePath);
    
    // Send back the words array so we can see the timestamps
    res.json({ 
      message: "Success", 
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