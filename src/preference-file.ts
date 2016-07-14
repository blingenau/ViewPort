/// <reference path="../typings/index.d.ts" />

import * as constants from "constants";
import * as electron from "electron";
import * as fs from "mz/fs";
import * as path from "path";

const userReadWrite = 0o600;
const userReadWriteExec = 0o700;

/**
 * Interface IPreferenceFileStorage
 * 
 * Description:
 *      Read or write a named preference file. Preference files are utf-8
 *      encoded text files, typically JSON content, stored under the user's data
 *      directory.
 */
interface IPreferenceFileStorage {
    read(filename: string): Promise<string>;
    write(filename: string, content: string): Promise<void>;
}

/**
 * Class PreferenceFileLocalStorage
 * 
 * Implements: IPreferenceFileStorage
 * 
 * Description:
 *      Implements a process-local IPreferenceFileStorage.
 */
class PreferenceFileLocalStorage implements IPreferenceFileStorage {
    public read(filename: string): Promise<string> {
        let filepath = this.getPreferenceFilePath(filename);
        return fs.readFile(filepath, "utf8");
    }

    public write(filename: string, content: string): Promise<void> {
        let filepath = this.getPreferenceFilePath(filename);
        return this.makePreferenceDirectory(path.dirname(filepath))
        .then(() => {
            const options = {
                encoding: "utf8",
                mode: userReadWrite
            };
            return fs.writeFile(filepath, content, options);
        });
    }

    private getPreferenceFilePath(filename: string): string {
        return path.join(
            electron.app.getPath("appData"),
            electron.app.getName(),
            filename);
    }

    private makePreferenceDirectory(dir: string): Promise<void> {
        return fs.stat(dir)
        .catch(err => {
            if (err.code !== "ENOENT") {
                return Promise.reject(err);
            }
            return this.makePreferenceDirectory(dir.slice(0, dir.lastIndexOf(path.sep)))
            .then(() => fs.mkdir(dir, userReadWriteExec));
        })
        .then(stats => {
            if (stats && !stats.isDirectory()) {
                return Promise.reject({
                    errno: constants.ENOTDIR,
                    code: "ENOTDIR",
                    path: dir
                });
            }
        });
    }
}

/**
 * Class PreferenceFilePromiseResolver
 * 
 * Description:
 *      Stores a promise resolver and a rejector. Implementation detail for
 *      PreferenceFileRemoteStorage.
 */
class PreferenceFilePromiseResolver {
    public resolve: (content?: string) => void;
    public reject: (reason: any) => void;
};

/**
 * Class PreferenceFileRemoteStorage
 * 
 * Implements: IPreferenceFileStorage
 * 
 * Description:
 *      Implements an IPreferenceFileStorage that delegates to a
 *      PreferenceFileManager running in another process.
 */
class PreferenceFileRemoteStorage implements IPreferenceFileStorage {
    private ipc = electron.ipcRenderer;
    private counter = 0;
    private outstandingRequests: {[id: string]: PreferenceFilePromiseResolver} = {};

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

    private queueRequest<Type>(): [string, Promise<Type>] {
        let resolver: PreferenceFilePromiseResolver = {
            resolve: null,
            reject: null
        };

        let id = `${process.pid}/${this.counter}`;
        this.outstandingRequests[id] = resolver;
        this.counter++;

        let promise = new Promise<Type>((resolve: (content?: any) => void, reject: (reason: any) => void): void => {
            resolver.resolve = resolve;
            resolver.reject = reject;
        });

        return [id, promise];
    }

    private dequeueRequest(id: string): PreferenceFilePromiseResolver {
        let resolver = this.outstandingRequests[id];
        if (resolver) {
            delete this.outstandingRequests[id];
        }
        return resolver;
    }

    private onResponse(event: Electron.IpcRendererEvent,
                       id: string,
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
            resolver.reject(JSON.parse(content));
            break;
        default:
            resolver.reject(`Invalid response: ${operation}`);
            break;
        }
    }
}

const preferenceFileStorage: IPreferenceFileStorage = (process.type === "browser")
    ? new PreferenceFileLocalStorage()
    : new PreferenceFileRemoteStorage();

/**
 * Class PreferenceFile
 * 
 * Description:
 *      Represents a named preference file. Preference files are utf-8
 *      encoded text files, typically JSON content, stored under the user's data
 *      directory.
 */
export class PreferenceFile {
    private filename: string;

    /**
     * Description:
     *      Create a PreferenceFile that represents a file in
     *      {appData}/{appName}/subPath[/...subPaths]
     */
    constructor(subPath: string, ...subPaths: string[]) {
        this.filename = path.join(subPath, ...subPaths);
    }

    /**
     * Description:
     *      Read from a preference file.
     * 
     * Returns:
     *      A string promise for the entire preference file content.
     * 
     * Example:
     *      preferenceFile.read()
     *      .then(content => {
     *          // do something with the content
     *      })
     *      .catch(err => {
     *          // handle an error
     *      });
     */
    public read(): Promise<string> {
        return preferenceFileStorage.read(this.filename);
    }

    /**
     * Description:
     *      Read JSON from a preference file.
     * 
     * Returns:
     *      An any promise for the preference file JSON.
     * 
     * Example:
     *      preferenceFile.readJson()
     *      .then(json => {
     *          // do something with the JSON
     *      })
     *      .catch(err => {
     *          // handle an error
     *      });
     */
    public readJson(): Promise<any> {
        return preferenceFileStorage.read(this.filename)
        .then(content => JSON.parse(content));
    }

    /**
     * Description:
     *      Write a preference file.
     * 
     * Parameters:
     *      content - The new content of the preference file. Arrays and objects will be JSON-encoded.
     * 
     * Returns:
     *      A void promise for write completion.
     * 
     * Example:
     *      preferenceFile.write({example: "content"})
     *      .catch(err => {
     *          // handle an error
     *      });
     */
    public write(content: string | Array<any> | Object): Promise<void> {
        let stringContent: string = (typeof content === "string" || content instanceof String)
            ? content
            : JSON.stringify(content);
        return preferenceFileStorage.write(this.filename, stringContent);
    }
}

/**
 * Class PreferenceFileManager
 * 
 * Description:
 *      Handles IPC requests from remote processes to store or retrieve
 *      preference files. A single instance of this class should be created
 *      and started in the main process.
 * 
 * Example:
 *      import {PreferenceFileManager} from "./preference-file";
 *      const preferenceFileManager = new PreferenceFileManager();
 *      preferenceFileManager.start();
 */
export class PreferenceFileManager {
    private ipc = electron.ipcMain;
    private storage = new PreferenceFileLocalStorage();

    /**
     * Description:
     *      Start handling IPC requests.
     */
    public start() {
        const self = this;
        this.ipc.on("file-manager", (event, id, operation, filename, content) =>
            self.onRequest(event, id, operation, filename, content));
    }

    private onRequest(event: Electron.IpcMainEvent,
                      id: string,
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

    private readRequest(event: Electron.IpcMainEvent, id: string, filename: string): void {
        this.storage.read(filename)
        .then(content => this.sendResponse(event, id, "read", content))
        .catch(err => this.sendError(event, id, err));
    }

    private writeRequest(event: Electron.IpcMainEvent, id: string, filename: string, content: string): void {
        this.storage.write(filename, content)
        .then(() => this.sendResponse(event, id, "write"))
        .catch(err => this.sendError(event, id, err));
    }

    private sendResponse(event: Electron.IpcMainEvent, id: string, operation: string, content?: string): void {
        event.sender.send("file-manager-response", id, operation, content);
    }

    private sendError(event: Electron.IpcMainEvent, id: string, reason: any): void {
        this.sendResponse(event, id, "error", JSON.stringify(reason));
    }
}