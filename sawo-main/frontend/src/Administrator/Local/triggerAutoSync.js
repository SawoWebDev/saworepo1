/**
 * Trigger auto-sync after product uploads
 * Communicates with the sync daemon to auto-commit changes
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
      // Try Node.js module (Electron or local environment)
      try {
        const { syncAndCommit } = require('../../../../../saworepo2/auto-commit-hook');
        const result = await syncAndCommit();
        console.log('[AUTO-SYNC] Sync result:', result);
        return result;
      } catch (e) {
        // Fallback: try HTTP request to local sync endpoint
        console.log('[AUTO-SYNC] Node module not available, trying HTTP...');
        const response = await fetch('http://localhost:3001/api/sync-products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          timeout: 30000,
        });

        if (response.ok) {
          const result = await response.json();
          console.log('[AUTO-SYNC] HTTP sync result:', result);
          return result;
        } else {
          console.warn('[AUTO-SYNC] HTTP sync failed:', response.status);
        }
      }
    } catch (error) {
      // Silently fail - this shouldn't block the app
      console.warn('[AUTO-SYNC] Sync failed:', error.message);
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
