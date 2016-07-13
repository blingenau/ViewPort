/// <reference path="../typings/index.d.ts" />

import * as electron from "electron";
import * as fs from "mz/fs";
import * as path from "path";

const userReadWrite = 0o600;
const userReadWriteExec = 0o700;

export class PreferenceFileManager {
    private ipc = electron.ipcMain;

    public start() {
        const self = this;
        this.ipc.on("file-manager", (event, id, operation, filename, content) =>
            self.onRequest(event, id, operation, filename, content));
    }

    private onRequest(event: Electron.IpcMainEvent,
                      id: number,
                      operation: string,
                      filename: string,
                      content?: string): void {
        switch (operation) {
        case "read":
            this.readRequest(event, id, filename);
            break;
        case "write":
            this.writeRequest(event, id, filename, content);
            break;
        default:
            this.sendError(event, id, `Invalid request: ${operation}`);
            break;
        }
    }

    private readRequest(event: Electron.IpcMainEvent, id: number, filename: string): void {
        let filepath = this.getPreferenceFilePath(filename);
        fs.readFile(filepath, "utf8")
        .then(content => this.sendResponse(event, id, "read", content))
        .catch(err => this.sendError(event, id, err));
    }

    private writeRequest(event: Electron.IpcMainEvent, id: number, filename: string, content: string): void {
        let filepath = this.getPreferenceFilePath(filename);
        this.makePreferenceDirectory(path.dirname(filepath))
        .then(() => {
            const options = {
                encoding: "utf8",
                mode: userReadWrite
            };
            return fs.writeFile(filepath, content, options);
        })
        .then(() => this.sendResponse(event, id, "write"))
        .catch(err => this.sendError(event, id, err));
    }

    private getPreferenceFilePath(filename: string): string {
        return path.join(
            electron.app.getPath("appData"),
            electron.app.getName(),
            filename);
    }

    private makePreferenceDirectory(dir: string): Promise<void> {
        return fs.stat(dir)
        .catch(() => {
            return this.makePreferenceDirectory(dir.slice(0, dir.lastIndexOf(path.sep)))
            .then(() => fs.mkdir(dir, userReadWriteExec));
        })
        .then(stats => {
            if (stats && !stats.isDirectory()) {
                throw new Error(`Not a directory: ${dir}`);
            }
        });
    }

    private sendResponse(event: Electron.IpcMainEvent, id: number, operation: string, content?: string): void {
        event.sender.send("file-manager-response", id, operation, content);
    }

    private sendError(event: Electron.IpcMainEvent, id: number, reason: any): void {
        this.sendResponse(event, id, "error", reason.toString());
    }
}

class PreferenceFilePromiseResolver {
    public resolve: (content?: string) => void;
    public reject: (reason: any) => void;
};

class PreferenceFileManagerRenderer {
    private ipc = electron.ipcRenderer;
    private outstandingRequestsCounter = 0;
    private outstandingRequests: {[id: number]: PreferenceFilePromiseResolver} = {};

    constructor() {
        const self = this;
        this.ipc.on("file-manager-response", (event, id, operation, content) =>
            self.onResponse(event, id, operation, content));
    }

    public read(filename: string): Promise<string> {
        let [id, promise] = this.queueRequest<string>();
        this.ipc.send("file-manager", id, "read", filename);
        return promise;
    }

    public write(filename: string, content: string): Promise<void> {
        let [id, promise] = this.queueRequest<void>();
        this.ipc.send("file-manager", id, "write", filename, content);
        return promise;
    }

    private queueRequest<Type>(): [number, Promise<Type>] {
        let resolver: PreferenceFilePromiseResolver = {
            resolve: null,
            reject: null
        };

        let id = this.outstandingRequestsCounter++;
        this.outstandingRequests[id] = resolver;

        let promise = new Promise<Type>((resolve: (content?: any) => void, reject: (reason: any) => void): void => {
            resolver.resolve = resolve;
            resolver.reject = reject;
        });

        return [id, promise];
    }

    private dequeueRequest(id: number): PreferenceFilePromiseResolver {
        let resolver = this.outstandingRequests[id];
        if (resolver) {
            delete this.outstandingRequests[id];
        }
        return resolver;
    }

    private onResponse(event: Electron.IpcRendererEvent,
                       id: number,
                       operation: string,
                       content?: any): void {
        let resolver = this.dequeueRequest(id);
        if (!resolver) {
            return;
        }

        switch (operation) {
        case "read":
            resolver.resolve(<string>content);
            break;
        case "write":
            resolver.resolve();
            break;
        case "error":
            resolver.reject(content);
            break;
        default:
            resolver.reject(`Invalid response: ${operation}`);
            break;
        }
    }
}

const preferenceFileManagerRenderer = (process.type === "browser")
    ? null
    : new PreferenceFileManagerRenderer();

export class PreferenceFile {
    private filename: string;

    constructor(filename: string) {
        this.filename = filename;
    }

    public read(): Promise<string> {
        return preferenceFileManagerRenderer.read(this.filename);
    }

    public write(content: string): Promise<void> {
        return preferenceFileManagerRenderer.write(this.filename, content);
    }
}