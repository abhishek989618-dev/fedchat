import { siteSettingsRepository } from "./site-settings.repository.js";

export const siteSettingsService = {
  getAll() {
    return siteSettingsRepository.findAll();
  },

  get(key: string) {
    return siteSettingsRepository.findByKey(key);
  },

  set(key: string, value: unknown) {
    if (!key.trim()) throw new Error("Setting key is required");
    return siteSettingsRepository.upsert(key.trim(), value);
  },

  remove(key: string) {
    return siteSettingsRepository.delete(key);
  },
};
