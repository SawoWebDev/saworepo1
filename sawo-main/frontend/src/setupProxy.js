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

  // functions/api/media-upload.js and functions/media/[[path]].js are
  // Cloudflare Pages Functions — they don't exist under plain `react-scripts
  // start`, which only serves static CRA output, so image upload/replace/
  // drag-drop/paste in the CMS 404s with no local Functions runtime. Proxy
  // them to a real deployed Pages environment instead of standing up
  // wrangler locally. Override with REACT_APP_MEDIA_UPLOAD_ORIGIN if you
  // want to point at a different deployment (e.g. a personal preview URL).
  app.use(
    ['/api/media-upload', '/media'],
    createProxyMiddleware({
      target: process.env.REACT_APP_MEDIA_UPLOAD_ORIGIN || 'https://staging.saworepo1.pages.dev',
      changeOrigin: true,
      logLevel: 'warn',
    })
  );
};
