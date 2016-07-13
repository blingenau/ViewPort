/// <reference path="../typings/index.d.ts" />

export interface IDOM {
    createWebview(url: string, id: string): void;
    allTabsClosed(): void;
    createTabElement(title: string, id: string, url: string, tab: Tab): void;
    getWebview(id: string): Electron.WebViewElement;
    getTabElement(id: string): HTMLDivElement;
    removeWebview(id: string): void;
    removeTabElement(id: string): void;
    hideTab(id: string): void;
    showTab(id: string): void;
    getNextActiveTabId(id: string): string;
    setTitle(id: string, title: string): void;
    setTabFavicon(id: string, url: string): void;
}
/**
 *  Class Tab:
 * 
 *  Description: 
 *      Organizes information needed to display a tab and webview
 *  
 *  Properties:
 *      url: string - url of the tab
 *      id: string - random unique ID for the tab
 *      active: boolean - is the tab the current active tab on screen
 *      webview: Electron.WebViewElement - webview element of tab
 */
export class Tab {
    private url: string;
    private id: string;
    private title: string;
    private active: boolean;
    private dom: IDOM;

    // come back and change to options? and create new constructor
    /**
     *  Description:
     *      constructor for Tab class
     *  
     *  @param d   DOM object for handling document interaction
     *  @param tab   object to populate url, title, and active status of Tab
     */
    constructor (dom: IDOM, tab: any) {
        this.url = tab.url || "";
        this.id = Math.round(Math.random() * 100000000000000000).toString();
        this.title = tab.title || "";
        this.dom = dom;
        this.active = tab.active || true;
        this.dom.createWebview(this.url, this.id);
        this.dom.createTabElement(this.title, this.id, this.url, this);
    }

    /**
     *  Description:
     *      Handles removal of a Tab's webview
     */
    public remove(): void {
        this.dom.removeWebview(this.id);
        this.dom.removeTabElement(this.id);
    }

    /**
     *  Description:
     *      hides Tab's webview and sets tab to inactive
     */
    public hide(): void {
        this.active = false;
        this.dom.hideTab(this.id);
    }
    public show(): void {
        this.dom.showTab(this.id);
    }
    /**
     *  Description:
     *      returns url string of Tab 
     */
    public getUrl(): string {
        return this.url;
    }
    // possibly come back and re-evaluate getters and setters 
    /**
     *  Description:
     *      sets url of Tab 
     * 
     *  @param url   url to assign to Tab
     */
    public setUrl(url: string): void {
        this.url = url;
        this.dom.setTabFavicon(this.id, url);
    }
    /**
     *  Description:
     *      returns string ID of Tab
     */
    public getId(): string { // getId
        return this.id;
    }
    /**
     *  Description:
     *      returns boolean active status of tab 
     */
    public getActiveStatus(): boolean {
        return this.active;
    }
    /**
     *  Description:
     *      sets active state of tab to input boolean
     * 
     *  @param active   boolean to assign to active state of Tab
     */
    public setActiveStatus(active: boolean): void {
        this.active = active;
    }
    /**
     *  Description:
     *      returns string title of tab
     */
    public getTitle(): string {
        return this.title;
    }
    /**
     *  Description:
     *      sets string title of tab
     *  
     *  @param title   title to set on Tab
     */
    public setTitle(title: string): void {
        this.title = title;
        this.dom.setTitle(this.id, title);
    }
}

/** 
 *  Class TabBar:
 * 
 *  Description: 
 *      Organizes Tab objects and handles displaying them in some way
 *  Properties:
 *      user: string - user_id associated with a set of tabs
 *      tabs: Tab[] - list of Tab objects (see Tab class)
 *      activeTabId: number - index of tab in the list that is the active tab 
 */
export class TabBar {
    private tabs: {[id: string]: Tab};
    private activeTabId: string;
    private dom: IDOM;
    private locked: boolean;
    constructor(d: IDOM) {
        this.tabs = {};
        this.activeTabId = "";
        this.dom = d;
        this.locked = false;
    }
    /**
     *  Description:
     *      get all of the tabs from a tab bar
     * 
     *  Return Value:
     *      a map of the tab id and Tab oject
     */
    public getTabs(): {[id: string]: Tab} {
        return this.tabs;
    }

    public getLockedStatus(): boolean {
        return this.locked;
    }
    public setLockedStatus(lock: boolean): void {
        this.locked = lock;
    }

    /**   
     *  Description:
     *      gets a Tab from within the list with id matching input
     * 
     *  Return Value:
     *      Tab object matching id input if found, else null
     * 
     * @param id   id of Tab to return.
     */
    public getTab(id: string): Tab {
        return this.tabs[id] || null;
    }

    /**
     *  Description: 
     *      returns number of tabs currently in the TabBar
     */
    public size(): number {
        return Object.keys(this.tabs).length;
    }
    /**
     *  Description:
     *      Adds a tab to the current set of tabs
     * 
     *  Return Value:
     *      none
     * 
     *  @param tab   Tab object to insert
     */
    public addTab(tab: Tab): void {
        // if there is an active tab currently, set it to inactive
        this.tabs[tab.getId()] = tab;
        this.activateTab(tab);
    }
    /**
     *  Description:
     *      Removes a tab matching tabID input.
     * 
     *  Return Value:
     *      returns remove state (true is good, false means TabBar is empty (closed) or error)
     * 
     * @param tabID   id of tab to find and remove.
     */
    public removeTab(tabID: string): void {
        let tab: Tab = this.getTab(tabID);
        if (tab !== null) {
            if (this.size() === 1) { // come back to this 
                this.dom.allTabsClosed();
            }
            if (tab.getActiveStatus()) {
                this.activeTabId = this.dom.getNextActiveTabId(tabID) || "";
                if (this.activeTabId) {
                    this.activateTab(this.getActiveTab());
                }
            }
            tab.remove();
            delete this.tabs[tabID];
        }
    }
    /**
     * Description:
     *      returns active Tab object within TabBar
     */
    public getActiveTab(): Tab { // change name to getActiveTab 
        return this.getTab(this.activeTabId);
    }
    /**
     *  Description:
     *      activate the given tab, and set all other tabs in TabBar to inactive
     *  Return value:
     *      none
     * 
     * @param tab   Tab object to make active, make all others inactive.
     */
    public activateTab(tab: Tab): void {
        let activeTab: Tab = this.getActiveTab();
        if (activeTab !== null) {
            activeTab.setActiveStatus(false);
        }
        tab.setActiveStatus(true);
        this.activeTabId = tab.getId();
        tab.show();
    }
    /**
     *  Description:
     *      Clears all tabs from bar
     */
    public clearAllTabs(): void {
        // removeAllTabs 
        // ask user if they are ready to navigate away??? 
        // should be used when you close the window 
        while (this.size()) {
            this.removeTab(this.getActiveTab().getId());
        }
    }
    /**
     *  Description:
     *      Sets all tabs to inactive and hides webviews
     */
    public hideTabs(): void {
        let self: TabBar = this;
        Object.keys(this.tabs).forEach(function (key: string) {
            self.tabs[key].hide();
        });
    }

    /**
     *  Description:
     *      Returns list of tab objects contained in the TabBar. 
     *      Note: order may not be same as order on page. 
     * 
     *  Return Value:
     *      Tab[] : list of Tab objects
     */
    public getAllTabs(): Tab[] {
        return Object.keys(this.tabs).map((key: string) => this.tabs[key]);
    }
}
/**
 * class UserTabBar:
 * 
 * Description:
 *      Overarching handler for Tabs and TabBars. 
 *      Essentially TabBarSet organizes multiple TabBars with their user.
 *      A user must have a non-zero number of tabs to have a TabBar
 */
export class UserTabBar {
    private bars: {[user: string]: TabBar};
    private activeUser: string;
    private dom: IDOM;
    constructor(d: IDOM) {
        this.bars = {};
        this.activeUser = "";
        this.dom = d;
    }
    /**
     *  Description:
     *      returns the number of TabBar objects within the set
     */
    public size(): number {
        return Object.keys(this.bars).length;
    }
    /**
     * Description:
     *      returns the TabBar associated with the user input, null if not found
     * 
     * @param user   username accociated with the returned TabBar
     */
    public getUserTabBar(user: string = ""): TabBar {
        user = user || this.activeUser;
        if (this.bars.hasOwnProperty(user)) {
            return this.bars[user];
        }
        return null;
    }

    /**
     * Adds a new user.
     * 
     * @param user   The user's name.
     */
    public addUser(user: string): void {
        this.bars[user] = new TabBar(this.dom);
    }

    /**
     *  Description
     *      adds a Tab to a users TabBar. 
     *      Creates a TabBar for them if they don't have one.
     *      Use this to create the TabBar for a user
     * 
     * @param tab   Tab object to add
     * @param user   Optional property to add the new Tab to a specific user
     */
    public addTab(tab: Tab, user: string = ""): void {
        let bar: TabBar = this.getUserTabBar(user);
        if (bar === null) {
            bar = new TabBar(this.dom);
            bar.addTab(tab);
            this.bars[user || this.activeUser] = bar;
        } else {
            bar.addTab(tab);
        }

    }
    /**
     *  Description:
     *      removes tab with tab.id = tabID from the input users bar
     *  
     *  Return Value:
     *      boolean indicating success of removal, false is problematic (TabBar is now empty and needs to be handled)
     * 
     *  @param tabID   id of tab to remove
     */
    public removeTab(tabID: string): void {
        // potentially handle case where removing tab causes empty TabBar
        let bar: TabBar = this.getUserTabBar(this.activeUser);
        if (bar !== null) {
            bar.removeTab(tabID);
        }
    }
    /**
     *  Description:
     *      removes user and destroys all their tabs and TabBar
     *  
     *  @param user   user to remove
     */
    public removeUser(user: string): void {
       if (this.bars.hasOwnProperty(user)) {
           this.bars[user].clearAllTabs();
       }
       if (user === this.activeUser) {
           this.activeUser = "";
       }
       delete this.bars[user];
    }
    /**
     *  Description:
     *      makes the given user the current user and sets up their active tab as the displayed tab
     *  
     *  @param user   user to activate
     */
    public activateUser(user: string): void {
        let bar: TabBar = this.getUserTabBar(user);
        if (bar === null) {
            throw new Error("attempt to activate user that does not exist");
        }
        this.activeUser = user;
        // set all other tabs to inactive (hidden)
        let self: UserTabBar = this;
        Object.keys(this.bars).forEach(function (key: string) {
            if (key !== user) {
                self.bars[key].hideTabs();
            }
        });
        // set tab state of active tab in bar to active
        bar.getActiveTab().setActiveStatus(true);
    }
    /**
     *  Description:
     *      returns the active Tab object from the active user's TabBar
     */
    public getActiveTab(): Tab {
        return this.getActiveTabBar().getActiveTab();
    }
    /**
     *  Description:
     *      returns the active TabBar object 
     */
    public getActiveTabBar(): TabBar {
        return this.bars[this.activeUser];
    }
    /**
     * Description:
     *      returns the Tab object associated with the given id
     *  @param tab_id   tab id to search for
     */
    public getTab(tabID: string): Tab {
        let self: UserTabBar = this;
        // commented out as you cannot yet use find with es5
        /*let result: Tab = Object.keys(this.bars).map( function (key: string) {
            return self.bars[key].get(tabID);
        }).find(function (val: Tab) {
            return val !== null;
        });*/
        let result: string[] = Object.keys(this.bars).filter(function (key: string) {
            return self.bars[key].getTab(tabID)!== null;
        });

        if (result.length) {
            return this.bars[(result[0])].getTab(tabID);
        }
        return null;
    }

    /**
     *  Description: 
     *      returns list of current users.
     */
    public getUsers(): string[] {
        return Object.keys(this.bars);
    }

    public getActiveUser(): string {
        return this.activeUser;
    }
}

// create a tab factory and tabBar factory class