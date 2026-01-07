/**
 * Script para redimensionar screenshots a 1280x800 para Chrome Web Store
 * 
 * Uso:
 *   1. Coloca tus screenshots en esta carpeta (screenshots/)
 *   2. Ejecuta: node resize-screenshots.js
 *   3. Las imágenes redimensionadas se guardarán con prefijo "store_"
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const TARGET_WIDTH = 1280;
const TARGET_HEIGHT = 800;

async function resizeScreenshots() {
  const screenshotsDir = __dirname;
  const files = fs.readdirSync(screenshotsDir);
  
  // Filtrar solo imágenes (png, jpg, jpeg)
  const imageFiles = files.filter(file => {
    const ext = path.extname(file).toLowerCase();
    return ['.png', '.jpg', '.jpeg'].includes(ext) && !file.startsWith('store_');
  });

  if (imageFiles.length === 0) {
    console.log('❌ No se encontraron imágenes para redimensionar.');
    console.log('   Coloca tus screenshots (.png o .jpg) en esta carpeta.');
    return;
  }

  console.log(`📸 Encontradas ${imageFiles.length} imagen(es) para procesar...\n`);

  for (const file of imageFiles) {
    const inputPath = path.join(screenshotsDir, file);
    const outputName = `store_${path.basename(file, path.extname(file))}.png`;
    const outputPath = path.join(screenshotsDir, outputName);

    try {
      await sharp(inputPath)
        .resize(TARGET_WIDTH, TARGET_HEIGHT, {
          fit: 'cover',      // Recorta para llenar el tamaño exacto
          position: 'center' // Centra la imagen al recortar
        })
        .png({ quality: 100 })  // PNG sin compresión (24-bit, sin alpha)
        .flatten({ background: '#111b21' }) // Remueve transparencia con fondo oscuro
        .toFile(outputPath);

      console.log(`✓ ${file} → ${outputName} (${TARGET_WIDTH}x${TARGET_HEIGHT})`);
    } catch (error) {
      console.error(`✗ Error con ${file}:`, error.message);
    }
  }

  console.log('\n✅ ¡Listo! Sube los archivos "store_*.png" a Chrome Web Store.');
}

resizeScreenshots();



