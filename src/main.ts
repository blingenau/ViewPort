/// <reference path="../typings/index.d.ts" />

const electron: Electron.ElectronMainAndRenderer = require("electron");
// Module to control application life.
const app: Electron.App = electron.app;
// Module to create a native browser window.
const BrowserWindow: typeof Electron.BrowserWindow = electron.BrowserWindow;
// Electron's dialog API
const {dialog} = require("electron");

import {AdmWebSocketServer} from "./adm-websocket-server";
import {PreferenceFileManager, PreferenceFile} from "./preference-file";

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
interface IGlobalSettings {
    mainWindow?: {
        width: number;
        height: number;
    };
}

let globalSettingsFile: PreferenceFile = new PreferenceFile("global-settings.json");
let globalSettings: IGlobalSettings = {};

// The ADM websocket server
const admWebSocketServer = new AdmWebSocketServer();
if (process.platform !== "darwin") {
    admWebSocketServer.start();
}

class WorkQueue {
    private queue: (() => void)[] = [];

    public empty(): boolean {
        return this.queue.length === 0;
    }

    public push(work: () => void): void {
        this.queue.push(work);
        if (this.queue.length === 1) {
            process.nextTick(() => this.dispatchWork());
        }
    }

    private dispatchWork(): void {
        Promise.resolve(this.queue[0]())
        .catch(err => {
            console.log(`Work item failed: ${JSON.stringify(err, null, 4)}`);
        })
        .then(() => {
            this.queue.shift();
            if (!this.empty()) {
                process.nextTick(() => this.dispatchWork());
            }
        });
    }
}

const workQueue = new WorkQueue();

/**
 * Function to create a browser window
 */
function createWindow(): void {
    // Read the global settings to get the window dimensions
    globalSettingsFile.readJson()
    .then(settings => {
        globalSettings = settings;
    })
    .catch(err => {
        const {width, height} = electron.screen.getPrimaryDisplay().workAreaSize;
        globalSettings.mainWindow = {
            width: Math.min(960, width),
            height: Math.min(720, height)
        };
    })
    .then(() => {
        // Create the browser window.
        let [width, height] = [800, 600];
        if (globalSettings.mainWindow) {
            width = globalSettings.mainWindow.width || width;
            height = globalSettings.mainWindow.height || height;
        }
        mainWindow = new BrowserWindow({
            width: width,
            height: height,
            minWidth: 800,
            minHeight: 600,
            titleBarStyle: "hidden-inset"
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
            globalSettings.mainWindow = {
                width: width,
                height: height
            };

            workQueue.push(() => globalSettingsFile.write(globalSettings));

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