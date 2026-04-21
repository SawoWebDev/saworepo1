const net = require('net');
const { execFile } = require('child_process');
const path = require('path');

function findAvailablePort(startPort = 3000) {
  return new Promise((resolve, reject) => {
    const server = net.createServer();

    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        // Port is in use, try next port
        resolve(findAvailablePort(startPort + 1));
      } else {
        reject(err);
      }
    });

    server.once('listening', () => {
      server.close(() => {
        resolve(startPort);
      });
    });

    server.listen(startPort);
  });
}

async function start() {
  try {
    const port = await findAvailablePort(3000);
    console.log(`Starting React app on port ${port}...\n`);

    const env = { ...process.env, PORT: port };
    const reactScriptsCmd = path.join(__dirname, 'node_modules', '.bin', 'react-scripts.cmd');

    const child = execFile(reactScriptsCmd, ['start'], {
      env,
      stdio: 'inherit',
      cwd: __dirname,
      windowsHide: false
    });

    child.on('error', (err) => {
      console.error('Failed to start server:', err);
      process.exit(1);
    });

    child.on('exit', (code) => {
      process.exit(code || 0);
    });
  } catch (err) {
    console.error('Error finding available port:', err);
    process.exit(1);
  }
}

start();
