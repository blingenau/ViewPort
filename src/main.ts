/// <reference path="Definitions/github-electron.d.ts" />
/// <reference path="Definitions/node.d.ts" />


const electron: Electron.ElectronMainAndRenderer = require("electron");
const Menu = electron.Menu;
// Module to control application life.
const app: Electron.App = electron.app;
// Module to create a native browser window.
const BrowserWindow: typeof Electron.BrowserWindow = electron.BrowserWindow;

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the javascript object is GCed.
let mainWindow: Electron.BrowserWindow = null;



/**
 * Function to create a browser window
 */
function createWindow(): void {
    // CReate the browser window.
    mainWindow = new BrowserWindow({ width: 800, height: 600 });

    // Load the index.html of the app
    mainWindow.loadURL(`file://${__dirname}/index.html`);

    // Open the DevTOols.
    // mainWindow.webContents.openDevTools();

    // Emitted when the window is closed
    mainWindow.on("closed", () => {
        // Dereference the window object. Usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null;
    });
}

// This method will be called when ELectron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", () => {
    createWindow();
});

// Quit when all windows are closed.
app.on("windows-all-closed", () => {
    // On OS X it is commnon for applications and their menu bar
    // to stay actuve until the user quits explicitly with Cmd + Q
    if (process.platform !== "darwin") {
        app.quit();
    }
});

app.on("activate", () => {
    // On OS X it's common to re-create  a window in the app when the
    // dock icon is clicked and there are on other windows open.
    if (mainWindow === null) {
        createWindow();
    }
});

let template = [{
  label: "Extra",
  submenu: [{
    label: "System Usage",
    click: function () {
    const modalPath = `file://${__dirname}/sysinfo.html`;
      let win = new BrowserWindow({ width: 400, height: 320 });
      win.on("closed", function () { win = null; });
      win.loadURL(modalPath);
      win.show();
    }
    },
    {
        label: "Toggle Developer Tools",
        accelerator: process.platform === "darwin" ? "Alt+Command+I" : "Ctrl+Shift+I",
        click(item: any, focusedWindow: any) {
          if (focusedWindow)
            focusedWindow.webContents.toggleDevTools();
      }
      },
      {
      label: "Fileupload",
      click: function () {
        const modalPath = `file://${__dirname}/fileupload.html`;
        let win2 = new BrowserWindow({ width: 1000, height: 1000 });
        win2.on("closed", function () { win2 = null; });
        win2.loadURL(modalPath);
        win2.webContents.openDevTools();
        win2.show();
      }
      }]
}];

function addUpdateMenuItems (items: any, position: any) {
  const version = electron.app.getVersion();
  let updateItems = [{
    label: `Version ${version}`,
    enabled: false
  }, {
    label: "Checking for Update",
    enabled: false,
    key: "checkingForUpdate"
  }, {
    label: "Check for Update",
    visible: false,
    key: "checkForUpdate",
    click: function () {
      require("electron").autoUpdater.checkForUpdates();
    }
  }, {
    label: "Restart and Install Update",
    enabled: true,
    visible: false,
    key: "restartToUpdate",
    click: function () {
      require("electron").autoUpdater.quitAndInstall();
    }
  }];

  items.splice.apply(items, [position, 0].concat(updateItems));
}


app.on("ready", () => {
    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
});