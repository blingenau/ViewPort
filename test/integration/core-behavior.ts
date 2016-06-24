/// <reference path="../../src/Definitions/node.d.ts" />
/// <reference path="../Definitions/mocha/mocha.d.ts" />
/// <reference path="../Definitions/chai/chai.d.ts" />
/// <reference path="../Definitions/chai-as-promised/chai-as-promised.d.ts" />

import createApplication from "./_application";

describe("application launch", () => {
    let app: Spectron.Application = null;

    beforeEach(() => {
        app = createApplication();
        return app.start();
    });

    afterEach(() => {
        if (app && app.isRunning()) {
            return app.stop();
        }
    });

    it("shows an initial window", () => {
        app.client.waitUntilWindowLoaded()
            .getWindowCount().should.eventually.equal(1);
    });
});