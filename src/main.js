/// <reference path="Definitions/github-electron.d.ts" />
/// <reference path="Definitions/node.d.ts" />
var electron = require("electron");
var Menu = electron.Menu;
// Module to control application life.
var app = electron.app;
// Module to create a native browser window.
var BrowserWindow = electron.BrowserWindow;
// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the javascript object is GCed.
var mainWindow = null;
// The main process's IPC.
var ipcMain = electron.ipcMain;
// Electron's dialog API
var dialog = require("electron").dialog;
/**
 * Function to create a browser window
 */
function createWindow() {
    // Create the browser window.
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
    mainWindow.on("close", function (event) {
        var options = {
            type: "question",
            title: "Close all tabs",
            message: "Are you sure you want to close all your tabs?",
            buttons: ["Yes", "No"]
        };
        var response = dialog.showMessageBox(options);
        if (response === 1) {
            event.preventDefault();
        }
    });
    mainWindow.webContents.session.on("will-download", function (event, item, webContents) {
        var itemURL = item.getURL();
        // clicking the download button in the viewer opens a blob url, 
        // so we don't want to open those in the viewer (since that would make it impossible to download a PDF)
        if (item.getMimeType() === "application/pdf" && itemURL.indexOf("blob:") !== 0) {
            event.preventDefault();
            mainWindow.webContents.send("openPDF", {
                url: itemURL,
                event: event,
                item: item,
                webContents: webContents
            });
        }
        return true;
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
var template = [{
        label: "Extra",
        submenu: [{
                label: "System Usage",
                click: function () {
                    var modalPath = "file://" + __dirname + "/sysinfo.html";
                    var win = new BrowserWindow({ width: 400, height: 320 });
                    win.on("closed", function () { win = null; });
                    win.loadURL(modalPath);
                    win.show();
                }
            },
            {
                label: "Toggle Developer Tools",
                accelerator: process.platform === "darwin" ? "Alt+Command+I" : "Ctrl+Shift+I",
                click: function (item, focusedWindow) {
                    if (focusedWindow) {
                        focusedWindow.webContents.toggleDevTools();
                    }
                }
            },
            {
                label: "Fileupload",
                click: function () {
                    var modalPath = "file://" + __dirname + "/fileupload.html";
                    var win2 = new BrowserWindow({ width: 1000, height: 1000 });
                    win2.on("closed", function () { win2 = null; });
                    win2.loadURL(modalPath);
                    win2.webContents.openDevTools();
                    win2.show();
                }
            }]
    }];
/*
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
*/
app.on("ready", function () {
    var menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
});
ipcMain.on("tabs-all-closed", function () {
    app.quit();
});
