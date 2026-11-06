import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'app.readora',
  appName: 'Readora',
  webDir: 'dist',
  backgroundColor: '#0d0b1f',
  // No volcar al registro las respuestas HTTP (los libros descargados pesan varios MB).
  loggingBehavior: 'production',
  android: {
    // Los libros se guardan en IndexedDB dentro del WebView; no hace falta acceso a internet sin HTTPS.
    allowMixedContent: false,
  },
  plugins: {
    // Iconos claros en las barras del sistema (la app es oscura).
    SystemBars: { style: 'DARK' },
    LocalNotifications: {
      iconColor: '#7b5bf5',
    },
  },
}

export default config
