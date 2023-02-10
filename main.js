const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");

const isDev = process.env.NODE_ENV === "development";

async function gateCreateWindowWithLicense(createWindow) {
  const gateWindow = new BrowserWindow({
    resizable: false,
    frame: false,
    width: 420,
    height: 200,
    webPreferences: {
      devTools: isDev,
      preload: path.join(__dirname, "gate.js"),
    },
  });

  gateWindow.loadFile("gate.html");

  if (isDev) {
    gateWindow.webContents.openDevTools({ mode: "detach" });
  }

  ipcMain.on("GATE_SUBMIT", async (_event, { key }) => {
    // Close the license gate window
    gateWindow.close();

    // Launch our main window
    createWindow();
  });
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
