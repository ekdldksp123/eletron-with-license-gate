const { app, BrowserWindow } = require("electron");

const isDev = process.env.NODE_ENV === "development";

async function gateCreateWindowWithLicense(createWindow) {
  const gateWindow = new BrowserWindow({
    resizable: false,
    frame: false,
    width: 420,
    height: 200,
    webPreferences: {
      devTools: isDev,
    },
  });

  gateWindow.loadFile("gate.html");

  if (isDev) {
    gateWindow.webContents.openDevTools({ mode: "detach" });
  }

  // TODO Create main window for valid licenses
}

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      devTools: isDev,
    },
  });

  mainWindow.loadFile("index.html");
}

app.whenReady().then(() => gateCreateWindowWithLicense(createWindow));

app.on("window-all-closed", () => app.quit());
