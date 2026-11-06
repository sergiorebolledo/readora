/** Genera una portada cuando el archivo no trae una (TXT, PDFs vacíos, etc.). */
export async function generateCover(title: string, author: string): Promise<Blob> {
  const w = 400
  const h = 600
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!

  // Color estable a partir del título.
  let hash = 0
  for (const ch of title) hash = (hash * 31 + ch.charCodeAt(0)) | 0
  // Tonos entre azul y magenta para combinar con la paleta violeta de la app.
  const hue = 215 + (Math.abs(hash) % 115)
  const grad = ctx.createLinearGradient(0, 0, w, h)
  grad.addColorStop(0, `hsl(${hue} 60% 38%)`)
  grad.addColorStop(1, `hsl(${hue + 25} 55% 14%)`)
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, w, h)

  ctx.fillStyle = 'rgba(255,255,255,0.12)'
  ctx.fillRect(28, 28, 6, h - 56)

  ctx.fillStyle = '#fff'
  ctx.font = 'bold 40px system-ui, sans-serif'
  const lines = wrap(ctx, title, w - 100).slice(0, 6)
  lines.forEach((line, i) => ctx.fillText(line, 56, 120 + i * 50))

  ctx.fillStyle = 'rgba(255,255,255,0.75)'
  ctx.font = '24px system-ui, sans-serif'
  ctx.fillText(author.slice(0, 28), 56, h - 60)

  return canvasToBlob(canvas)
}

export function canvasToBlob(canvas: HTMLCanvasElement, type = 'image/jpeg'): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('No se pudo crear la imagen'))), type, 0.85),
  )
}

function wrap(ctx: CanvasRenderingContext2D, text: string, max: number) {
  const words = text.split(/\s+/)
  const lines: string[] = []
  let line = ''
  for (const word of words) {
    const test = line ? `${line} ${word}` : word
    if (ctx.measureText(test).width > max && line) {
      lines.push(line)
      line = word
    } else line = test
  }
  if (line) lines.push(line)
  return lines
}
