const sharp = require('sharp');
const path = require('path');

const INPUT = path.join(__dirname, '../src/app/icone_hrx.png');
const OUTPUT = path.join(__dirname, '../public/icone_hrx.png');

async function removeBackground() {
  console.log('🎨 Removendo fundo do logo...');

  try {
    // Ler a imagem e extrair metadados
    const image = sharp(INPUT);
    const { width, height } = await image.metadata();

    // Criar uma máscara baseada na luminosidade (áreas claras = fundo)
    await sharp(INPUT)
      .ensureAlpha() // Adiciona canal alpha se não existir
      .threshold(240, { grayscale: false }) // Torna pixels claros brancos
      .negate() // Inverte (branco vira preto)
      .toColourspace('b-w') // Converte para preto e branco
      .toFile(path.join(__dirname, '../public/mask.png'));

    // Aplicar a máscara para criar transparência
    await sharp(INPUT)
      .composite([{
        input: path.join(__dirname, '../public/mask.png'),
        blend: 'dest-in'
      }])
      .trim() // Remove bordas vazias
      .toFile(OUTPUT);

    console.log('✅ Fundo removido com sucesso!');
    console.log('📁 Salvo em:', OUTPUT);
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
}

removeBackground();
