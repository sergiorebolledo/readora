// Genera las imágenes base para los íconos y la pantalla de inicio de Android a partir de public/logo.svg.
// Uso: node scripts/make-icons.mjs && npx capacitor-assets generate --android
import { readFileSync, mkdirSync } from 'node:fs'
import sharp from 'sharp'

const svg = readFileSync('public/logo.svg', 'utf8')
const defs = svg.match(/<defs>[\s\S]*?<\/defs>/)[0]
const book = svg.match(/<g id="book">[\s\S]*?<\/g>\s*<\/svg>/)[0].replace(/<\/svg>$/, '')
// El libro centrado y reducido para que quepa en la zona segura de los íconos adaptativos de Android.
const bookOnly = (scale) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">${defs}<g transform="translate(256 256) scale(${scale}) translate(-256 -280)">${book}</g></svg>`
const background = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">${defs}<rect width="512" height="512" fill="url(#bg)"/><rect width="512" height="512" fill="url(#glow)"/></svg>`

mkdirSync('resources', { recursive: true })
const png = (s, size, out) => sharp(Buffer.from(s), { density: 400 }).resize(size, size).png().toFile(out)

await png(svg, 1024, 'resources/icon-only.png')
await png(bookOnly(0.8), 1024, 'resources/icon-foreground.png')
await png(background, 1024, 'resources/icon-background.png')

// Pantalla de inicio: fondo oscuro de la app con el ícono al centro.
const logo = await sharp(Buffer.from(svg), { density: 400 }).resize(640, 640).png().toBuffer()
for (const name of ['splash.png', 'splash-dark.png']) {
  await sharp({ create: { width: 2732, height: 2732, channels: 4, background: '#0d0b1f' } })
    .composite([{ input: logo, gravity: 'center' }])
    .png()
    .toFile(`resources/${name}`)
}
console.log('Listo: resources/*.png')
