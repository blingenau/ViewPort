/// <reference path="../../typings/index.d.ts" />

import {Tab, UserTabBar, IDOM} from "../../src/tabs";
require("chai").should();
const assert = require("chai").assert;
const expect = require("chai").expect;

class MockDOM implements IDOM {
    public tabs: Tab[] = [];
    /**
     *  Description:
     *      creates webview element and writes it into document
     * 
     *  Return Value:
     *      none
     *  
     *  @param url   string for webview src
     *  @param id   ID to link webview to tab with attribute tabID
     */
    public createWebview(url: string, id: string): void {
        return;
    }
    /**
     *  Description:
     *      queries document for webview element matching input id. 
     *      If no id provided then get active webview. 
     *  
     *  Return Value:
     *      Electron.WebViewElement
     * 
     *  @param id   string ID corresponding to the webview's tabID to return, if empty return active webview
     */
    public getWebview(id: string = ""): Electron.WebViewElement {
        return null;
    }

    /**
     *  Description:
     *      removes webview element from document that matches id = tabID 
     *      If no id provided then remove active webview. 
     *  
     *  Return Value:
     *      none
     * 
     *  @param id   string ID corresponding to the webview's tabID to remove, if empty remove active webview
     */
    public removeWebview(id: string = ""): void {
        return;
    }

    /**
     *  Description:
     *      hides webview element from document that matches id = tabID 
     *      If no id provided then hide active webview. 
     *  
     *  Return Value:
     *      none
     * 
     *  @param id   string ID corresponding to the webview's tabID to hide, if empty hide active webview
     */
    public hideWebview(id: string): void {
        return;
    }
    /**
     *  Description:
     *      Queries document for the ordered list of current tabs 
     * 
     *  Return Value:
     *      List of Tab objects in the order that they are displayed on screen
     */
    public getAllTabs(): Tab[] {
        return;
    }
    /**
     *  Description:
     *      Given an input active tab id, return id of tab corresponding to the next active tab. 
     * 
     *  @param id   tab id that is active, use to fight neighboring tab to return.
     */
    public getNextActiveTabId(id: string): string {
        for (let index = 0; index < this.tabs.length; index++) {
            if (this.tabs[index].getId() !== id) {
                return this.tabs[index].getId();
            }
        }
        return "";
    }

    public createTabElement(title: string, id: string, url: string, tab: Tab): void {
        this.tabs.push(tab);
    }
    public allTabsClosed(): void {;}
    public getTabElement(id: string = ""): HTMLDivElement {
        return null;
    }
    public removeTabElement(id: string): void {
        this.tabs = this.tabs.filter( function (tab: Tab) {
            return tab.getId() !== id;
        });
    }
    public setTitle(id: string, title: string): void {;}
    public setTabFavicon(id: string, url: string): void {;}
}

describe("Tab functionality test", () => {
    it("can create and access tab info", () => {
        let doc: MockDOM = new MockDOM();
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
});

describe("TabBarSet functionality tests", () => {
    let doc: MockDOM = null;
    let Tabs: UserTabBar = null;
    let tab1: Tab = null;
    let tab2: Tab = null;
    beforeEach(() => {
        doc = new MockDOM();
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