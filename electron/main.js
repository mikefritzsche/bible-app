const { app, BrowserWindow, protocol, net, ipcMain } = require('electron');
const path = require('path');
const url = require('url');
const fs = require('fs').promises;
const os = require('os');
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

// Bible modules directory
const getModulesDir = () => {
  return path.join(app.getPath('userData'), 'bible-modules');
};

// Initialize modules directory
async function initializeModulesDir() {
  const modulesDir = getModulesDir();
  try {
    await fs.mkdir(modulesDir, { recursive: true });
  } catch (error) {
    console.error('Failed to create modules directory:', error);
  }
}

// IPC handlers for filesystem operations
ipcMain.handle('save-module-data', async (event, moduleId, data) => {
  try {
    const modulesDir = getModulesDir();
    const filePath = path.join(modulesDir, `${moduleId}.json`);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    return { success: true, path: filePath };
  } catch (error) {
    console.error(`Failed to save module ${moduleId}:`, error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('load-module-data', async (event, moduleId) => {
  try {
    const modulesDir = getModulesDir();
    const filePath = path.join(modulesDir, `${moduleId}.json`);
    const data = await fs.readFile(filePath, 'utf8');
    return { success: true, data: JSON.parse(data) };
  } catch (error) {
    console.error(`Failed to load module ${moduleId}:`, error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('delete-module-data', async (event, moduleId) => {
  try {
    const modulesDir = getModulesDir();
    const filePath = path.join(modulesDir, `${moduleId}.json`);
    await fs.unlink(filePath);
    return { success: true };
  } catch (error) {
    console.error(`Failed to delete module ${moduleId}:`, error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('list-installed-modules', async () => {
  try {
    const modulesDir = getModulesDir();
    const files = await fs.readdir(modulesDir);
    const modules = files
      .filter(file => file.endsWith('.json'))
      .map(file => file.replace('.json', ''));
    return { success: true, modules };
  } catch (error) {
    console.error('Failed to list modules:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-modules-directory', () => {
  return getModulesDir();
});

app.whenReady().then(async () => {
  await initializeModulesDir();
  createWindow();
});

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