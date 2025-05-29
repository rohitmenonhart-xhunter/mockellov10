#!/usr/bin/env node

/**
 * Mockello Favicon Generator Script
 * 
 * This script generates favicon files for the Mockello website.
 * It creates a premium dark favicon with the letter "M" on a curved background.
 * 
 * Requirements:
 * - Node.js
 * - npm packages: canvas, fs-extra
 * 
 * Installation:
 * npm install canvas fs-extra
 * 
 * Usage:
 * node generate-favicons.js
 */

import fs from 'fs-extra';
import { createCanvas } from 'canvas';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current file directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const config = {
  sizes: [16, 32, 48, 64, 128, 192, 256, 512],
  bgColor: '#000000',
  fgColor: '#FFFFFF',
  outerBgColor: '#111111',
  letterSpacingOffset: 0,
  letterVerticalOffset: 0,
  curveHeight: 40,
  outputDir: path.join(__dirname, '../public')
};

// Ensure output directory exists
fs.ensureDirSync(config.outputDir);

/**
 * Draw favicon on canvas
 */
function drawFavicon(canvas, options) {
  const { bgColor, fgColor, outerBgColor, letterSpacingOffset, letterVerticalOffset, curveHeight } = options;
  
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  const centerX = width / 2;
  const centerY = height / 2;
  
  // Clear canvas
  ctx.clearRect(0, 0, width, height);
  
  // Draw background
  ctx.fillStyle = outerBgColor;
  ctx.fillRect(0, 0, width, height);
  
  // Draw a more modern shape - full background with subtle curve
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, width, height);
  
  // Create a bold, modern M
  ctx.fillStyle = fgColor;
  
  // Use a bolder font with better weight
  const fontSize = width * 0.6; // Larger font size for bolder appearance
  ctx.font = `900 ${fontSize}px Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Apply letter positioning
  const letterX = centerX + (letterSpacingOffset * width / 100);
  const letterY = centerY + (letterVerticalOffset * height / 100);
  
  // Draw the letter with a slight shadow for depth
  ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
  ctx.shadowBlur = width * 0.05;
  ctx.shadowOffsetX = width * 0.01;
  ctx.shadowOffsetY = width * 0.01;
  ctx.fillText('M', letterX, letterY);
  
  // Reset shadow
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  
  // Add a subtle accent line at the bottom for a modern touch
  ctx.fillStyle = fgColor;
  const accentHeight = height * 0.02;
  const accentY = height - accentHeight;
  ctx.fillRect(0, accentY, width, accentHeight);
}

/**
 * Generate favicon for a specific size
 */
function generateFavicon(size) {
  console.log(`Generating ${size}x${size} favicon...`);
  
  const canvas = createCanvas(size, size);
  
  drawFavicon(canvas, {
    bgColor: config.bgColor,
    fgColor: config.fgColor,
    outerBgColor: config.outerBgColor,
    letterSpacingOffset: config.letterSpacingOffset,
    letterVerticalOffset: config.letterVerticalOffset,
    curveHeight: config.curveHeight
  });
  
  // Save to file
  const buffer = canvas.toBuffer('image/png');
  const outputPath = path.join(config.outputDir, `favicon-${size}x${size}.png`);
  fs.writeFileSync(outputPath, buffer);
  
  console.log(`Saved to ${outputPath}`);
  
  // For specific sizes, create special files
  if (size === 16) {
    const faviconPath = path.join(config.outputDir, 'favicon.ico');
    fs.writeFileSync(faviconPath, buffer);
    console.log(`Saved to ${faviconPath}`);
  }
  
  if (size === 192) {
    const logoPath = path.join(config.outputDir, 'logo192.png');
    fs.writeFileSync(logoPath, buffer);
    console.log(`Saved to ${logoPath}`);
  }
  
  if (size === 512) {
    const logoPath = path.join(config.outputDir, 'logo512.png');
    fs.writeFileSync(logoPath, buffer);
    console.log(`Saved to ${logoPath}`);
  }
  
  if (size === 32) {
    const favicon32Path = path.join(config.outputDir, 'favicon-32x32.png');
    fs.writeFileSync(favicon32Path, buffer);
    console.log(`Saved to ${favicon32Path}`);
  }
  
  if (size === 16) {
    const favicon16Path = path.join(config.outputDir, 'favicon-16x16.png');
    fs.writeFileSync(favicon16Path, buffer);
    console.log(`Saved to ${favicon16Path}`);
  }
  
  // Generate Microsoft Tile images
  if (size === 70) {
    const mstilePath = path.join(config.outputDir, 'mstile-70x70.png');
    fs.writeFileSync(mstilePath, buffer);
    console.log(`Saved to ${mstilePath}`);
  }
  
  if (size === 144) {
    const mstilePath = path.join(config.outputDir, 'mstile-144x144.png');
    fs.writeFileSync(mstilePath, buffer);
    console.log(`Saved to ${mstilePath}`);
  }
  
  if (size === 150) {
    const mstilePath = path.join(config.outputDir, 'mstile-150x150.png');
    fs.writeFileSync(mstilePath, buffer);
    console.log(`Saved to ${mstilePath}`);
  }
  
  if (size === 310) {
    const mstilePath = path.join(config.outputDir, 'mstile-310x310.png');
    fs.writeFileSync(mstilePath, buffer);
    console.log(`Saved to ${mstilePath}`);
  }
}

/**
 * Generate wide Microsoft Tile image
 */
function generateWideMsTile() {
  console.log('Generating wide Microsoft Tile image...');
  
  const width = 310;
  const height = 150;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  
  // Clear canvas
  ctx.clearRect(0, 0, width, height);
  
  // Draw outer background
  ctx.fillStyle = config.outerBgColor;
  ctx.fillRect(0, 0, width, height);
  
  // Draw curved dark background
  ctx.fillStyle = config.bgColor;
  ctx.beginPath();
  
  // Draw a curved shape
  const curveOffset = height * (config.curveHeight / 100);
  ctx.moveTo(0, height);
  ctx.bezierCurveTo(
    width * 0.3, height - curveOffset, 
    width * 0.7, height - curveOffset, 
    width, height
  );
  ctx.lineTo(width, 0);
  ctx.lineTo(0, 0);
  ctx.closePath();
  ctx.fill();
  
  // Draw the letter M
  ctx.fillStyle = config.fgColor;
  ctx.font = `bold ${height * 0.5}px Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Apply letter positioning
  const letterX = width / 2 + (config.letterSpacingOffset * width / 100);
  const letterY = height / 2 + (config.letterVerticalOffset * height / 100);
  
  ctx.fillText('M', letterX, letterY);
  
  // Save to file
  const buffer = canvas.toBuffer('image/png');
  const outputPath = path.join(config.outputDir, 'mstile-310x150.png');
  fs.writeFileSync(outputPath, buffer);
  
  console.log(`Saved to ${outputPath}`);
}

/**
 * Generate Apple Touch Icon
 */
function generateAppleTouchIcon() {
  console.log('Generating Apple Touch Icon...');
  
  const size = 180;
  const canvas = createCanvas(size, size);
  
  drawFavicon(canvas, {
    bgColor: config.bgColor,
    fgColor: config.fgColor,
    outerBgColor: config.outerBgColor,
    letterSpacingOffset: config.letterSpacingOffset,
    letterVerticalOffset: config.letterVerticalOffset,
    curveHeight: config.curveHeight
  });
  
  // Save to file
  const buffer = canvas.toBuffer('image/png');
  const outputPath = path.join(config.outputDir, 'apple-touch-icon.png');
  fs.writeFileSync(outputPath, buffer);
  
  console.log(`Saved to ${outputPath}`);
}

/**
 * Main function
 */
async function main() {
  console.log('Mockello Favicon Generator');
  console.log('-------------------------');
  
  try {
    // Add Microsoft Tile sizes
    const allSizes = [...config.sizes, 70, 144, 150, 310];
    
    // Generate all favicon sizes
    for (const size of allSizes) {
      generateFavicon(size);
    }
    
    // Generate wide Microsoft Tile
    generateWideMsTile();
    
    // Generate Apple Touch Icon
    generateAppleTouchIcon();
    
    console.log('\nAll favicons generated successfully!');
    console.log('\nRemember to update your HTML to include these favicons:');
    console.log(`
<link rel="icon" type="image/x-icon" href="/favicon.ico" />
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
<link rel="manifest" href="/manifest.json" />
    `);
    
  } catch (error) {
    console.error('Error generating favicons:', error);
    process.exit(1);
  }
}

// Run the script
main(); 