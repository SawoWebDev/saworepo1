/**
 * Trigger auto-sync after product uploads
 * Communicates with the sync daemon to auto-commit changes
 *
 * Note: Syncing happens via:
 * 1. HTTP POST to daemon (primary)
 * 2. Silent failures (doesn't block app)
 */

let syncTimeout = null;

/**
 * Queue an auto-sync (debounced - only syncs once per 10 seconds)
 * @param {boolean} immediate - Sync immediately instead of debouncing
 */
export async function queueAutoSync(immediate = false) {
  // Clear existing timeout if debouncing
  if (syncTimeout && !immediate) {
    clearTimeout(syncTimeout);
  }

  const doSync = async () => {
    try {
      // Trigger sync via daemon HTTP endpoint
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

      try {
        const response = await fetch('http://localhost:3001/api/sync-products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const result = await response.json();
          console.log('[AUTO-SYNC] ✅ Sync completed:', result);
          return result;
        } else {
          console.warn('[AUTO-SYNC] ⚠️  Daemon responded with:', response.status);
          // Daemon not responding, but that's okay - it might be running
          return { success: false, message: 'Daemon not available', changed: false };
        }
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          console.warn('[AUTO-SYNC] ⚠️  Sync request timed out');
        } else {
          console.log('[AUTO-SYNC] 💡 Daemon not running (expected in some environments)');
        }
        // Silently fail - daemon may not be running, but that's okay
        return { success: false, message: 'Daemon unavailable', changed: false };
      }
    } catch (error) {
      // Silently fail - this shouldn't block the app
      console.warn('[AUTO-SYNC] ⚠️  Sync error:', error.message);
      return { success: false, message: error.message, error };
    }
  };

  if (immediate) {
    return doSync();
  } else {
    // Debounce: only sync once per 10 seconds even if called multiple times
    return new Promise((resolve) => {
      syncTimeout = setTimeout(() => {
        doSync().then(resolve);
      }, 10000);
    });
  }
}

/**
 * Called after image upload completes
 */
export function onImageUploadComplete() {
  console.log('[AUTO-SYNC] Image upload detected, queueing sync...');
  queueAutoSync(false); // Debounced sync
}

/**
 * Called after product save completes
 */
export function onProductSaveComplete() {
  console.log('[AUTO-SYNC] Product saved, queueing immediate sync...');
  queueAutoSync(true); // Immediate sync after product save
}

/**
 * Disable auto-sync (for development)
 */
export function disableAutoSync() {
  if (syncTimeout) {
    clearTimeout(syncTimeout);
    syncTimeout = null;
  }
}
