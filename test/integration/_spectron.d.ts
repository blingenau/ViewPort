/// <reference path="../../typings/index.d.ts" />

declare namespace Spectron {

    interface Application {
        new(options: ApplicationOptions): Application;
        setupPromiseness(): void;
        start(): PromisesAPlus.Thenable<Application>;
        stop(): PromisesAPlus.Thenable<Application>;
        restart(): PromisesAPlus.Thenable<Application>;
        isRunning(): boolean;
        exists(): PromisesAPlus.Thenable<void>;
        path: string;
        host: string;
        port: number;
        quitTimeout: number;
        startTimeout: number;
        waitTimeout: number;
        connectionRetryCount: number;
        connectionRetryTimeout: number;
        nodePath: string;
        args: Array<string>;
        env: Object;
        workingDirectory: string;
        debuggerAddress: string;
        chromeDriverLogPath: string;
        api: any;
        client: Client;
        electron: Electron.ElectronMainAndRenderer;
        browserWindow: BrowserWindow;
        webContents: WebContents;
        mainProcess: NodeJS.Process;
        renderProcess: NodeJS.Process;
    }

    interface ApplicationOptions {
        path: string;
        host?: string;
        port?: number;
        quitTimeout?: number;
        startTimeout?: number;
        waitTimeout?: number;
        connectionRetryCount?: number;
        connectionRetryTimeout?: number;
        nodePath?: string;
        args?: Array<string>;
        env?: Object;
        cwd?: string;
        debuggerAddress?: string;
        chromeDriverLogPath?: string;
        requireName?: boolean;
    }

    interface BrowserWindow extends Electron.BrowserWindow {
        capturePage(rect: Electron.Rectangle): ThenOrShould<Electron.NativeImage>;
    }

    interface Client extends WebdriverIO.Client<Client> {
        waitUntilTextExists(selector: string, text: string, timeout?: number): Client;
        waitUntilWindowLoaded(timeout?: number): Client;
        getWindowCount(): ThenOrShould<number>;
        windowByIndex(index: number): ThenOrShould<Object>;
        getSelectedText(): ThenOrShould<string>;
        getRenderProcessLogs(): ThenOrShould<Object[]>;
        getMainProcessLogs(): ThenOrShould<string[]>;
        electron: Electron.ElectronMainAndRenderer;
        browserWindow: BrowserWindow;
        webContents: WebContents;
        renderProcess: NodeJS.Process;
    }

    interface ThenOrShould<T> extends PromisesAPlus.Thenable<T> {
        should: Chai.Assertion;
    }

    interface WebContents extends Electron.WebContents {
		savePage(fullPath: string, saveType: 'HTMLOnly' | 'HTMLComplete' | 'MHTML',
                 callback?: (eror: Error) => void): boolean;
        savePage(fullPath: string, saveType: 'HTMLOnly' | 'HTMLComplete' | 'MHTML'):
            ThenOrShould<void>;
    }

}

interface Spectron {
    Application: Spectron.Application;
}

declare var Spectron: Spectron;

declare module "spectron" {
    export = Spectron;
}