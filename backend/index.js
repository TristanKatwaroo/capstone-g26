const express = require('express');
const cors = require('cors');
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

// --- START SERVER ---
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});