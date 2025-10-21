const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const INPUT_IMAGE = path.join(__dirname, '../src/app/icone_hrx.png');
const OUTPUT_DIR = path.join(__dirname, '../public/icons');

// Tamanhos necessários para PWA
const sizes = [
  { size: 32, name: 'favicon-32x32.png' },
  { size: 72, name: 'icon-72x72.png' },
  { size: 96, name: 'icon-96x96.png' },
  { size: 128, name: 'icon-128x128.png' },
  { size: 144, name: 'icon-144x144.png' },
  { size: 152, name: 'icon-152x152.png' },
  { size: 180, name: 'apple-touch-icon.png' }, // iOS
  { size: 192, name: 'icon-192x192.png' },
  { size: 384, name: 'icon-384x384.png' },
  { size: 512, name: 'icon-512x512.png' },
  { size: 2048, name: 'splash-2048x2048.png' },
];

// Tamanho para OG Image (Open Graph - compartilhamento)
const ogImage = { width: 1200, height: 630, name: 'og-image.png' };

async function generateIcons() {
  console.log('🎨 Gerando ícones PWA a partir de:', INPUT_IMAGE);

  // Verificar se o diretório de saída existe
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Verificar se a imagem de entrada existe
  if (!fs.existsSync(INPUT_IMAGE)) {
    console.error('❌ Erro: Arquivo de entrada não encontrado:', INPUT_IMAGE);
    process.exit(1);
  }

  try {
    // Gerar ícones quadrados
    for (const { size, name } of sizes) {
      const outputPath = path.join(OUTPUT_DIR, name);

      await sharp(INPUT_IMAGE)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }, // Fundo transparente
        })
        .png()
        .toFile(outputPath);

      console.log(`✅ Gerado: ${name} (${size}x${size})`);
    }

    // Gerar OG Image (Open Graph - para compartilhamento)
    const ogOutputPath = path.join(OUTPUT_DIR, ogImage.name);
    await sharp(INPUT_IMAGE)
      .resize(ogImage.width, ogImage.height, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 1 }, // Fundo preto
      })
      .png()
      .toFile(ogOutputPath);

    console.log(`✅ Gerado: ${ogImage.name} (${ogImage.width}x${ogImage.height})`);

    // Gerar favicon.ico (32x32)
    const faviconPath = path.join(__dirname, '../public/favicon.ico');
    await sharp(INPUT_IMAGE)
      .resize(32, 32, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .toFormat('png')
      .toFile(faviconPath.replace('.ico', '-temp.png'));

    // Converter PNG para ICO (requer conversão manual ou usar o PNG como fallback)
    fs.renameSync(faviconPath.replace('.ico', '-temp.png'), faviconPath.replace('.ico', '.png'));
    console.log(`✅ Gerado: favicon.png (32x32)`);

    console.log('\n🎉 Todos os ícones foram gerados com sucesso!');
    console.log(`📁 Localização: ${OUTPUT_DIR}`);

  } catch (error) {
    console.error('❌ Erro ao gerar ícones:', error);
    process.exit(1);
  }
}

generateIcons();
