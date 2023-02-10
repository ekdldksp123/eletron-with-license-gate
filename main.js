const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const { autoUpdater } = require("electron-updater");
const fetch = require("node-fetch");
const isDev = process.env.NODE_ENV === "development";
const licenseKey = require("nodejs-license-key");

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

  const userInfo = {
    company: "www.pace.com",
    street: "Taipei 101",
    city: "Taipei",
    state: "Taiwan",
    zip: "100",
  };

  const userLicense = {
    info: userInfo,
    prodCode: "License Test",
    appVersion: "1.0.0",
    osType: "IOS",
  };

  try {
    const license = licenseKey.createLicense(userLicense);
    console.log(license);
  } catch (error) {
    console.log(error);
  }

  ipcMain.on("GATE_SUBMIT", async (_event, { key }) => {
    const code = await validateLicenseKey(key);
    console.log(code);

    switch (code) {
      case "VALID":
        // Close the license gate window
        gateWindow.close();
        // Create our main window
        createWindow(key);
        break;
      default:
        // Exit the application
        app.exit(1);
        break;
    }
  });
}

function createWindow(key) {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      devTools: isDev,
    },
  });

  mainWindow.loadFile("index.html");

  if (!isDev) {
    autoUpdater.addAuthHeader(`License ${key}`);
    autoUpdater.checkForUpdatesAndNotify();
  }
}

app.whenReady().then(() => gateCreateWindowWithLicense(createWindow));

app.on("window-all-closed", () => app.quit());
