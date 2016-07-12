// recursively find all node modules

const fs = require("fs");

module.exports = function() {
    function findNodeModules(packagePath, keys) {
        try {
            let buffer = fs.readFileSync(`${packagePath}/package.json`);
            let nodePackage = JSON.parse(buffer.toString());

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
    return keys.map(key => `./node_modules/${key}/**/*`);
}