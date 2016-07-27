/// <reference path="../typings/index.d.ts" />
import * as proc from "child_process";
import * as crypto from "crypto";
const electron: Electron.ElectronMainAndRenderer = require("electron");
// Module to control application life.
const app: Electron.App = electron.app;
// Module to create a native browser window.
const BrowserWindow: typeof Electron.BrowserWindow = electron.BrowserWindow;
// Electron's dialog API
const {dialog} = require("electron");

import {AdmWebSocketServer} from "./adm-websocket-server";
import {GlobalSettings} from "./global-settings";
import {PreferenceFileManager} from "./preference-file";
import {WorkQueue} from "./work-queue";

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the javascript object is GCed.
let mainWindow: Electron.BrowserWindow = null;

// The main process's IPC.
const ipcMain: Electron.IpcMain = electron.ipcMain;

// A global variable to keep track of the number of tabs
let numTabs: number = 1;

// The preference file manager
const preferenceFileManager = new PreferenceFileManager();
preferenceFileManager.start();

// Application global settings
const workQueue = new WorkQueue();
const globalSettings = new GlobalSettings(workQueue);

// The ADM websocket server
const admWebSocketServer = new AdmWebSocketServer();
if (process.platform !== "darwin") {
    admWebSocketServer.start();
}

/**
 * Function to create a browser window
 */
function createWindow(): void {
    // Read the global settings to get the window dimensions
    globalSettings.read().then(() => {
        // Create the browser window.
        let {width, height} = globalSettings.mainWindow.size;
        mainWindow = new BrowserWindow({
            width: width,
            height: height,
            minWidth: 800,
            minHeight: 600,
            titleBarStyle: "hidden-inset",
            icon: `${__dirname}/athenaicon.ico`
        });

        // Load the index.html of the app
        let startPage = process.env.athenahealth_viewport_startpage || "index.html";
        mainWindow.loadURL(`file://${__dirname}/${startPage}`);

        // Open the DevTOols.
        // mainWindow.webContents.openDevTools();

        // Emitted when the window is closed
        mainWindow.on("closed", () => {
            // Dereference the window object. Usually you would store windows
            // in an array if your app supports multi windows, this is the time
            // when you should delete the corresponding element.
            mainWindow = null;
            BrowserWindow.getAllWindows().forEach((value: Electron.BrowserWindow): void => {
                if (value.isClosable()) {
                    value.close();
                }
            });
        });

        mainWindow.on("enter-full-screen", function () {
            mainWindow.webContents.send("enter-full-screen");
        });

        mainWindow.on("leave-full-screen", function () {
            mainWindow.webContents.send("leave-full-screen");
        });

        mainWindow.on("close", (event: Electron.Event) => {
            // Stores the window size of this session
            [width, height] = mainWindow.getSize();
            globalSettings.mainWindow.size = {
                width: width,
                height: height
            };
            globalSettings.write();

            if (process.env.athenahealth_viewport_test) {
                // we don't want to present the close dialog during testing
                return;
            }
            // potentially add some ipc here to request if it is OK to close without dialog (one tab, etc.)
            if (numTabs > 1) {
                const appName = app.getName();
                const options: Object = {
                    type: "question",
                    title: `Close ${appName}`,
                    message: `Closing ${appName} will also close all of your open tabs.`,
                    detail: `If you choose Close ${appName}, ${appName} along with all of your tabs will be closed.`,
                    buttons: [`Close ${appName}`, "Cancel"]
                };
                let response: Number = dialog.showMessageBox(mainWindow, options);

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
    });
}

app.on("before-quit", event => {
    if (workQueue.empty()) {
        return;
    }

    // defer the quit until after the work queue is empty
    event.preventDefault();
    setTimeout(() => app.quit(), 100);
});

// This method will be called when ELectron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", () => {
    createWindow();
});

// Quit when all windows are closed.
app.on("windows-all-closed", () => {
    // On OS X it is commnon for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== "darwin") {
        app.quit();
    }
});

app.on("activate", () => {
    // On OS X it's common to re-create  a window in the app when the
    // dock icon is clicked and there are no other windows open.
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

ipcMain.on("get-device-status", (event, arg) => {
    let id: string = crypto.randomBytes(16).toString("hex");
    let customData = {
                id: id,
                message: JSON.stringify({Action: "Status"})
            };
    // event.returnValue = {"device": true};
    let childProcess: proc.ChildProcess = admWebSocketServer.getChild();
    childProcess.stdout.once(id, function (response: string) {
        let connected: boolean = response.includes("1");
        event.returnValue = {"device": connected};
        console.log("connected: " + connected);
    });
    childProcess.stdin.write(JSON.stringify(customData) + "\n");
});