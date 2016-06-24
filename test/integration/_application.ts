/// <reference path="../../src/Definitions/node.d.ts" />
/// <reference path="../Definitions/chai/chai.d.ts" />
/// <reference path="../Definitions/chai-as-promised/chai-as-promised.d.ts" />
/// <reference path="../Definitions/spectron/spectron.d.ts" />

const packageJson = require("../../../package.json");

import * as chai from "chai";
import * as chaiAsPromised from "chai-as-promised";
import * as os from "os";
import * as path from "path";
import * as spectron from "spectron";

chai.should();
chai.use(chaiAsPromised);

export default function createApplication() {
    let appRoot: string = path.join(
        "packages",
        `${packageJson.productName}-${os.platform()}-${os.arch()}`,
        packageJson.productName);

    let appPath: string = null;
    if (os.platform() === "darwin") {
        appPath = path.resolve(
            `${appRoot}.app`,
            "Contents",
            "MacOS",
            packageJson.productName);
    } else if (os.platform() === "win32") {
        appPath = path.resolve(`${appRoot}.exe`);
    } else {
        return null;
    }

    return new spectron.Application({path: appPath});
}