/// <reference path="../../typings/index.d.ts" />

import {Tab, TabBar, UserTabBar, IDOM} from "../../src/tabs";
const should = require("chai").should();

class Calculator {
    public add(x: number, y: number): number {
        return x + y;
    }
    public sub(x: number, y: number): number {
        return x - y;
    }
}

describe("calculator test", () => {
    let calc: Calculator = null;

    beforeEach(() => {
        calc = new Calculator();
    });

    afterEach(() => {
        calc = null;
    });

    it("calculates addition", () => {
        calc.add(2, 3).should.equal(5);
    });

    it("calculates subtraction", () => {
        calc.sub(5, 3).should.equal(2);
    });
});

class MockDOM implements IDOM {
    public tabs: Tab[];
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
    public getNexttabIdID(id: string): string {
        for (let index = 0; index < this.tabs.length; index++) {
            if (this.tabs[index].getId() !== id) {
                return this.tabs[index].getId();
            }
        }
        return "";
    }

    /**
     *  Description:
     *      Main render function for tabs. Handles rendering a TabBar object
     *  
     *  Return Value:
     *      none
     *  
     *  @param bar   TabBar object to render
     */
    public render(bar: TabBar): void {
        this.tabs = bar.getAllTabs();
        return;
    }
}

describe("startup test", () => {
    let doc: MockDOM = new MockDOM();
    let Tabs: UserTabBar = null;
    beforeEach(() => {
        Tabs = new UserTabBar(doc);
    });

    it("test UserTabBar functionality", function() {
        Tabs = <UserTabBar>Tabs;
        let tab1: Tab = new Tab(doc,{
            url:"about:blank"
        });
        let tab2: Tab = new Tab(doc,{
            url:"about:blank"
        });
        Tabs.addTab("test", tab1);
        tab1.getActiveStatus().should.equal(true);
        Tabs.addTab("test", tab2);
        tab1.getActiveStatus().should.equal(false);
        tab2.getActiveStatus().should.equal(true);

        Tabs.activateUser("test");
        Tabs.size().should.equal(1);
        Tabs.activeUser.should.equal("test");
        Tabs.activeBar().getTab(tab1.getId()).getId().should.equal(tab1.getId());
        Tabs.activeBar().getTab(tab2.getId()).getId().should.equal(tab2.getId());
        Tabs.activeBar().getTab(tab2.getId()).getId().should.not.equal(tab1.getId());

        doc.render(Tabs.activeBar());
        Tabs.removeTab("test",tab1.getId());
        Tabs.activeBar().getTab(tab2.getId()).getActiveStatus().should.equal(true);
        should.not.exist(Tabs.activeBar().getTab(tab1.getId()));
        return;
    });
});