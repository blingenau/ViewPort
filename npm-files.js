// recursively find all node modules

const fs = require("fs");
const LicenseCheck = require("./license-check");

module.exports = function() {
    let licenseCheck = new LicenseCheck();

    function findNodeModules(packagePath, keys) {
        try {
            let buffer = fs.readFileSync(`${packagePath}/package.json`);
            let nodePackage = JSON.parse(buffer.toString());

            if (packagePath !== ".") {
                licenseCheck.check(nodePackage);
            }

            for (let key in nodePackage.dependencies) {
                keys[key] = key;
                findNodeModules(`./node_modules/${key}`, keys);
            }
        } catch (e) {
        }
        
        return keys;
    }

    let keys = Object.getOwnPropertyNames(
        findNodeModules(".", {})
    );
    licenseCheck.report();
    return keys.map(key => `./node_modules/${key}/**/*`);
}