import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 8080;

// Serve static files from dist directory
app.use(express.static(join(__dirname, 'dist')));

// Handle SPA routing - send index.html for non-asset requests
app.get('*', (req, res) => {
  // Ne pas intercepter les requêtes pour les assets
  if (req.path.includes('.')) {
    return res.status(404).send('Not found');
  }
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
