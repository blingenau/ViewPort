/// <reference path="../../typings/index.d.ts" />

import * as chai from "chai";

import {Tab, UserTabBar} from "../../src/tabs";
import {MockTabsDOM} from "./_mock-tabs-dom";

chai.should();
const {assert, expect} = chai;

describe("Tab functionality test", () => {
    let doc: MockTabsDOM = new MockTabsDOM();
    let tab: Tab = new Tab(doc,{});
    tab.getActiveStatus().should.equal(true);
    tab.hide();
    tab.getActiveStatus().should.equal(false);
    tab.getUrl().should.equal("");
    tab.setUrl("test");
    tab.getUrl().should.equal("test");
    tab.getTitle().should.equal("");
    tab.setTitle("test title");
    tab.getTitle().should.equal("test title");
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