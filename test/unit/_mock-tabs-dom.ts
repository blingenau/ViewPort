/// <reference path="../../typings/index.d.ts" />

import {Tab, IDOM} from "../../src/tabs";

export class MockTabsDOM implements IDOM {
    public tabs: Tab[] = [];

    public createWebview(url: string, id: string): void {
        return;
    }

    public getWebview(id: string = ""): Electron.WebViewElement {
        return null;
    }

    public removeWebview(id: string = ""): void {
        return;
    }

    public hideWebview(id: string): void {
        return;
    }

    public getAllTabs(): Tab[] {
        return;
    }

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