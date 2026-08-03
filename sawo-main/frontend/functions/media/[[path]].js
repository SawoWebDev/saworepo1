// functions/media/[[path]].js
// Cloudflare Pages Function — serves objects out of the `sawo-media` R2
// bucket (bound as MEDIA_BUCKET in the Pages project's dashboard settings)
// at same-origin URLs like /media/products/lovi-346-h/thumbnail-b95bf5f0.webp.
//
// Deliberately NOT using R2's public r2.dev subdomain: that path has no
// rate limiting guarantees, isn't edge-cached the same way, and — most
// importantly — is cross-origin, which would taint the <canvas> the admin
// CMS uses for WebP conversion. Serving through this same-origin Pages
// Function avoids all of that.
//
// Every object key is content-hash-suffixed by the migration script, so a
// far-future immutable Cache-Control is always safe: a changed file gets a
// brand-new key rather than overwriting an old one.

// Safety-net extension -> Content-Type map, used only when the R2 object's
// own httpMetadata.contentType wasn't set at upload time.
const EXTENSION_CONTENT_TYPES = {
  webp: "image/webp",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  pdf: "application/pdf",
};

function contentTypeFor(key, object) {
  if (object.httpMetadata?.contentType) {
    return object.httpMetadata.contentType;
  }
  const ext = key.split(".").pop()?.toLowerCase();
  return EXTENSION_CONTENT_TYPES[ext] || "application/octet-stream";
}

function headersFor(key, object) {
  const headers = new Headers();
  headers.set("Content-Type", contentTypeFor(key, object));
  headers.set("Cache-Control", "public, max-age=31536000, immutable");
  if (object.httpEtag) {
    headers.set("ETag", object.httpEtag);
  }
  return headers;
}

async function handleGet({ request, env, params }) {
  const segments = Array.isArray(params.path) ? params.path : [params.path];
  const key = segments.join("/");

  if (!key) {
    return new Response("Not found", { status: 404 });
  }

  // Range support: R2Bucket.get() accepts a `range` derived from the
  // incoming Range header, and the returned object exposes `object.range`
  // with the resolved offset/length — pass it straight through so PDFs
  // (the main beneficiary) can be partially loaded in-browser.
  const range = request.headers.get("range");
  const object = await env.MEDIA_BUCKET.get(key, range ? { range: request.headers } : undefined);

  if (!object) {
    return new Response("Not found", { status: 404 });
  }

  const headers = headersFor(key, object);

  if (object.range) {
    const { offset, length } = object.range;
    headers.set("Content-Range", `bytes ${offset}-${offset + length - 1}/${object.size}`);
    headers.set("Accept-Ranges", "bytes");
    return new Response(object.body, { status: 206, headers });
  }

  headers.set("Accept-Ranges", "bytes");
  return new Response(object.body, { status: 200, headers });
}

export async function onRequestGet(context) {
  return handleGet(context);
}

export async function onRequestHead(context) {
  const response = await handleGet(context);
  return new Response(null, { status: response.status, headers: response.headers });
}
