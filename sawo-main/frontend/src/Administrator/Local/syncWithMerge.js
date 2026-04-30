const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";

/**
 * Streams sync progress from the backend.
 * Calls onEvent(event) for each phase. Returns the final summary.
 * Does EVERYTHING automatically: pulls Supabase data, downloads images/files,
 * mirrors products.json to saworepo2, and git commit/pushes to GitHub.
 */
export async function syncSupabaseToLocal(onEvent = () => {}) {
  let response;
  const syncUrl = `${BACKEND_URL}/api/sync`;
  const healthUrl = `${BACKEND_URL}/health`;

  try {
    console.log(`🔗 Attempting to sync from: ${syncUrl}`);
    console.log(`⚙️ REACT_APP_BACKEND_URL = ${process.env.REACT_APP_BACKEND_URL || "NOT SET"}`);

    response = await fetch(syncUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("❌ Fetch Error:", err);
    const errorMsg = `
      🚨 Cannot reach backend at ${syncUrl}

      Error: ${err.message}

      📋 Troubleshooting:
      • Check if backend is running: ${healthUrl}
      • Verify REACT_APP_BACKEND_URL is set correctly
      • Check browser Network tab for CORS errors
      • Ensure backend CORS allows your frontend domain
      • Try visiting the URL directly in your browser
    `.trim();
    console.error(errorMsg);
    return {
      success: false,
      message: errorMsg,
    };
  }

  if (!response.ok || !response.body) {
    const statusMsg = `Server error: ${response.status} ${response.statusText}`;
    const debugMsg = `
      ❌ ${statusMsg}

      📋 Response Details:
      • Status Code: ${response.status}
      • Status Text: ${response.statusText}
      • URL Requested: ${syncUrl}
      • Headers: ${JSON.stringify([...response.headers.entries()])}

      🔍 Common causes:
      • Backend not deployed or crashed
      • CORS misconfiguration
      • Wrong backend URL in environment variables
      • Backend endpoint doesn't exist

      ✅ Quick checks:
      1. Visit health check: ${healthUrl}
      2. Check backend logs in your deployment platform dashboard
      3. Verify CORS allows ${window.location.origin}
    `.trim();
    console.error(debugMsg);
    return {
      success: false,
      message: debugMsg,
    };
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let final = null;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let nl;
      while ((nl = buffer.indexOf("\n")) !== -1) {
        const line = buffer.slice(0, nl).trim();
        buffer = buffer.slice(nl + 1);
        if (!line) continue;
        try {
          const event = JSON.parse(line);
          onEvent(event);
          if (event.phase === "complete" || event.phase === "error") {
            final = event;
          }
        } catch {
          // ignore malformed line
        }
      }
    }
  } catch (err) {
    const streamErrorMsg = `
      ❌ Stream Error: ${err.message}

      📋 This usually means:
      • Backend connection was lost mid-sync
      • Network timeout occurred
      • Backend crashed during processing

      🔍 Check:
      1. Backend logs in your deployment platform dashboard
      2. Network tab in DevTools for failed requests
      3. Backend is still running: ${healthUrl}
    `.trim();
    console.error(streamErrorMsg);
    return { success: false, message: streamErrorMsg };
  }

  if (final?.phase === "error") {
    return { success: false, message: final.message || "Sync failed" };
  }

  if (final?.phase === "complete") {
    return {
      success: true,
      message: final.message,
      stats: final.stats,
      timestamp: final.timestamp,
      pushed: final.pushed,
    };
  }

  return { success: false, message: "Sync ended unexpectedly" };
}