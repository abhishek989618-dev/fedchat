import { adminAnalyticsRepository } from "./admin-analytics.repository.js";

export const adminAnalyticsService = {
  async dashboard() {
    const now = new Date();
    const since24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const [counts, activeUsers24h] = await Promise.all([
      adminAnalyticsRepository.counts(),
      adminAnalyticsRepository.activeUsersSince(since24h),
    ]);

    return { ...counts, activeUsers24h };
  },
};
