/// <reference path="Definitions/github-electron.d.ts" />
/// <reference path="Definitions/node.d.ts" />
var electron = require("electron");
// Module to control application life.
var app = electron.app;
// Module to create a native browser window.
var BrowserWindow = electron.BrowserWindow;
// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the javascript object is GCed.
var mainWindow = null;
/**
 * Function to create a browser window
 */
function createWindow() {
    // CReate the browser window.
    mainWindow = new BrowserWindow({ width: 800, height: 600 });
    // Load the index.html of the app
    mainWindow.loadURL("file://" + __dirname + "/index.html");
    // Open the DevTOols.
    // mainWindow.webContents.openDevTools();
    // Emitted when the window is closed
    mainWindow.on("closed", function () {
        // Dereference the window object. Usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null;
    });
}
// This method will be called when ELectron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", function () {
    createWindow();
});
// Quit when all windows are closed.
app.on("windows-all-closed", function () {
    // On OS X it is commnon for applications and their menu bar
    // to stay actuve until the user quits explicitly with Cmd + Q
    if (process.platform !== "darwin") {
        app.quit();
    }
});
app.on("activate", function () {
    // On OS X it's common to re-create  a window in the app when the
    // dock icon is clicked and there are on other windows open.
    if (mainWindow === null) {
        createWindow();
    }
});
