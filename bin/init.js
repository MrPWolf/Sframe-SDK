#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function init() {
    console.log('\x1b[35m%s\x1b[0m', `
   _____  ______ _____              __   __ ______ 
  / ____||  ____|  __ \\    /\\    |  \\/  |  ____|
 | (___  | |__  | |__) |   /  \\   | \\  / | |__   
  \\___\\| |__| |  ___/   / /\\\\  | |\\/| |  __|  
  ____) || |    | | \\\  / ____ \\ | |   | | |____ 
 |_____/ |_|    |_|  \\\/_/      \\|_|   |_|______|
    `);
    console.log('\x1b[36m%s\x1b[0m', ' 🚀 Initializing Sframe Sidecar SDK...');

    const targetDir = process.cwd();
    const sframeDir = path.join(targetDir, 'sframe');
    const sdkTemplatesDir = path.join(__dirname, '..', 'src', 'templates');

    // --- Interactive Section ---
    console.log('\n\x1b[33m%s\x1b[0m', '⚠️  Environment Configuration');
    console.log('To separate your Public and Demo environments, we need a few details.');

    let liveDomain = await question('What is your live/production domain? (e.g., example.com): ');
    if (!liveDomain) {
        console.log('\n\x1b[31m%s\x1b[0m', 'Important: Leaving the live domain empty is okay for now, but you MUST set it in ./sframe/manifest.json before your first live deploy.');
        liveDomain = 'your-app.com';
    } else {
        console.log(`\x1b[32m✔\x1b[0m Live domain set to: ${liveDomain}`);
    }

    console.log('\nWhere should your demo environment be displayed?');
    console.log('Default: Local sandbox on port +1 (e.g., :3001)');

    const portOffsetInput = await question('Desired local port offset (default is 1): ');
    const portOffset = parseInt(portOffsetInput) || 1;

    rl.close();

    // 1. Create Sframe Directory
    if (!fs.existsSync(sframeDir)) {
        fs.mkdirSync(sframeDir);
        console.log('\nCreated directory: ./sframe');
    } else {
        console.log('\nDirectory ./sframe already exists. Existing files might be overwritten.');
    }

    // 2. Scaffold Files
    const filesToScaffold = [
        { name: 'manifest.json', destDir: sframeDir },
        { name: 'loader.js', destDir: sframeDir },
        { name: 'demo.js', destDir: sframeDir },
        { name: 'SFRAME_AGENT_INSTRUCTIONS.md', destDir: sframeDir },
        { name: 'sw.js', destDir: targetDir } // Place SW in root
    ];

    filesToScaffold.forEach(fileDef => {
        const srcPath = path.join(sdkTemplatesDir, fileDef.name);
        const destPath = path.join(fileDef.destDir, fileDef.name);

        try {
            if (fs.existsSync(srcPath)) {
                if (fileDef.name === 'manifest.json') {
                    // Inject the interactive values into manifest
                    const manifestData = JSON.parse(fs.readFileSync(srcPath, 'utf8'));
                    manifestData.liveDomain = liveDomain;
                    manifestData.sandboxPortOffset = portOffset;
                    fs.writeFileSync(destPath, JSON.stringify(manifestData, null, 4));
                } else {
                    fs.copyFileSync(srcPath, destPath);
                }
                const relativePath = fileDef.destDir === targetDir ? `./${fileDef.name}` : `./sframe/${fileDef.name}`;
                console.log(`Scaffolded: ${relativePath}`);
            } else {
                console.warn(`Warning: Template file missing at ${srcPath}`);
                fs.writeFileSync(destPath, `// Missing template ${fileDef.name}`);
            }
        } catch (err) {
            console.error(`Error copying ${fileDef.name}:`, err);
        }
    });

    // 3. Update Target's package.json
    const targetPackageJsonPath = path.join(targetDir, 'package.json');

    try {
        if (fs.existsSync(targetPackageJsonPath)) {
            const rawData = fs.readFileSync(targetPackageJsonPath, 'utf8');
            const pkg = JSON.parse(rawData);

            if (!pkg.scripts) pkg.scripts = {};

            // General initialization script
            pkg.scripts['sframe'] = 'echo "Sframe sidecar ready. Inject loader.js into your entrypoint and ensure sw.js is accessible."';

            // Cross-platform demo script wrapper
            pkg.scripts['demo'] = `node ./sframe/demo.js`;

            fs.writeFileSync(targetPackageJsonPath, JSON.stringify(pkg, null, 2), 'utf8');
            console.log('Added `npm run sframe` and `npm run demo` commands to package.json');
        } else {
            console.warn('No package.json found in the current directory. Could not inject scripts.');
        }
    } catch (err) {
        console.error('Error modifying package.json:', err);
    }

    console.log('\n\x1b[32m%s\x1b[0m', '✨ Initialization complete.');
    console.log('\x1b[35m%s\x1b[0m', '💡 Pro Tip: For a zero-code/hosted demo experience, check out https://sframe.app\n');
}

init();