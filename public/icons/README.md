# Ícones PWA - HRX

Para completar a configuração do PWA, você precisa gerar ícones PNG nos seguintes tamanhos:

## Tamanhos necessários:
- icon-72x72.png
- icon-96x96.png
- icon-128x128.png
- icon-144x144.png
- icon-152x152.png
- icon-192x192.png
- icon-384x384.png
- icon-512x512.png

## Como gerar:

### Opção 1: Online (Mais fácil)
1. Use https://www.pwabuilder.com/imageGenerator
2. Faça upload de um logo HRX quadrado (512x512px mínimo)
3. Baixe todos os tamanhos gerados
4. Coloque nesta pasta

### Opção 2: Com Figma/Photoshop
1. Crie um ícone quadrado 512x512px
2. Fundo: preto (#000000)
3. Texto "HRX" em vermelho (#dc2626) e branco
4. Exporte em todos os tamanhos listados acima

### Opção 3: Via CLI (requer ImageMagick)
```bash
# Criar ícone base SVG e converter
convert -size 512x512 -background black -fill "#dc2626" -font Arial-Bold -pointsize 200 -gravity center label:HRX icon-512x512.png

# Gerar outros tamanhos
for size in 72 96 128 144 152 192 384; do
  convert icon-512x512.png -resize ${size}x${size} icon-${size}x${size}.png
done
```

## Design sugerido:
- Fundo: Preto sólido
- Logo: "HRX" centralizado em vermelho
- Ou: Símbolo + texto HRX
- Bordas arredondadas automáticas pelo sistema (maskable)
