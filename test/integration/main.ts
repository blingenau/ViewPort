/// <reference path="../../typings/index.d.ts" />

import createApplication from "./_application";

describe("application launch", function() {
    // default timeout (ms) for async operations
    this.timeout(5000);

    let app: Spectron.Application = null;

    before(function() {
        app = createApplication();
        return app.start();
    });

    after(function() {
        return app.stop();
    });

    function tabCountEquals(n: number): Q.IPromise<boolean> {
        // wait until
        // (a) there is no (n+1)th child
        // (b) there is an nth child
        return app.client
            .waitForExist(`#tabs > div:nth-child(${n+1})`, undefined, true)
            .waitForExist(`#tabs > div:nth-child(${n})`);
    }

    it("shows an initial window", function() {
        return app.client.getWindowCount().should.eventually.equal(2);
    });

    it("has a tab bar", function() {
        return app.client.waitForExist("#tabs").should.eventually.be.true;
    });

    it("has a tab", function() {
        return tabCountEquals(1).should.eventually.be.true;
    });

    it("can add a second tab", function() {
        return app.client.click("#add-tab").then(function() {
            return tabCountEquals(2).should.eventually.be.true;
        });
    });

    it("can add a third tab", function() {
        return app.client.click("#add-tab").then(function() {
            return tabCountEquals(3).should.eventually.be.true;
        });
    });

    it("can remove the second tab", function() {
        return app.client.click("#tabs > div:nth-child(2) div.chrome-tab-close")
            .then(function() {
                tabCountEquals(2).should.eventually.be.true;
            });
    });
});