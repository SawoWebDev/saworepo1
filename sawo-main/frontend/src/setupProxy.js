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
};
