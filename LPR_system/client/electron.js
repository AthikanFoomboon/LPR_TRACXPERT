const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const mainWindow = new BrowserWindow({
    fullscreen: true, // เปิดหน้าต่างในโหมดเต็มจอ
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false,
    }
  });

  // ใช้เส้นทางแบบ absolute เพื่อโหลดไฟล์ index.html จากโฟลเดอร์ build
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // หากต้องการให้เป็นหน้าต่างขยายเต็มขนาดหน้าจอแบบไม่ fullscreen
  // mainWindow.maximize();
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
