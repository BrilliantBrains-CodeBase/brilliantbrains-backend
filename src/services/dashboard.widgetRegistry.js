/**
 * Dashboard Widget Registry
 *
 * Enables any module to contribute widgets to the main dashboard without
 * touching dashboard code — just call register() at module init time.
 *
 * Widget shape:
 *   { key, type, title, module, value, meta? }
 *
 * Supported types (frontend-driven, extensible):
 *   "metric-card"  — single numeric KPI
 *   "stat-group"   — set of related numbers
 *   "chart"        — time-series or distribution data
 */

/** @type {Map<string, { type: string, title: string, module: string, fn: () => Promise<unknown>, meta?: object }>} */
const handlers = new Map();

/**
 * Register a widget.
 * @param {string} key - unique identifier (e.g. "totalUsers")
 * @param {{ type: string, title: string, module: string, fn: () => Promise<unknown>, meta?: object }} definition
 */
function register(key, definition) {
  if (handlers.has(key)) return; // idempotent — safe to call at require time
  handlers.set(key, definition);
}

/**
 * Resolve all registered widgets in parallel.
 * Failed widgets are included with value=null and error=true — dashboard never crashes.
 * @returns {Promise<Array<{ key: string, type: string, title: string, module: string, value: unknown, error?: boolean }>>}
 */
async function resolveAll() {
  const entries = [...handlers.entries()];
  return Promise.all(
    entries.map(async ([key, def]) => {
      try {
        const value = await def.fn();
        return { key, type: def.type, title: def.title, module: def.module, value, ...(def.meta ? { meta: def.meta } : {}) };
      } catch {
        return { key, type: def.type, title: def.title, module: def.module, value: null, error: true };
      }
    })
  );
}

/** Return all registered keys — useful for debugging / health checks */
function registeredKeys() {
  return [...handlers.keys()];
}

module.exports = { register, resolveAll, registeredKeys };
