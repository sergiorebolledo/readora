import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import pkg from './package.json' with { type: 'json' }

/**
 * Proxy SOLO para desarrollo: permite descargar libros de fuentes que no habilitan CORS.
 * Uso: /__proxy?url=https://www.gutenberg.org/...  (solo dominios de la lista blanca).
 */
const ALLOWED_HOSTS = [/(^|\.)gutenberg\.org$/, /(^|\.)archive\.org$/, /(^|\.)openlibrary\.org$/]

function devProxy(): Plugin {
  return {
    name: 'estante-dev-proxy',
    configureServer(server) {
      server.middlewares.use('/__proxy', async (req, res) => {
        try {
          const target = new URL(new URL(req.url ?? '', 'http://localhost').searchParams.get('url') ?? '')
          if (target.protocol !== 'https:' || !ALLOWED_HOSTS.some((re) => re.test(target.hostname))) {
            res.statusCode = 403
            return res.end('Dominio no permitido')
          }
          const upstream = await fetch(target, { redirect: 'follow', headers: { 'User-Agent': 'Readora-dev (lector de libros)' } })
          res.statusCode = upstream.status
          res.setHeader('Content-Type', upstream.headers.get('content-type') ?? 'application/octet-stream')
          res.end(Buffer.from(await upstream.arrayBuffer()))
        } catch (err) {
          res.statusCode = 502
          res.end(`Error del proxy: ${(err as Error).message}`)
        }
      })
    },
  }
}

/**
 * Política de seguridad de contenido (CSP), solo en la versión compilada (en desarrollo Vite
 * necesita scripts en línea). Si un libro o una página trae código malicioso, el navegador no
 * lo ejecuta y no puede enviar datos a otros servidores.
 * - connect-src https: → las fuentes de libros (Gutendex, Open Library, archive.org…) y Google Analytics.
 * - script-src googletagmanager → Firebase Analytics en PC/web (solo se carga si la persona acepta).
 * - 'wasm-unsafe-eval' → decodificadores de imágenes de pdf.js.
 * - blob: → páginas de EPUB, portadas e imágenes guardadas en el dispositivo.
 * - ipc: y http://ipc.localhost → canal entre la página y Rust en la app de escritorio (Tauri 2).
 *   La página se sirve desde http://tauri.localhost (Windows) o tauri://localhost (Linux), que es 'self'.
 *   Las descargas con el plugin HTTP de Tauri también viajan por ese canal, así que la CSP no las frena.
 */
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'wasm-unsafe-eval' https://www.googletagmanager.com",
  "style-src 'self' 'unsafe-inline' blob:",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: blob:",
  "media-src 'self' blob:",
  "connect-src 'self' blob: data: https: ipc: http://ipc.localhost",
  "frame-src 'self' blob:",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
].join('; ')

function contentSecurityPolicy(): Plugin {
  return {
    name: 'readora-csp',
    apply: 'build',
    transformIndexHtml: () => [{ tag: 'meta', attrs: { 'http-equiv': 'Content-Security-Policy', content: CSP }, injectTo: 'head-prepend' }],
  }
}

export default defineConfig({
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  plugins: [react(), tailwindcss(), devProxy(), contentSecurityPolicy()],
  server: { port: 5173 },
})
