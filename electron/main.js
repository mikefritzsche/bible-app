const { app, BrowserWindow, protocol, net } = require('electron');
const path = require('path');
const url = require('url');
const fs = require('fs');
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

let mainWindow;

// Register protocol for serving local files
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true, stream: true } }
]);

async function createWindow() {
  // Register custom protocol for serving static files
  if (!isDev) {
    protocol.handle('app', (request) => {
      const filePath = request.url.replace('app://', '');
      const decodedPath = decodeURIComponent(filePath);
      
      // Handle the root path
      let fullPath;
      if (decodedPath === '/' || decodedPath === '') {
        fullPath = path.join(__dirname, '../out/index.html');
      } else {
        // Remove leading slash if present
        const cleanPath = decodedPath.startsWith('/') ? decodedPath.slice(1) : decodedPath;
        fullPath = path.join(__dirname, '../out', cleanPath);
      }
      
      return net.fetch('file://' + fullPath);
    });
  }

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, '../public/favicon.ico'),
    title: 'Bible App'
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    // Use the custom protocol
    mainWindow.loadURL('app:///');
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});