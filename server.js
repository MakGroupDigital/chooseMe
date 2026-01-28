import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 8080;

// Lire le fichier index.html
const indexPath = join(__dirname, 'dist', 'index.html');
let indexHtml = readFileSync(indexPath, 'utf-8');

// Injecter la config Firebase depuis les variables d'environnement
const firebaseConfig = process.env.FIREBASE_WEBAPP_CONFIG || JSON.stringify({
  apiKey: 'AIzaSyCtL0WmFOvrcG0V_0ZSwq4TCnOHRVfGnJM',
  authDomain: 'choose-me-l1izsi.firebaseapp.com',
  projectId: 'choose-me-l1izsi',
  storageBucket: 'choose-me-l1izsi.firebasestorage.app',
  messagingSenderId: '5765431920',
  appId: '1:5765431920:web:7e8f5ae884de10f7ef2ab5'
});

// Injecter le script avant la fermeture du </head>
indexHtml = indexHtml.replace(
  '</head>',
  `<script>window.FIREBASE_WEBAPP_CONFIG = ${firebaseConfig};</script></head>`
);

// Serve static files from dist directory (JS, CSS, images, etc.)
app.use(express.static(join(__dirname, 'dist'), {
  setHeaders: (res, path) => {
    // S'assurer que les fichiers JS ont le bon MIME type
    if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    }
  }
}));

// Handle SPA routing - send modified index.html only for HTML requests
app.get('*', (req, res) => {
  // Ne pas intercepter les requêtes pour les assets
  if (req.path.includes('.')) {
    return res.status(404).send('Not found');
  }
  res.send(indexHtml);
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
