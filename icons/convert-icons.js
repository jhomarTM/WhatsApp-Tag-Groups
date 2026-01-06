/**
 * Script para convertir SVG a PNG
 * Requiere: npm install sharp
 * Ejecutar: node convert-icons.js
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [16, 48, 128];

async function convertIcons() {
  for (const size of sizes) {
    const svgPath = path.join(__dirname, `icon${size}.svg`);
    const pngPath = path.join(__dirname, `icon${size}.png`);
    
    try {
      await sharp(svgPath)
        .resize(size, size)
        .png()
        .toFile(pngPath);
      
      console.log(`✓ Convertido: icon${size}.png`);
    } catch (error) {
      console.error(`✗ Error con icon${size}:`, error.message);
    }
  }
  
  console.log('\n¡Conversión completada!');
}

convertIcons();

