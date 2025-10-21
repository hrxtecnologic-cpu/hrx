const fs = require('fs');
const path = require('path');

const INPUT = path.join(__dirname, '../public/icons/icone1_hrx.svg');
const OUTPUT = path.join(__dirname, '../public/icons/icone1_hrx_optimized.svg');

console.log('🎨 Otimizando SVG...');

// Ler o SVG
const svgContent = fs.readFileSync(INPUT, 'utf8');

// Extrair todos os números das coordenadas dos paths
const pathRegex = /d="([^"]*)"/g;
let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

let match;
while ((match = pathRegex.exec(svgContent)) !== null) {
  const pathData = match[1];

  // Extrair números (coordenadas)
  const numbers = pathData.match(/[-+]?[0-9]*\.?[0-9]+/g);

  if (numbers) {
    for (let i = 0; i < numbers.length - 1; i += 2) {
      const x = parseFloat(numbers[i]);
      const y = parseFloat(numbers[i + 1]);

      if (!isNaN(x) && !isNaN(y)) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }
}

console.log('📐 Bounds encontrados:');
console.log(`  X: ${minX} → ${maxX}`);
console.log(`  Y: ${minY} → ${maxY}`);

// Adicionar uma margem de 5% em volta do conteúdo
const width = maxX - minX;
const height = maxY - minY;
const margin = 0.05;

const viewBoxX = minX - (width * margin);
const viewBoxY = minY - (height * margin);
const viewBoxWidth = width * (1 + margin * 2);
const viewBoxHeight = height * (1 + margin * 2);

console.log('📦 Novo viewBox:', `${viewBoxX} ${viewBoxY} ${viewBoxWidth} ${viewBoxHeight}`);

// Substituir o SVG tag com novo viewBox
const optimizedSvg = svgContent.replace(
  /<svg[^>]*>/,
  `<svg viewBox="${viewBoxX} ${viewBoxY} ${viewBoxWidth} ${viewBoxHeight}" xmlns="http://www.w3.org/2000/svg">`
);

// Salvar o SVG otimizado
fs.writeFileSync(OUTPUT, optimizedSvg);

console.log('✅ SVG otimizado salvo em:', OUTPUT);
console.log(`📊 Redução de espaço: ${((1 - (viewBoxWidth * viewBoxHeight) / (1024 * 1536)) * 100).toFixed(1)}%`);
