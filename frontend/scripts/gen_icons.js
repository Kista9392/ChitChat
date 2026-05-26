const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

async function generatePngs() {
    try {
        const sourceImage = 'C:\\Users\\dell\\.gemini\\antigravity-ide\\brain\\b38d84e5-672f-4061-81c7-14f34c01f721\\relay_concept_orbit_1779797362103.png';
        const imageBuffer = fs.readFileSync(sourceImage);
        
        // Ensure square by cropping if necessary or just resizing (the generated image should be 1024x1024 square already)
        
        await sharp(imageBuffer)
            .resize(192, 192)
            .png()
            .toFile(path.join(__dirname, '../public/icon-192x192.png'));
            
        console.log('Created icon-192x192.png');
        
        await sharp(imageBuffer)
            .resize(512, 512)
            .png()
            .toFile(path.join(__dirname, '../public/icon-512x512.png'));
            
        console.log('Created icon-512x512.png');
        
        await sharp(imageBuffer)
            .resize(512, 512)
            .png()
            .toFile(path.join(__dirname, '../public/maskable-icon-512x512.png'));
            
        console.log('Created maskable-icon-512x512.png');
        
    } catch (e) {
        console.error(e);
    }
}

generatePngs();
