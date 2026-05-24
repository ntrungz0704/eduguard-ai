const appLogger = require('../logger');

// ============================================================
// EduGuard AI — In-Memory Cache Manager with TTL
// ============================================================

class CacheManager {
  constructor() {
    this._store = new Map();
    // Cleanup expired entries every minute
    this._cleanupInterval = setInterval(() => this._cleanup(), 60 * 1000);
  }

  /**
   * Store a value with a time-to-live (TTL)
   * @param {string} key - Cache key
   * @param {*} value - Value to cache
   * @param {number} ttlMs - TTL in milliseconds (default: 5 minutes)
   */
  set(key, value, ttlMs = 5 * 60 * 1000) {
    this._store.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
      createdAt: Date.now()
    });
    appLogger.cache('SET', key, `TTL: ${Math.round(ttlMs / 1000)}s`);
  }

  /**
   * Retrieve a value from cache. Returns null if missing or expired.
   * @param {string} key
   * @returns {*|null}
   */
  get(key) {
    const entry = this._store.get(key);
    if (!entry) {
      appLogger.cache('MISS', key, 'not found');
      return null;
    }
    if (Date.now() > entry.expiresAt) {
      this._store.delete(key);
      appLogger.cache('EXPIRED', key, 'deleted on access');
      return null;
    }
    const ageMs = Date.now() - entry.createdAt;
    appLogger.cache('HIT', key, `age: ${Math.round(ageMs / 1000)}s`);
    return entry.value;
  }

  /**
   * Check if a key exists and is not expired
   * @param {string} key
   * @returns {boolean}
   */
  has(key) {
    const entry = this._store.get(key);
    if (!entry) return false;
    if (Date.now() > entry.expiresAt) {
      this._store.delete(key);
      return false;
    }
    return true;
  }

  /**
   * Invalidate (delete) a specific cache key
   * @param {string} key
   */
  invalidate(key) {
    const existed = this._store.has(key);
    this._store.delete(key);
    if (existed) appLogger.cache('INVALIDATE', key);
  }

  /**
   * Invalidate all keys matching a prefix pattern
   * @param {string} prefix
   */
  invalidatePattern(prefix) {
    let count = 0;
    for (const key of this._store.keys()) {
      if (key.startsWith(prefix)) {
        this._store.delete(key);
        count++;
      }
    }
    if (count > 0) appLogger.cache('INVALIDATE_PATTERN', `${prefix}*`, `${count} keys removed`);
  }

  /**
   * Get or compute a value with caching
   * @param {string} key
   * @param {Function} computeFn - Async function to compute the value
   * @param {number} ttlMs
   * @returns {Promise<*>}
   */
  async getOrCompute(key, computeFn, ttlMs = 5 * 60 * 1000) {
    const cached = this.get(key);
    if (cached !== null) return cached;

    appLogger.cache('COMPUTE', key, 'computing...');
    const value = await computeFn();
    this.set(key, value, ttlMs);
    return value;
  }

  /**
   * Clear all cache entries
   */
  clear() {
    const count = this._store.size;
    this._store.clear();
    appLogger.cache('CLEAR_ALL', '*', `${count} entries removed`);
  }

  /**
   * Get cache statistics
   */
  stats() {
    const now = Date.now();
    let valid = 0, expired = 0;
    for (const [, entry] of this._store) {
      if (now > entry.expiresAt) expired++;
      else valid++;
    }
    return { total: this._store.size, valid, expired };
  }

  /**
   * Internal cleanup of expired entries
   */
  _cleanup() {
    const now = Date.now();
    let removed = 0;
    for (const [key, entry] of this._store) {
      if (now > entry.expiresAt) {
        this._store.delete(key);
        removed++;
      }
    }
    if (removed > 0) {
      appLogger.cache('AUTO_CLEANUP', '*', `${removed} expired entries removed`);
    }
  }

  /**
   * Shutdown cleanup interval (for graceful shutdown)
   */
  shutdown() {
    if (this._cleanupInterval) {
      clearInterval(this._cleanupInterval);
    }
  }
}

// Singleton instance — shared across the entire application
const cacheManager = new CacheManager();

// ============================================================
// Predefined Cache Keys
// ============================================================
cacheManager.KEYS = {
  CLASS_ANALYTICS: 'class:analytics',
  RISK_RANKING: 'risk:ranking',
  DASHBOARD_STATS: 'dashboard:stats',
  SUBJECT_BOTTLENECK: 'subject:bottleneck',
  studentRisk: (mssv) => `student:${mssv}:risk`,
  studentProfile: (mssv) => `student:${mssv}:profile`,
};

// ============================================================
// Predefined TTLs
// ============================================================
cacheManager.TTL = {
  CLASS_ANALYTICS: 5 * 60 * 1000,      // 5 minutes
  RISK_RANKING: 5 * 60 * 1000,          // 5 minutes
  DASHBOARD_STATS: 5 * 60 * 1000,       // 5 minutes
  STUDENT_RISK: 2 * 60 * 1000,          // 2 minutes
  STUDENT_PROFILE: 10 * 60 * 1000,      // 10 minutes
};

module.exports = cacheManager;
