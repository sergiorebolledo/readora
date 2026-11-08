import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'
import { liveQuery } from 'dexie'
import { db, type Reminder } from '../db'
import i18n from '../i18n'
import { dayKey } from './hooks'
import { isDesktop } from './platform'

/**
 * Recordatorios.
 * - Android (Capacitor): se programan notificaciones locales nativas que se repiten cada semana
 *   y llegan aunque la app esté cerrada. Se reprograman cada vez que cambian los recordatorios.
 * - PC (Tauri): la app revisa cada 30 s si toca algún aviso y lo muestra como notificación nativa de
 *   Windows / Linux (plugin de notificaciones de Tauri). Solo con la app abierta: en escritorio Tauri no
 *   puede programar avisos con la app cerrada.
 * - Web: igual que en PC, pero con las notificaciones del navegador.
 */
export const isNative = Capacitor.isNativePlatform()

export type Permission = 'granted' | 'denied' | 'default' | 'unsupported'

export async function getNotificationPermission(): Promise<Permission> {
  if (isNative) {
    const p = await LocalNotifications.checkPermissions()
    return p.display === 'granted' ? 'granted' : p.display === 'denied' ? 'denied' : 'default'
  }
  if (isDesktop) {
    const { isPermissionGranted } = await import('@tauri-apps/plugin-notification')
    return (await isPermissionGranted()) ? 'granted' : 'default'
  }
  if (!('Notification' in window)) return 'unsupported'
  return Notification.permission as Permission
}

export async function askNotificationPermission(): Promise<Permission> {
  if (isNative) {
    const p = await LocalNotifications.requestPermissions()
    return p.display === 'granted' ? 'granted' : 'denied'
  }
  if (isDesktop) {
    const { requestPermission } = await import('@tauri-apps/plugin-notification')
    return (await requestPermission()) as Permission
  }
  if (!('Notification' in window)) return 'unsupported'
  return (await Notification.requestPermission()) as Permission
}

async function texts(r: Reminder) {
  const book = r.bookId ? await db.books.get(r.bookId) : undefined
  const title = book ? i18n.t('reminders.notifyTitleBook', { title: book.title }) : i18n.t('reminders.notifyTitle')
  const body = r.message || (book ? i18n.t('reminders.notifyBodyBook', { page: book.currentPage || 1 }) : i18n.t('reminders.notifyBody'))
  return { title, body, link: book ? `/leer/${book.id}` : '/' }
}

/** Reprograma todas las notificaciones nativas a partir de la tabla de recordatorios. */
async function syncNative() {
  const pending = await LocalNotifications.getPending()
  if (pending.notifications.length) await LocalNotifications.cancel({ notifications: pending.notifications.map((n) => ({ id: n.id })) })
  const reminders = (await db.reminders.toArray()).filter((r) => r.enabled)
  const notifications = []
  for (const r of reminders) {
    const { title, body, link } = await texts(r)
    const [hour, minute] = r.time.split(':').map(Number)
    for (const day of r.days) {
      notifications.push({
        // Un id por recordatorio y día de la semana.
        id: r.id! * 10 + day,
        title,
        body,
        // En Capacitor el domingo es 1 y el sábado 7; en JavaScript el domingo es 0.
        schedule: { on: { weekday: day + 1, hour, minute }, allowWhileIdle: true },
        extra: { link },
      })
    }
  }
  if (notifications.length) await LocalNotifications.schedule({ notifications })
}

/** Inicia los recordatorios. `onFire` muestra el aviso dentro de la app (solo web). Devuelve la función de limpieza. */
export function startReminderScheduler(onFire: (title: string, body: string) => void) {
  if (isNative) {
    // Reprogramar cuando cambian los recordatorios o el progreso de los libros (el aviso muestra la página).
    const sub = liveQuery(() => Promise.all([db.reminders.toArray(), db.books.count()])).subscribe({
      next: () => syncNative().catch((e) => console.warn('No se pudieron programar los recordatorios', e)),
    })
    const tap = LocalNotifications.addListener('localNotificationActionPerformed', (a) => {
      const link = (a.notification.extra as { link?: string } | undefined)?.link
      if (link) window.location.hash = link
    })
    return () => {
      sub.unsubscribe()
      tap.then((h) => h.remove())
    }
  }

  const check = async () => {
    const now = new Date()
    const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    const today = dayKey(now)
    for (const r of await db.reminders.toArray()) {
      if (!r.enabled || r.lastFired === today) continue
      if (!r.days.includes(now.getDay()) || r.time > hhmm) continue
      // Solo dispara si estamos dentro de los 15 min siguientes a la hora programada.
      const [h, m] = r.time.split(':').map(Number)
      if (now.getHours() * 60 + now.getMinutes() - (h * 60 + m) > 15) continue
      const { title, body, link } = await texts(r)
      await db.reminders.update(r.id!, { lastFired: today })
      if (isDesktop) notifyDesktop(title, body)
      else notifyWeb(title, body, link)
      onFire(title, body)
    }
  }
  check()
  const id = window.setInterval(check, 30_000)
  return () => window.clearInterval(id)
}

async function notifyDesktop(title: string, body: string) {
  try {
    const { isPermissionGranted, sendNotification } = await import('@tauri-apps/plugin-notification')
    if (await isPermissionGranted()) sendNotification({ title, body })
  } catch (e) {
    console.warn('No se pudo mostrar la notificación', e)
  }
}

function notifyWeb(title: string, body: string, link: string) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return
  const n = new Notification(title, { body, tag: 'readora-recordatorio' })
  n.onclick = () => {
    window.focus()
    window.location.hash = link
  }
}
