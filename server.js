const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Simple zero-dependency utility to load environment variables from .env file if it exists
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  console.log('Loading local .env configuration variables...');
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split(/\r?\n/).forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const index = trimmed.indexOf('=');
      if (index !== -1) {
        const key = trimmed.slice(0, index).trim();
        const val = trimmed.slice(index + 1).trim().replace(/^['"]|['"]$/g, ''); // strip optional quotes
        if (key) {
          process.env[key] = val;
        }
      }
    }
  });
}

// Middleware to parse incoming JSON payloads
app.use(express.json());

// Serve static frontend files from current directory
app.use(express.static(__dirname));

// Route `/api/contact` requests to the exact same Vercel contact controller
const contactHandler = require('./api/contact');
app.post('/api/contact', contactHandler);

// Fallback to serve index.html for undefined requests
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start listening
app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 Alpha Tech Solutions Local Development Server Live!`);
  console.log(`🔗 Web Address: http://localhost:${PORT}`);
  console.log(`⚙️  Mail Route : POST http://localhost:${PORT}/api/contact`);
  console.log(`=======================================================`);
});
