#!/usr/bin/env node

/**
 * Install dependencies for the favicon generator
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current file directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Installing dependencies for favicon generator...');

try {
  // Check if package.json exists
  const packageJsonPath = path.join(__dirname, '../package.json');
  if (!fs.existsSync(packageJsonPath)) {
    console.error('Error: package.json not found');
    process.exit(1);
  }

  // Read package.json
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  // Check if dependencies already exist
  const devDependencies = packageJson.devDependencies || {};
  const hasCanvas = devDependencies.canvas !== undefined;
  const hasFsExtra = devDependencies['fs-extra'] !== undefined;
  
  if (hasCanvas && hasFsExtra) {
    console.log('Dependencies already installed.');
    process.exit(0);
  }
  
  // Install missing dependencies
  const dependencies = [];
  
  if (!hasCanvas) dependencies.push('canvas');
  if (!hasFsExtra) dependencies.push('fs-extra');
  
  if (dependencies.length > 0) {
    console.log(`Installing: ${dependencies.join(', ')}`);
    execSync(`npm install --save-dev ${dependencies.join(' ')} --legacy-peer-deps`, { 
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });
    console.log('Dependencies installed successfully.');
  } else {
    console.log('All dependencies are already installed.');
  }
  
} catch (error) {
  console.error('Error installing dependencies:', error);
  process.exit(1);
} 