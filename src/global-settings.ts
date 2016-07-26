// Application global settings

import {screen} from "electron";

import {PreferenceFile} from "./preference-file";
import {WorkQueue} from "./work-queue";

interface ISize {
    width: number;
    height: number;
}

interface ISettings {
    mainWindow?: ISize;
}

export class GlobalSettings {
    private settingsFile: PreferenceFile = new PreferenceFile("global-settings.json");
    private settings: ISettings = {};
    private workQueue: WorkQueue = null;
    private writeQueued: boolean = false;

    constructor(workQueue: WorkQueue) {
        this.workQueue = workQueue;
    }

    public read(): Promise<void> {
        return this.settingsFile.readJson()
        .then(settings => {
            if (settings instanceof Object && !(settings instanceof Array)) {
                this.settings = settings;
            }
        })
        .catch(err => {
            // ignore
        }).then(() => {
            // validate and configure settings
            if (!(typeof this.settings.mainWindow === "object") ||
                !(typeof this.settings.mainWindow.width === "number") ||
                !(typeof this.settings.mainWindow.height === "number")) {

                let {width, height} = screen.getPrimaryDisplay().workAreaSize;
                this.settings.mainWindow = {
                    width: Math.min(960, width),
                    height: Math.min(720, height)
                };
            }
        });
    }

    public write(): void {
        // only queue up one write at a time
        if (!this.writeQueued) {
            this.writeQueued = true;
            this.workQueue.push(() => {
                this.writeQueued = false;
                return this.settingsFile.write(this.settings);
            });
        }
    }

    public get mainWindow(): ISize {
        return this.settings.mainWindow;
    }

    public set mainWindow(size: ISize) {
        this.settings.mainWindow = size;
    }
}