/// <reference path="../promises-a-plus/promises-a-plus.d.ts" />

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

    interface Client extends PromisesAPlus.Thenable<void> {
        waitUntilTextExists(selector: string, text: string, timeout?: number): Client;
        waitUntilWindowLoaded(timeout?: number): Client;
        getWindowCount(): Object;
        windowByIndex(index: number): Object;
        getSelectedText(): Object;
        getRenderProcessLogs(): Object;
        getMainProcessLogs(): Object;
    }

}

interface Spectron {
    Application: Spectron.Application;
}

declare var Spectron: Spectron;

declare module "spectron" {
    export = Spectron;
}