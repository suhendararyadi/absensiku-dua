interface UsageStats {
  dailyRequests: number;
  lastResetDate: string;
  totalTokensUsed: number;
  minutelyRequests: number;
  lastMinuteReset: number;
}

interface RateLimitResult {
  allowed: boolean;
  reason?: string;
  waitTime?: number;
}

export class UsageTracker {
  private static STORAGE_KEY = 'gemini_usage_stats';
  private static DAILY_LIMIT = 1400; // Buffer dari 1500
  private static MINUTE_LIMIT = 10; // Buffer dari 15
  
  static getUsageStats(): UsageStats {
    if (typeof window === 'undefined') {
      return {
        dailyRequests: 0,
        lastResetDate: new Date().toDateString(),
        totalTokensUsed: 0,
        minutelyRequests: 0,
        lastMinuteReset: Date.now()
      };
    }
    
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (!stored) {
      const defaultStats: UsageStats = {
        dailyRequests: 0,
        lastResetDate: new Date().toDateString(),
        totalTokensUsed: 0,
        minutelyRequests: 0,
        lastMinuteReset: Date.now()
      };
      this.saveUsageStats(defaultStats);
      return defaultStats;
    }
    
    const stats: UsageStats = JSON.parse(stored);
    const today = new Date().toDateString();
    const now = Date.now();
    
    // Reset daily counter jika hari berbeda
    if (stats.lastResetDate !== today) {
      stats.dailyRequests = 0;
      stats.lastResetDate = today;
      stats.totalTokensUsed = 0; // Reset token count daily
      this.saveUsageStats(stats);
    }
    
    // Reset minute counter jika sudah lewat 1 menit
    if (now - stats.lastMinuteReset > 60000) {
      stats.minutelyRequests = 0;
      stats.lastMinuteReset = now;
      this.saveUsageStats(stats);
    }
    
    return stats;
  }
  
  static checkRateLimit(): RateLimitResult {
    const stats = this.getUsageStats();
    const now = Date.now();
    
    // Check daily limit
    if (stats.dailyRequests >= this.DAILY_LIMIT) {
      return {
        allowed: false,
        reason: `Batas harian tercapai (${this.DAILY_LIMIT} requests). Coba lagi besok.`
      };
    }
    
    // Check minute limit
    if (stats.minutelyRequests >= this.MINUTE_LIMIT) {
      const waitTime = 60000 - (now - stats.lastMinuteReset);
      return {
        allowed: false,
        reason: `Batas per menit tercapai (${this.MINUTE_LIMIT} requests). Tunggu ${Math.ceil(waitTime / 1000)} detik.`,
        waitTime: waitTime
      };
    }
    
    return { allowed: true };
  }
  
  static incrementUsage(tokensUsed: number = 0): void {
    const stats = this.getUsageStats();
    stats.dailyRequests += 1;
    stats.minutelyRequests += 1;
    stats.totalTokensUsed += tokensUsed;
    this.saveUsageStats(stats);
  }
  
  static canMakeRequest(): boolean {
    const rateLimit = this.checkRateLimit();
    return rateLimit.allowed;
  }
  
  static getUsagePercentage(): { daily: number; minute: number } {
    const stats = this.getUsageStats();
    return {
      daily: (stats.dailyRequests / this.DAILY_LIMIT) * 100,
      minute: (stats.minutelyRequests / this.MINUTE_LIMIT) * 100
    };
  }
  
  static getRemainingRequests(): { daily: number; minute: number } {
    const stats = this.getUsageStats();
    return {
      daily: Math.max(0, this.DAILY_LIMIT - stats.dailyRequests),
      minute: Math.max(0, this.MINUTE_LIMIT - stats.minutelyRequests)
    };
  }
  
  static resetDailyStats(): void {
    const stats = this.getUsageStats();
    stats.dailyRequests = 0;
    stats.totalTokensUsed = 0;
    stats.lastResetDate = new Date().toDateString();
    this.saveUsageStats(stats);
  }
  
  static resetMinuteStats(): void {
    const stats = this.getUsageStats();
    stats.minutelyRequests = 0;
    stats.lastMinuteReset = Date.now();
    this.saveUsageStats(stats);
  }
  
  private static saveUsageStats(stats: UsageStats): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(stats));
    }
  }
  
  // Utility method untuk debugging
  static getDebugInfo(): string {
    const stats = this.getUsageStats();
    const rateLimit = this.checkRateLimit();
    const percentages = this.getUsagePercentage();
    const remaining = this.getRemainingRequests();
    
    return `
Gemini Usage Debug Info:
- Daily: ${stats.dailyRequests}/${this.DAILY_LIMIT} (${percentages.daily.toFixed(1)}%)
- Minute: ${stats.minutelyRequests}/${this.MINUTE_LIMIT} (${percentages.minute.toFixed(1)}%)
- Tokens: ${stats.totalTokensUsed.toLocaleString()}
- Rate Limit: ${rateLimit.allowed ? 'OK' : rateLimit.reason}
- Remaining: ${remaining.daily} daily, ${remaining.minute} per minute
`;
  }
}

// Export types
export type { UsageStats, RateLimitResult };