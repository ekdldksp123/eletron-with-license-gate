const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const { autoUpdater } = require("electron-updater");
const isDev = process.env.NODE_ENV === "development";
// const licenseKey = require("nodejs-license-key");
const mac = require("macaddress");
const storage = require("electron-json-storage");

function validateLicenseKey(key, mac) {
  const licenseKey = process.env.LICENSE_KEY;
  const macAddress = process.env.MAC_ADDRESS.split(",");

  if (key === licenseKey && macAddress.includes(mac)) {
    return "VALID";
  } else {
    console.log(key, mac);
    console.log(licenseKey, macAddress);
    return "INVALID";
  }
}

async function gateCreateWindowWithLicense(createWindow) {
  const certification = storage.getSync("certification");

  if (certification?.isValid) createWindow(process.env.LICENSE_KEY);
  else {
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

    let macaddress;

    try {
      macaddress = await mac.one().then((mac) => mac);

      process.env.TEMP_LICENSE_KEY = "53VS1-7D104-V4WH2-627D7-07A12-5BA30";
      process.env.TEMP_MAC_ADDRESS = "bc:d0:74:1c:92:e6,3c:a6:f6:0e:d0:4e";

      // const createdLicense = licenseKey.createLicense(userLicense);
      process.env.LICENSE_KEY = process.env.TEMP_LICENSE_KEY;
      process.env.MAC_ADDRESS = process.env.TEMP_MAC_ADDRESS;

      console.log(process.env.LICENSE_KEY);
      console.log(process.env.MAC_ADDRESS);
    } catch (error) {
      console.log(error);
    }

    ipcMain.on("GATE_SUBMIT", async (_event, { key }) => {
      const code = validateLicenseKey(key, macaddress);

      switch (code) {
        case "VALID":
          // Close the license gate window
          gateWindow.close();
          storage.set("certification", { isValid: true });
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
