const fs = require('fs');
const path = require('path');

const INPUT = path.join(__dirname, '../public/icons/icone1_hrx.svg');
const OUTPUT = path.join(__dirname, '../public/icons/icone1_hrx_cropped.svg');

console.log('✂️ Cortando SVG...');

// Ler o SVG
const svgContent = fs.readFileSync(INPUT, 'utf8');

// Baseado na análise dos paths, o logo parece estar em torno de:
// Y: 568 até 916 (aproximadamente centro vertical)
// X: usa a largura total mas vamos manter com margem

// Vamos cortar para manter apenas a área central vertical
const originalWidth = 1024;
const originalHeight = 1536;

// Área do logo (estimativa com margem)
const cropY = 480;
const cropHeight = 576; // de ~480 a ~1056
const cropX = 120;
const cropWidth = 800;

console.log('📐 Cortando para área:');
console.log(`  viewBox: ${cropX} ${cropY} ${cropWidth} ${cropHeight}`);
console.log(`  Aspect ratio: ${(cropWidth / cropHeight).toFixed(2)}`);

// Substituir o SVG tag com novo viewBox
const croppedSvg = svgContent.replace(
  /<svg[^>]*>/,
  `<svg viewBox="${cropX} ${cropY} ${cropWidth} ${cropHeight}" xmlns="http://www.w3.org/2000/svg">`
);

// Salvar o SVG cortado
fs.writeFileSync(OUTPUT, croppedSvg);

console.log('✅ SVG cortado salvo em:', OUTPUT);
console.log(`📊 Redução de área: ${((1 - (cropWidth * cropHeight) / (originalWidth * originalHeight)) * 100).toFixed(1)}%`);
