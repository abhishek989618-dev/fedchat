import { useEffect, useState } from 'react'
import { api } from '../lib'

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
}

function normalize(data: Record<string, unknown>): SiteSettings {
  return {
    name: String(data['site.name'] ?? defaults.name),
    tagline: String(data['site.tagline'] ?? defaults.tagline),
    description: String(data['site.description'] ?? defaults.description),
    supportEmail: String(data['site.supportEmail'] ?? defaults.supportEmail),
    guestJoinEnabled: Boolean(data['site.guestJoinEnabled'] ?? defaults.guestJoinEnabled),
    registrationEnabled: Boolean(data['site.registrationEnabled'] ?? defaults.registrationEnabled),
    maintenanceMode: Boolean(data['site.maintenanceMode'] ?? defaults.maintenanceMode),
    primaryColor: String(data['site.primaryColor'] ?? defaults.primaryColor),
    accentColor: String(data['site.accentColor'] ?? defaults.accentColor),
  }
}

export function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings>(defaults)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    let alive = true
    void api.publicSiteSettings().then((response) => {
      if (alive && response?.data?.settings) setSettings(normalize(response.data.settings))
    }).catch(() => undefined).finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [])
  return { settings, loading }
}

export function useApplySiteSettings(settings: SiteSettings) {
  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--green', settings.primaryColor)
    root.style.setProperty('--green-2', settings.accentColor)
    document.title = settings.name
  }, [settings])
}
