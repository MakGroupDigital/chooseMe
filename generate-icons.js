import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Script pour générer les favicons et icônes
async function generateIcons() {
  try {
    const sourceImage = path.join(__dirname, 'public/assets/images/app_launcher_icon.png');
    const publicDir = path.join(__dirname, 'public');
    
    console.log('🎨 Génération des favicons et icônes...');
    console.log('📁 Source:', sourceImage);
    
    // Vérifier que l'image source existe
    if (!fs.existsSync(sourceImage)) {
      console.error('❌ Image source introuvable:', sourceImage);
      process.exit(1);
    }
    
    // Créer les dossiers si nécessaire
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }
    
    // Générer les différentes tailles
    const sizes = [
      { name: 'favicon-16x16.png', size: 16 },
      { name: 'favicon-32x32.png', size: 32 },
      { name: 'apple-touch-icon.png', size: 180 },
      { name: 'android-chrome-192x192.png', size: 192 },
      { name: 'android-chrome-512x512.png', size: 512 },
    ];
    
    for (const { name, size } of sizes) {
      const outputPath = path.join(publicDir, name);
      await sharp(sourceImage)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .png()
        .toFile(outputPath);
      console.log(`✅ Créé: ${name} (${size}x${size})`);
    }
    
    // Générer favicon.ico (32x32)
    const faviconPath = path.join(publicDir, 'favicon.ico');
    await sharp(sourceImage)
      .resize(32, 32, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toFile(faviconPath);
    console.log('✅ Créé: favicon.ico');
    
    // Générer le manifest.json
    const manifest = {
      name: 'Choose-Me',
      short_name: 'Choose-Me',
      description: 'Elite Sports Scouting Platform',
      start_url: '/',
      display: 'standalone',
      background_color: '#050505',
      theme_color: '#208050',
      icons: [
        {
          src: '/android-chrome-192x192.png',
          sizes: '192x192',
          type: 'image/png'
        },
        {
          src: '/android-chrome-512x512.png',
          sizes: '512x512',
          type: 'image/png'
        }
      ]
    };
    
    const manifestPath = path.join(publicDir, 'manifest.json');
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    console.log('✅ Créé: manifest.json');
    
    console.log('\n🎉 Tous les favicons et icônes ont été générés avec succès!');
    console.log('\n📝 Prochaines étapes:');
    console.log('1. Mettre à jour index.html avec les liens vers les favicons');
    console.log('2. Tester dans le navigateur');
    
  } catch (error) {
    console.error('❌ Erreur lors de la génération:', error.message);
    process.exit(1);
  }
}

generateIcons();
