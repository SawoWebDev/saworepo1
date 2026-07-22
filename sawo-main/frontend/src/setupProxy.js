/**
 * setupProxy.js
 *
 * Configures Create React App dev server to proxy requests to the cache devServer.
 * This allows the app to access cached images and files at /local-storage/*
 *
 * When you run `npm start`, Create React App will detect this file and
 * automatically use it to configure webpack-dev-server proxying.
 */

const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Proxy all /local-storage/* requests to the devServer on port 3001
  app.use(
    '/local-storage',
    createProxyMiddleware({
      target: 'http://localhost:3001',
      changeOrigin: true,
      pathRewrite: {
        '^/local-storage': '/local-storage', // keep the path as-is
      },
      logLevel: 'warn',
    })
  );

  // Proxy all /api/cache/* requests to the devServer
  app.use(
    '/api/cache',
    createProxyMiddleware({
      target: 'http://localhost:3001',
      changeOrigin: true,
      logLevel: 'warn',
    })
  );

  // Proxy /fi, /de, the Next.js build asset paths they depend on (/_next),
  // and /assets — the frontend-next Home page images (Section1-5) reference
  // /assets/Home/... as absolute paths, and CRA's own public/ has no
  // /assets folder, so this is safe to hand entirely to frontend-next.
  // Without this, /fi and /de pages resolve those image URLs against the
  // CRA origin, which has no proxy rule for them and falls back to serving
  // index.html (200 OK, wrong content) instead of the actual image.
  // Override the target with REACT_APP_NEXT_DEV_ORIGIN if frontend-next runs
  // on a different port.
  app.use(
    ['/fi', '/de', '/_next', '/assets'],
    createProxyMiddleware({
      target: process.env.REACT_APP_NEXT_DEV_ORIGIN || 'http://localhost:3002',
      changeOrigin: true,
      ws: true,
      logLevel: 'warn',
    })
  );
};
