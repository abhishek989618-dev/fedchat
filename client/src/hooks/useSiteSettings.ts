import { useEffect, useState } from 'react'
import { api, assetUrl } from '../lib'

export type SiteSettings = {
  name: string
  tagline: string
  description: string
  supportEmail: string
  guestJoinEnabled: boolean
  registrationEnabled: boolean
  maintenanceMode: boolean
  primaryColor: string
  accentColor: string
  logoUrl: string
  faviconUrl: string
  language: string
  alertLanguage: string
  theme: 'light' | 'dark'
}

const defaults: SiteSettings = {
  name: 'FedChat',
  tagline: 'Private conversations, live.',
  description: 'Secure real-time conversations, groups and communities.',
  supportEmail: '',
  guestJoinEnabled: true,
  registrationEnabled: true,
  maintenanceMode: false,
  primaryColor: '#168a57',
  accentColor: '#1da968',
  logoUrl: '',
  faviconUrl: '/favicon.svg',
  language: 'en',
  alertLanguage: 'en',
  theme: 'light',
}

function booleanSetting(value: unknown, fallback: boolean) {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') return value.trim().toLowerCase() === 'true'
  return fallback
}

function normalize(data: Record<string, unknown>): SiteSettings {
  return {
    name: String(data['site.name'] ?? defaults.name),
    tagline: String(data['site.tagline'] ?? defaults.tagline),
    description: String(data['site.description'] ?? defaults.description),
    supportEmail: String(data['site.supportEmail'] ?? defaults.supportEmail),
    guestJoinEnabled: booleanSetting(data['site.guestJoinEnabled'], defaults.guestJoinEnabled),
    registrationEnabled: booleanSetting(data['site.registrationEnabled'], defaults.registrationEnabled),
    maintenanceMode: booleanSetting(data['site.maintenanceMode'], defaults.maintenanceMode),
    primaryColor: String(data['site.primaryColor'] ?? defaults.primaryColor),
    accentColor: String(data['site.accentColor'] ?? defaults.accentColor),
    logoUrl: String(data['site.logoUrl'] ?? defaults.logoUrl),
    faviconUrl: String(data['site.faviconUrl'] ?? defaults.faviconUrl),
    language: String(data['site.language'] ?? defaults.language),
    alertLanguage: String(data['site.alertLanguage'] ?? defaults.alertLanguage),
    theme: String(data['site.theme'] ?? defaults.theme) === 'dark' ? 'dark' : 'light',
  }
}

export function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings>(defaults)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    const load = () => {
      void api.publicSiteSettings().then((response) => {
        if (alive && response?.data?.settings) setSettings(normalize(response.data.settings))
      }).catch(() => undefined).finally(() => { if (alive) setLoading(false) })
    }

    load()
    const onChanged = () => load()
    window.addEventListener('fedchat:site-settings-changed', onChanged)
    return () => {
      alive = false
      window.removeEventListener('fedchat:site-settings-changed', onChanged)
    }
  }, [])

  return { settings, loading }
}

export function useApplySiteSettings(settings: SiteSettings) {
  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--green', settings.primaryColor)
    root.style.setProperty('--green-2', settings.accentColor)
    document.title = settings.name
    const description = document.querySelector<HTMLMetaElement>('meta[name="description"]')
    if (description) description.content = settings.description
    document.documentElement.lang = settings.language || 'en'
    document.documentElement.dataset.platformTheme = settings.theme
    const favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
    if (favicon && settings.faviconUrl) favicon.href = assetUrl(settings.faviconUrl)
  }, [settings])
}
