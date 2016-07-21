const chalk = require("chalk");

// A mapping of module name to license type, determined by manual inspection
const licenseMappingsFilename = "license-mappings.json";
const licenseException = require(`./${licenseMappingsFilename}`);

// Licenses that we will accept
const licenseWhitelistFilename = "license-whitelist.json";
const licenseWhitelist = require(`./${licenseWhitelistFilename}`).reduce((obj, value) => {
        obj[value] = true;
        return obj;
    }, {});

function caseInsensitiveCompare(s, t) {
    return s.toLowerCase().localeCompare(t.toLowerCase());
}

class LicenseCheck {
    constructor() {
        this.checkedModules = {};
        this.unexpectedLicenses = {};
        this.unlicensedModules = [];
    }

    check(nodePackage) {
        if (this.checkedModules[nodePackage.name]) {
            return;
        }
        this.checkedModules[nodePackage.name] = true;

        let licenses = [];
        if (nodePackage.license) {
            licenses.push(nodePackage.license);
        } else if (nodePackage.licenses) {
            for (let license of nodePackage.licenses) {
                licenses.push(license.type);
            }
        } else {
            let license = licenseException[nodePackage.name];
            if (license) {
                licenses.push(license);
            } else {
                this.unlicensedModules.push(nodePackage.name);
            }
        }

        for (let license of licenses) {
            if (!(license in licenseWhitelist)) {
                if (typeof this.unexpectedLicenses[license] === "undefined") {
                    this.unexpectedLicenses[license] = [];
                }
                this.unexpectedLicenses[license].push(nodePackage.name);
            }
        }
    }

    report() {
        let hasError = false;

        let unexpectedLicenseKeys = Object.getOwnPropertyNames(this.unexpectedLicenses).sort(caseInsensitiveCompare);
        if (unexpectedLicenseKeys.length > 0) {
            console.log();
            hasError = true;

            console.log(chalk.magenta("The following unexpected licenses were found:"));
            unexpectedLicenseKeys.forEach(license => {
                console.log(`  - ${chalk.cyan(license)}`);
                console.log(`      ${this.unexpectedLicenses[license].sort(caseInsensitiveCompare).join(", ")}`)
            });
            console.log("Examine the licenses, and add entries to " +
            	chalk.cyan(`${licenseWhitelistFilename}`) +
                " if they are acceptable.");
        }

        if (this.unlicensedModules.length > 0) {
            if (hasError) {
                console.log();
            }
            hasError = true;

            console.log(chalk.magenta("The following modules had no licensing information in their package.json:"));
            this.unlicensedModules.sort(caseInsensitiveCompare).forEach(name =>
                console.log(`  - ${chalk.cyan(name)}`));
            console.log("Check the licenses manually, and add entries to " +
            	chalk.cyan(`${licenseMappingsFilename}`) +
                ".");
        }

        if (hasError) {
            console.log();
            process.exit(1);
        }
    }
}

module.exports = LicenseCheck;