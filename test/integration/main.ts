/// <reference path="../../typings/index.d.ts" />

import createApplication from "./_application";

describe("application launch", function() {
    // default timeout for async operations
    const msTimeout: number = 5000;
    this.timeout(msTimeout);

    let app: Spectron.Application = null;

    before(function() {
        app = createApplication();
        return app.start();
    });

    after(function() {
        return app.stop();
    });

    function tabCountEquals(n: number): Q.IPromise<boolean> {
        return app.client.elements("#tabs > div").then(result =>
            result.value.length === n);
    }

    it("shows an initial window", function() {
        return app.client.getWindowCount().should.eventually.equal(2);
    });

    it("has a tab bar", function() {
        return app.client.getHTML("#tabs", true).should.eventually.exist;
    });

    it("has a tab", function() {
        return app.client.waitUntil(() => tabCountEquals(1), msTimeout)
            .should.eventually.be.true;
    });

    it("can add a second tab", function() {
        return app.client.click("#add-tab").then(function() {
            return app.client.waitUntil(() => tabCountEquals(2), msTimeout)
                .should.eventually.be.true;
        });
    });

    it("can add a third tab", function() {
        return app.client.click("#add-tab").then(function() {
            return app.client.waitUntil(() => tabCountEquals(3), msTimeout)
                .should.eventually.be.true;
        });
    });

});