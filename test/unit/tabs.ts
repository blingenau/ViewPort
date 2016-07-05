/// <reference path="../../typings/index.d.ts" />

import * as chai from "chai";
import * as sinon from "sinon";

import {IDOM, Tab, UserTabBar} from "../../src/tabs";
import {MockTabsDOM} from "./_mock-tabs-dom";

chai.should();
const {assert, expect} = chai;

type ExpectationFunction = (e: sinon.SinonExpectation) => void;
type StubFunction = (e: sinon.SinonStub) => void;

interface IMockable {
    mock(methods: {[method: string]: ExpectationFunction}): void;
    stub(methods: {[method: string]: StubFunction}): void;
    verify(): void;
    restore(): void;
};

function mockingMock(methods: {[method: string]: ExpectationFunction}): void {
    for (let method in methods) {
        if (methods[method]) {
            let expectation = this.mocked.expects(method);
            methods[method](expectation);
        }
    }
}

function mockingStub(methods: {[method: string]: StubFunction}): void {
    for (let method in methods) {
        if (methods[method]) {
            let stub = sinon.stub(this, method);
            methods[method](stub);
        }
    }
}

function mockingVerify() {
    this.mocked.verify();
}

function mockingRestore() {
    this.mocked.restore();
}

function Stub<Interface>(methods: {[method: string]: Function}): Interface & IMockable {
    let stub: any = {};
    for (let method in methods) {
        if (methods[method]) {
            stub[method] = methods[method];
        }
    }

    stub.mocked = sinon.mock(stub);

    stub.mock = mockingMock;
    stub.stub = mockingStub;
    stub.verify = mockingVerify;
    stub.restore = mockingRestore;

    return <Interface & IMockable>stub;
}

describe("Tab creation", function() {
    let dom = Stub<IDOM>({
        createWebview: (url: string, id: string): void => void 0,
        createTabElement: (title: string, id: string, url: string, tab: Tab): void => void 0,
        hideWebview: (id: string): void => void 0,
        setTitle: (id: string, title: string): void => void 0,
        setTabFavicon: (id: string, url: string): void => void 0
    });

    afterEach(() => dom.restore());

    it("can create a tab", function() {
        dom.mock({
            createWebview: e => e.once(),
            createTabElement: e => e.once()
        });

        let tab: Tab = new Tab(dom, {});
        assert(tab);

        dom.verify();
    });

    it("can hide a tab", function() {
        dom.mock({
            hideWebview: e => e.once()
        });

        let tab: Tab = new Tab(dom, {});
        tab.getActiveStatus().should.equal(true);
        tab.hide();
        tab.getActiveStatus().should.equal(false);

        dom.verify();
    });

    it("can get tab url", function() {
        let tab: Tab = new Tab(dom, {});
        tab.getUrl().should.equal("");
    });

    it("can set tab url", function() {
        dom.mock({
            setTabFavicon: e => e.once()
        });

        let tab: Tab = new Tab(dom, {});
        tab.setUrl("test");
        tab.getUrl().should.equal("test");

        dom.verify();
    });

    it("can get tab title", function() {
        let tab: Tab = new Tab(dom, {});
        tab.getTitle().should.equal("");
    });

    it("can set tab title", function() {
        dom.mock({
            setTitle: e => e.once()
        });

        let tab: Tab = new Tab(dom, {});
        tab.setTitle("test title");
        tab.getTitle().should.equal("test title");

        dom.verify();
    });
});

describe("TabBarSet functionality tests", () => {
    let doc: MockTabsDOM = null;
    let Tabs: UserTabBar = null;
    let tab1: Tab = null;
    let tab2: Tab = null;
    beforeEach(() => {
        doc = new MockTabsDOM();
        Tabs = new UserTabBar(doc);
        tab1 = new Tab(doc,{
            url:"about:blank"
        });
        tab2 = new Tab(doc,{
            url:"about:blank"
        });
    });

    it("can add tabs", function() {
        Tabs.addUser("test");
        Tabs.addTab(tab1, "test");
        Tabs.activateUser("test");
        tab1.getActiveStatus().should.equal(true);
        Tabs.addTab(tab2, "test");
        tab1.getActiveStatus().should.equal(false);
        tab2.getActiveStatus().should.equal(true);

        Tabs.size().should.equal(1);
        Tabs.getActiveTab().should.equal(tab2);
        Tabs.getUsers()[0].should.equal("test");

        Tabs.activeBar().getTab(tab1.getId()).should.equal(tab1);
        Tabs.activeBar().getTab(tab2.getId()).should.equal(tab2);
        Tabs.activeBar().getTab(tab2.getId()).should.not.equal(tab1);
        Tabs.getTab(tab1.getId()).should.equal(tab1);
        Tabs.getTab(tab2.getId()).should.equal(tab2);
        Tabs.getTab(tab1.getId()).should.not.equal(tab2);
        expect(()=> Tabs.activateUser("invalid user"))
            .to.throw("attempt to activate user that does not exist");
        assert(true);
    });

    it("can remove tabs", function () {
        Tabs.addUser("test");
        Tabs.addTab(tab1,"test");
        Tabs.activateUser("test");
        Tabs.addTab(tab2,"test");
        // must render so that an ordering to tabs could be set in doc 
        // this is due to change
        // remove an inactive tab
        Tabs.getActiveTab().should.equal(tab2);
        Tabs.removeTab(tab1.getId());

        Tabs.activeBar().getTab(tab2.getId()).getActiveStatus().should.equal(true);
        Tabs.getActiveTab().should.equal(tab2);
        assert.equal(Tabs.activeBar().getTab(tab1.getId()), null);
        assert.equal(Tabs.getTab(tab1.getId()), null);
        Tabs.removeTab(tab2.getId());
    });
    it("can remove user", () => {
        Tabs.addUser("test");
        Tabs.addTab(tab1,"test");
        Tabs.activateUser("test");

        Tabs.addUser("test2");
        Tabs.addTab(tab2,"test2");
        Tabs.activateUser("test2");

        Tabs.getActiveTab().should.equal(tab2);
        Tabs.removeUser("test");
        Tabs.size().should.equal(1);
        Tabs.getUsers()[0].should.equal("test2");
        Tabs.getUserTabBar("test2").getAllTabs()[0].should.equal(tab2);
    });
});