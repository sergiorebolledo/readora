import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

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
          const upstream = await fetch(target, { redirect: 'follow', headers: { 'User-Agent': 'Estante/0.1 (lector personal de libros)' } })
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

export default defineConfig({
  define: { __APP_VERSION__: JSON.stringify(process.env.npm_package_version ?? '0.1.0') },
  plugins: [react(), tailwindcss(), devProxy()],
  server: { port: 5173 },
})
