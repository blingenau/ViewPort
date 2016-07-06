/// <reference path="../../typings/index.d.ts" />

import * as chai from "chai";
import * as sinon from "sinon";

import {IDOM, Tab, UserTabBar} from "../../src/tabs";
import {Mock, MockMethods} from "./_mock";

let should = chai.should();

describe("Tab creation", function() {
    it("can create a tab", function() {
        let [dom, mock] = Mock<IDOM>({
            createWebview: e => e.once(),
            createTabElement: e => e.once()
        });

        let tab: Tab = new Tab(dom, {});
        should.exist(tab);

        mock.verify();
    });

    it("can hide a tab", function() {
        let [dom, mock] = Mock<IDOM>({
            createWebview: null,
            createTabElement: null,
            hideWebview: e => e.once()
        });

        let tab: Tab = new Tab(dom, {});
        tab.getActiveStatus().should.equal(true);
        tab.hide();
        tab.getActiveStatus().should.equal(false);

        mock.verify();
    });

    it("can get tab url", function() {
        let [dom, mock] = Mock<IDOM>({
            createWebview: null,
            createTabElement: null
        });

        let tab: Tab = new Tab(dom, {});
        tab.getUrl().should.equal("");

        mock.verify();
    });

    it("can set tab url", function() {
        let [dom, mock] = Mock<IDOM>({
            createWebview: null,
            createTabElement: null,
            setTabFavicon: e => e.once()
        });

        let tab: Tab = new Tab(dom, {});
        tab.setUrl("test");
        tab.getUrl().should.equal("test");

        mock.verify();
    });

    it("can get tab title", function() {
        let [dom, mock] = Mock<IDOM>({
            createWebview: null,
            createTabElement: null
        });

        let tab: Tab = new Tab(dom, {});
        tab.getTitle().should.equal("");

        mock.verify();
    });

    it("can set tab title", function() {
        let [dom, mock] = Mock<IDOM>({
            createWebview: null,
            createTabElement: null,
            setTitle: e => e.once()
        });

        let tab: Tab = new Tab(dom, {});
        tab.setTitle("test title");
        tab.getTitle().should.equal("test title");

        mock.verify();
    });
});

describe("TabBarSet functionality tests", function() {
    function setupMocks(methods: MockMethods): [sinon.SinonMock, UserTabBar, Tab, Tab] {
        // include the method stubs that are required for all TabBarSet tests
        let allMethods = Object.assign({
            createWebview: null,
            createTabElement: null,
            hideWebview: null,
            showWebview: null
        }, methods);

        let [dom, mock] = Mock<IDOM>(allMethods);
        let tabs = new UserTabBar(dom);
        let tab1 = new Tab(dom, {
            url: "about:blank"
        });
        let tab2 = new Tab(dom, {
            url: "about:blank"
        });
        return [mock, tabs, tab1, tab2];
    }

    it("can add tabs", function() {
        let [mock, tabs, tab1, tab2] = setupMocks({});

        tabs.addUser("test");
        tabs.addTab(tab1, "test");
        tabs.activateUser("test");

        tab1.getActiveStatus().should.equal(true);

        tabs.addTab(tab2, "test");

        tab1.getActiveStatus().should.equal(false);
        tab2.getActiveStatus().should.equal(true);
        tabs.size().should.equal(1);
        tabs.getActiveTab().should.equal(tab2);
        tabs.getUsers()[0].should.equal("test");
        tabs.activeBar().getTab(tab1.getId()).should.equal(tab1);
        tabs.activeBar().getTab(tab2.getId()).should.equal(tab2);
        tabs.activeBar().getTab(tab2.getId()).should.not.equal(tab1);
        tabs.getTab(tab1.getId()).should.equal(tab1);
        tabs.getTab(tab2.getId()).should.equal(tab2);
        tabs.getTab(tab1.getId()).should.not.equal(tab2);

        mock.verify();
    });

    it("can remove tabs", function () {
        let [mock, tabs, tab1, tab2] = setupMocks({
            removeWebview: e => e.twice(),
            removeTabElement: e => e.twice(),
            getNextActiveTabId: e => e.returns(""),
            allTabsClosed: e => e.once()
        });

        tabs.addUser("test");
        tabs.addTab(tab1,"test");
        tabs.activateUser("test");
        tabs.addTab(tab2,"test");

        tabs.getActiveTab().should.equal(tab2);

        tabs.removeTab(tab1.getId());

        tabs.activeBar().getTab(tab2.getId()).getActiveStatus().should.equal(true);
        tabs.getActiveTab().should.equal(tab2);
        should.not.exist(tabs.activeBar().getTab(tab1.getId()));
        should.not.exist(tabs.getTab(tab1.getId()));

        tabs.removeTab(tab2.getId());

        mock.verify();
    });

    it("can remove user", () => {
        let [mock, tabs, tab1, tab2] = setupMocks({
            removeTabElement: e => e.once(),
            removeWebview: e => e.once(),
            allTabsClosed: e => e.once()
        });

        tabs.addUser("test");
        tabs.addTab(tab1,"test");
        tabs.activateUser("test");

        tabs.addUser("test2");
        tabs.addTab(tab2,"test2");
        tabs.activateUser("test2");

        tabs.getActiveTab().should.equal(tab2);

        tabs.removeUser("test");

        tabs.size().should.equal(1);
        tabs.getUsers()[0].should.equal("test2");
        tabs.getUserTabBar("test2").getAllTabs()[0].should.equal(tab2);

        mock.verify();
    });

    it("cannot switch to non-existent user", function() {
        let [mock, tabs, tab1, tab2] = setupMocks({});

        tabs.addUser("test");
        tabs.addTab(tab1, "test");
        tabs.activateUser("test");
        tabs.addTab(tab2, "test");

        should.Throw(() => tabs.activateUser("invalid user"),
            "attempt to activate user that does not exist");

        mock.verify();
    });
});