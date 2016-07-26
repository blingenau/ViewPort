// Application global settings

import * as tv4 from "tv4";
import {screen} from "electron";

import {PreferenceFile} from "./preference-file";
import {WorkQueue} from "./work-queue";

// See https://spacetelescope.github.io/understanding-json-schema/index.html
const settingsSchema = {
    type: "object",
    properties: {
        mainWindow: {
            type: "object",
            properties: {
                "size": {
                    type: "object",
                    properties: {
                        width: {type: "integer"},
                        height: {type: "integer"}
                    }
                }
            }
        }
    }
};

interface ISize {
    width: number;
    height: number;
}

interface IMainWindow {
    size: ISize;
}

interface ISettings {
    mainWindow: IMainWindow;
}

export class GlobalSettings {
    private settingsFile: PreferenceFile = new PreferenceFile("global-settings.json");
    private settings: ISettings = null;
    private workQueue: WorkQueue = null;

    constructor(workQueue: WorkQueue) {
        this.workQueue = workQueue;
    }

    public read(): Promise<void> {
        return this.settingsFile.readJson()
        .catch(err => ({})) // empty settings
        .then(settings => {
            this.settings = this.validOrDefault(settings);
        });
    }

    public write(): void {
        this.workQueue.push(() => this.settingsFile.write(this.settings));
    }

    public get mainWindow(): IMainWindow {
        return this.settings.mainWindow;
    }

    public set mainWindow(mainWindow: IMainWindow) {
        this.settings.mainWindow = mainWindow;
    }

    private validOrDefault(settings: any): ISettings {
        if (tv4.validate(settings, settingsSchema, false, true)) {
            return settings;
        }

        // generate default settings
        let screenSize = screen.getPrimaryDisplay().workAreaSize;

        return {
            mainWindow: {
                size: {
                    width: Math.min(960, screenSize.width),
                    height: Math.min(720, screenSize.height)
                }
            }
        };
    }
}