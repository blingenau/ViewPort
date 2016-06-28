/// <reference path="Definitions/github-electron.d.ts" />
/// <reference path="Definitions/node.d.ts" />

const electron: Electron.ElectronMainAndRenderer = require("electron");
// Module to control application life.
const app: Electron.App = electron.app;
// Module to create a native browser window.
const BrowserWindow: typeof Electron.BrowserWindow = electron.BrowserWindow;
// Electron's dialog API
const {dialog} = require("electron");

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the javascript object is GCed.
let mainWindow: Electron.BrowserWindow = null;

// The main process's IPC.
const ipcMain: Electron.IpcMain = electron.ipcMain;

// A global variable to keep track of the number of tabs
let numTabs: number = 1;

/**
 * Function to create a browser window
 */
function createWindow(): void {
    // Create the browser window.
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        minHeight: 300,
        minWidth: 400
    });

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

    mainWindow.on("close", (event: Electron.Event) => {
        if (process.env.athenahealth_viewport_test) {
            // we don't want to present the close dialog during testing
            return;
        }
        // potentially add some ipc here to request if it is OK to close without dialog (one tab, etc.)
        if (numTabs > 1) {
            const options: Object = {
                type: "question",
                title: "Close all tabs",
                message: "Are you sure you want to close all your tabs?",
                buttons: ["Yes", "No"]
            };
            let response: Number = dialog.showMessageBox(options);

            if (response === 1) {
                event.preventDefault();
            }
        }
    });

    mainWindow.webContents.session.on("will-download", function (event, item, webContents) {
        let itemURL: string = item.getURL();
        // clicking the download button in the viewer opens a blob url, 
        // so we don't want to open those in the viewer (since that would make it impossible to download a PDF)
        if (item.getMimeType() === "application/pdf" && itemURL.indexOf("blob:") !== 0) {
            event.preventDefault();
            mainWindow.webContents.send("openPDF", {
                url: itemURL,
                event: event,
                item: item, // as of electron 0.35.1, this is an empty object
                webContents: webContents
            });
        }
        return true;
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

ipcMain.on("tabs-all-closed", (): void => {
    app.quit();
});

ipcMain.on("update-num-tabs", (event: Electron.IpcMainEvent, tabs: number): void => {
    numTabs = tabs;
});