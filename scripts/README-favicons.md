# Mockello Favicon Generator

This directory contains scripts to generate premium favicons for the Mockello website. The favicons feature a letter "M" on a dark curved background with a warm white outer background.

## Available Tools

1. **Browser-based Generator** (`/public/favicon-generator.html`)
   - Interactive tool with live preview
   - Customize colors, letter position, and curve height
   - Download individual sizes as needed

2. **Node.js Script** (`scripts/generate-favicons.js`)
   - Automated generation of all favicon sizes
   - Creates standard favicon files in the public directory
   - Requires Node.js and dependencies

## Installation

To install the required dependencies:

```bash
# Using npm script
npm run install-favicon-deps

# Or manually
npm install --save-dev canvas fs-extra
```

## Usage

### Browser-based Generator

1. Open `/public/favicon-generator.html` in your browser
2. Adjust the settings to your preference
3. Click "Generate Favicons" to create download links
4. Download the sizes you need

### Node.js Script

```bash
# Using npm script
npm run generate-favicons

# Or directly
node scripts/generate-favicons.js
```

This will generate the following files in the `/public` directory:

- `favicon.ico` - Standard favicon
- `favicon-16x16.png` - 16×16 PNG favicon
- `favicon-32x32.png` - 32×32 PNG favicon
- `logo192.png` - 192×192 PNG for PWA
- `logo512.png` - 512×512 PNG for PWA
- `apple-touch-icon.png` - 180×180 PNG for iOS
- Additional size variations

## Configuration

You can modify the default settings in `scripts/generate-favicons.js`:

```javascript
const config = {
  sizes: [16, 32, 48, 64, 128, 192, 256, 512],
  bgColor: '#111111',
  fgColor: '#FFFFFF',
  outerBgColor: '#FFF5EA',
  letterSpacingOffset: 0,
  letterVerticalOffset: -5,
  curveHeight: 60,
  outputDir: path.join(__dirname, '../public')
};
```

## HTML Integration

After generating the favicons, add these tags to your HTML:

```html
<link rel="icon" type="image/x-icon" href="/favicon.ico" />
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
<link rel="manifest" href="/manifest.json" />
```

## Troubleshooting

If you encounter issues with the Node.js script:

1. Ensure you have Node.js installed
2. Run `npm run install-favicon-deps` to install dependencies
3. Check for errors in the console output

For issues with the browser-based generator, try using a modern browser like Chrome or Firefox. 