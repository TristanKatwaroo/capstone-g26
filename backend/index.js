const express = require('express');
const cors = require('cors');
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

// --- START SERVER ---
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});