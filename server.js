const express = require('express');
const path = require('path');
const compression = require('compression');
const app = express();
const port = process.env.PORT || 3000;

// Enable Gzip compression for all text-based responses to reduce payload size
app.use(compression());

// Serve static files from the build directory with caching policies
app.use(express.static(path.join(__dirname, 'dist'), {
  maxAge: '1y', // Cache static assets (JS, CSS, Images) for 1 year
  etag: false,
  setHeaders: (res, filePath) => {
    // Don't cache index.html so updates are reflected immediately
    if (path.basename(filePath) === 'index.html') {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
  }
}));

// Handle SPA routing: serve index.html for any unknown route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`CoachFlow server running on port ${port}`);
});