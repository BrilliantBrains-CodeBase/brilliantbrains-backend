/**
 * Simple in-memory TTL cache for dashboard metrics.
 * Designed to be swapped for Redis by changing get/set/invalidate implementations.
 *
 * TTL: 5 minutes — short enough to reflect recent changes, long enough to cut
 * repeated aggregation cost on high-traffic admin sessions.
 */
const TTL_MS = 5 * 60 * 1000;
const store = new Map();

module.exports = {
  get(key) {
    const entry = store.get(key);
    if (!entry) return null;
    if (Date.now() - entry.ts > TTL_MS) {
      store.delete(key);
      return null;
    }
    return entry.data;
  },

  set(key, data) {
    store.set(key, { data, ts: Date.now() });
  },

  invalidate(key) {
    store.delete(key);
  },

  flush() {
    store.clear();
  },

  size() {
    return store.size;
  },
};
