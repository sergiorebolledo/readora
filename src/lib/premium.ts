import { Capacitor } from '@capacitor/core'
import type { CustomerInfo, PurchasesPackage } from '@revenuecat/purchases-capacitor'
import { useEffect, useState } from 'react'
import { track } from './analytics'

/**
 * "Readora sin anuncios": suscripción mensual (Google Play Billing) gestionada con RevenueCat.
 *
 * - Solo en Android y solo si hay clave (`VITE_REVENUECAT_KEY` en `.env.local`, empieza con `goog_`).
 * - RevenueCat comprueba el pago en sus servidores y avisa de renovaciones, cancelaciones y reembolsos.
 * - El permiso que da la suscripción se llama `sin_anuncios` (debe existir igual en el panel de RevenueCat).
 * - El último estado conocido se guarda en el dispositivo para no mostrar el banner un instante al abrir
 *   la app (o sin internet) a quien ya pagó; RevenueCat lo confirma o lo corrige en cuanto responde.
 *
 * Configuración paso a paso: docs/MONETIZACION.md.
 */

const KEY = import.meta.env.VITE_REVENUECAT_KEY as string | undefined
export const ENTITLEMENT = 'sin_anuncios'
const CACHE_KEY = 'estante:sin-anuncios'
const PLAY_SUBSCRIPTIONS = 'https://play.google.com/store/account/subscriptions?package=app.readora'

export const premiumSupported = Capacitor.getPlatform() === 'android' && !!KEY

export interface PremiumState {
  /** ¿Tiene la suscripción activa? (sin anuncios) */
  active: boolean
  /** Fecha de vencimiento o de la próxima renovación (ISO). */
  expires: string | null
  /** false si la persona canceló: sigue activa hasta `expires`. */
  willRenew: boolean
  /** Precio con moneda local, p. ej. "US$2.00" o "CLP 1.900". null si la tienda no respondió. */
  price: string | null
  /** Enlace para gestionar o cancelar la suscripción en Google Play. */
  manageUrl: string
  /** ¿RevenueCat ya respondió? */
  ready: boolean
}

function cached(): PremiumState {
  const base: PremiumState = { active: false, expires: null, willRenew: false, price: null, manageUrl: PLAY_SUBSCRIPTIONS, ready: !premiumSupported }
  if (!premiumSupported) return base
  try {
    const c = JSON.parse(localStorage.getItem(CACHE_KEY) ?? 'null') as { expires: string | null; willRenew: boolean } | null
    if (c?.expires && new Date(c.expires).getTime() > Date.now()) return { ...base, active: true, expires: c.expires, willRenew: c.willRenew }
  } catch {
    /* sin caché */
  }
  return base
}

let state = cached()
let monthly: PurchasesPackage | null = null
const listeners = new Set<(s: PremiumState) => void>()

function set(patch: Partial<PremiumState>) {
  state = { ...state, ...patch }
  listeners.forEach((l) => l(state))
}

function applyCustomerInfo(info: CustomerInfo) {
  const e = info.entitlements.active[ENTITLEMENT]
  const active = !!e?.isActive
  const expires = e?.expirationDate ?? null
  const willRenew = !!e?.willRenew
  try {
    if (active) localStorage.setItem(CACHE_KEY, JSON.stringify({ expires, willRenew }))
    else localStorage.removeItem(CACHE_KEY)
  } catch {
    /* sin almacenamiento */
  }
  set({ active, expires, willRenew, manageUrl: info.managementURL ?? PLAY_SUBSCRIPTIONS, ready: true })
}

let starting: Promise<typeof import('@revenuecat/purchases-capacitor').Purchases | null> | null = null

/** Configura RevenueCat una sola vez y carga el estado y el precio. */
function start() {
  if (!premiumSupported) return Promise.resolve(null)
  starting ??= (async () => {
    try {
      const { Purchases } = await import('@revenuecat/purchases-capacitor')
      await Purchases.configure({ apiKey: KEY! })
      await Purchases.addCustomerInfoUpdateListener(applyCustomerInfo)
      const { customerInfo } = await Purchases.getCustomerInfo()
      applyCustomerInfo(customerInfo)
      const offerings = await Purchases.getOfferings()
      monthly = offerings.current?.monthly ?? offerings.current?.availablePackages[0] ?? null
      set({ price: monthly?.product.priceString ?? null })
      return Purchases
    } catch (e) {
      console.warn('RevenueCat no disponible', e)
      set({ ready: true })
      starting = null // se reintenta la próxima vez
      return null
    }
  })()
  return starting
}

/** Inicia RevenueCat al abrir la app (no hace nada en web/PC o sin clave). */
export function initPremium() {
  void start()
}

/** Estado de la suscripción, actualizado en vivo. */
export function usePremium(): PremiumState {
  const [s, setS] = useState(state)
  useEffect(() => {
    listeners.add(setS)
    setS(state)
    return () => {
      listeners.delete(setS)
    }
  }, [])
  return s
}

export type BuyResult = 'success' | 'cancelled'

/** Abre el pago de Google Play. Lanza un error con mensaje si falla (no si la persona cancela). */
export async function buyPremium(): Promise<BuyResult> {
  const Purchases = await start()
  if (!Purchases || !monthly) throw new Error('unavailable')
  try {
    const { customerInfo } = await Purchases.purchasePackage({ aPackage: monthly })
    applyCustomerInfo(customerInfo)
    track('premium_purchase', { result: 'success' })
    return 'success'
  } catch (e) {
    const err = e as { userCancelled?: boolean | null; message?: string }
    if (err.userCancelled) {
      track('premium_purchase', { result: 'cancelled' })
      return 'cancelled'
    }
    track('premium_purchase', { result: 'error' })
    throw new Error(err.message ?? 'error')
  }
}

/** "Restaurar compra" (p. ej. tras reinstalar o en otro teléfono con la misma cuenta de Google). */
export async function restorePremium(): Promise<boolean> {
  const Purchases = await start()
  if (!Purchases) throw new Error('unavailable')
  const { customerInfo } = await Purchases.restorePurchases()
  applyCustomerInfo(customerInfo)
  return !!customerInfo.entitlements.active[ENTITLEMENT]?.isActive
}
