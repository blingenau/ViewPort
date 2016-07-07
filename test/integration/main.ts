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

    async function tabCountEquals(n: number): Promise<boolean> {
        // wait until
        // (a) there is no (n+1)th child
        // (b) there is an nth child
        return await app.client
            .waitForExist(`#tabs > div:nth-child(${n+1})`, undefined, true)
            .waitForExist(`#tabs > div:nth-child(${n})`);
    }

    it("shows an initial window", async function() {
        await app.client.getWindowCount().should.eventually.equal(2);
    });

    it("has a tab bar", async function() {
        await app.client.waitForExist("#tabs").should.eventually.be.true;
    });

    it("has a tab", async function() {
        await tabCountEquals(1).should.eventually.be.true;
    });

    it("can add a second tab", async function() {
        await app.client.click("#add-tab");
        await tabCountEquals(2).should.eventually.be.true;
    });

    it("can add a third tab", async function() {
        await app.client.click("#add-tab");
        await tabCountEquals(3).should.eventually.be.true;
    });

    it("can remove the second tab", async function() {
        await app.client.click("#tabs > div:nth-child(2) div.chrome-tab-close");
        await tabCountEquals(2).should.eventually.be.true;
    });

    it("can re-add a third tab", async function() {
        await app.client.click("#add-tab");
        await tabCountEquals(3).should.eventually.be.true;
    });

    it("can drag a tab", async function() {
        await app.client.waitForExist(".location-loaded");
        await app.client.setValue("#location", "www.google.com");
        await app.client.submitForm("#location-form");
        await app.client.dragAndDrop("#tabs > div:nth-child(2)", "#add-tab");
        await app.client.waitForVisible("#tabs > div:nth-child(3)");
        await app.client.click("#tabs > div:nth-child(3)");
        await app.client.getValue("#location").should.eventually.contain("google");
    });

    it("dragged tab is active", async function() {
        let tabID: string | string[] = await app.client.getAttribute("#tabs > div:nth-child(3)", "id");
        await app.client.getAttribute(`[tabID='${<string>tabID}']`, "style")
            .should.eventually.contain("flex");
    });

    let originalLocation: string | string[] = null;

    it("can open websites", async function() {
        await app.client.click("#add-tab");
        await app.client.waitForExist(".location-loaded");
        originalLocation = await app.client.getValue("#location");

        await app.client.setValue("#location", "www.google.com");
        await app.client.submitForm("#location-form");
        await app.client.waitForExist(".location-loaded");
        await app.client.getValue("#location").should.eventually.contain("google");

        await app.client.setValue("#location", "www.example.com");
        await app.client.submitForm("#location-form");
        await app.client.waitForExist(".location-loaded");
        await app.client.getValue("#location").should.eventually.contain("example");
    });

    // requires: "can open websites" immediately prior
    it("can navigate backwards", async function() {
        await app.client.click("#back");
        await app.client.waitForExist(".location-loaded");
        await app.client.getValue("#location").should.eventually.contain("google");

        await app.client.click("#back");
        await app.client.waitForExist(".location-loaded");
        await app.client.getValue("#location").should.eventually.equal(originalLocation);
    });

    // requires: "can navigate backwards" immediately prior
    it("can navigate forwards", async function() {
        await app.client.click("#forward");
        await app.client.waitForExist(".location-loaded");
        await app.client.getValue("#location").should.eventually.contain("google");

        await app.client.click("#forward");
        await app.client.waitForExist(".location-loaded");
        await app.client.getValue("#location").should.eventually.contain("example");
    });
});