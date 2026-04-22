const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";

/**
 * Streams sync progress from the backend.
 * Calls onEvent(event) for each phase. Returns the final summary.
 * Does EVERYTHING automatically: pulls Supabase data, downloads images/files,
 * mirrors products.json to saworepo2, and git commit/pushes to GitHub.
 */
export async function syncSupabaseToLocal(onEvent = () => {}) {
  let response;
  try {
    response = await fetch(`${BACKEND_URL}/api/sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return {
      success: false,
      message: `Cannot reach backend — is it running on port 5000? (${err.message})`,
    };
  }

  if (!response.ok || !response.body) {
    return {
      success: false,
      message: `Server error: ${response.status} ${response.statusText}`,
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
    return { success: false, message: `Stream error: ${err.message}` };
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
