const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

async function generatePngs() {
    try {
        const svgBuffer = fs.readFileSync(path.join(__dirname, '../public/maskable-icon.svg'));
        
        await sharp(svgBuffer)
            .resize(192, 192)
            .png()
            .toFile(path.join(__dirname, '../public/icon-192x192.png'));
            
        console.log('Created icon-192x192.png');
        
        await sharp(svgBuffer)
            .resize(512, 512)
            .png()
            .toFile(path.join(__dirname, '../public/icon-512x512.png'));
            
        console.log('Created icon-512x512.png');
        
        const svgBufferNonMask = fs.readFileSync(path.join(__dirname, '../public/icon.svg'));
        await sharp(svgBufferNonMask)
            .resize(512, 512)
            .png()
            .toFile(path.join(__dirname, '../public/maskable-icon-512x512.png')); // Using non-mask for this just to overwrite it
            
        console.log('Created maskable-icon-512x512.png');
    } catch (e) {
        console.error(e);
    }
}

generatePngs();
