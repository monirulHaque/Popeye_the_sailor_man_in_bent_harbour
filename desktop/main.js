// Minimal Electron shell for a desktop (Steam) build. Not installed by default:
//   npm i -D electron && npm run desktop
const { app, BrowserWindow } = require('electron');
const path = require('path');
app.whenReady().then(() => {
  const win = new BrowserWindow({ width: 1280, height: 800, backgroundColor: '#15130f', autoHideMenuBar: true });
  win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
});
app.on('window-all-closed', () => app.quit());
