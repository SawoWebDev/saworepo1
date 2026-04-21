/**
 * Sync from Supabase via backend API
 * Only adds NEW items to products.json and downloads images to saworepo2
 * Calls backend /api/sync endpoint
 */

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";

export async function syncSupabaseToLocal() {
  try {
    const response = await fetch(`${BACKEND_URL}/api/sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        message: error.message || `Server error: ${response.status}`,
        error: error.error,
      };
    }

    const result = await response.json();

    if (result.success) {
      return {
        success: true,
        message: result.message,
        added: result.added,
        total: result.total,
        imagesDownloaded: result.imagesDownloaded,
        filesDownloaded: result.filesDownloaded,
        timestamp: result.timestamp,
      };
    }

    return result;
  } catch (err) {
    return {
      success: false,
      message: `❌ Sync failed: ${err.message}`,
      error: err.message,
    };
  }
}
