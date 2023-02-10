const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");

const fetch = require("node-fetch");
const isDev = process.env.NODE_ENV === "development";

async function validateLicenseKey(key) {
  const validation = await fetch(
    `https://api.keygen.sh/v1/accounts/demo/licenses/actions/validate-key`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        meta: { key },
      }),
    }
  );
  const { meta, errors } = await validation.json();
  if (errors) {
    return null;
  }

  return meta.code;
}

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
    const code = await validateLicenseKey(key);
    console.log(code);

    switch (code) {
      case "VALID":
        // Close the license gate window
        gateWindow.close();
        // Create our main window
        createWindow();
        break;
      default:
        // Exit the application
        app.exit(1);
        break;
    }
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
