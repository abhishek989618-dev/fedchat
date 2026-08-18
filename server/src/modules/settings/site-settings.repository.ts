import {prisma} from "../../config/database.js";

export const siteSettingsRepository = {
  findAll() {
    return prisma.siteSetting.findMany({ orderBy: { key: "asc" } });
  },

  findByKey(key: string) {
    return prisma.siteSetting.findUnique({ where: { key } });
  },

  upsert(key: string, value: unknown) {
    return prisma.siteSetting.upsert({
      where: { key },
      update: { value: value as object },
      create: { key, value: value as object },
    });
  },

  delete(key: string) {
    return prisma.siteSetting.delete({ where: { key } });
  },
};
