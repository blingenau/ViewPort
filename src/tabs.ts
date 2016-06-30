export interface IDOM {

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
    createWebview(url: string, id: string): void;
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
    getWebview(id: string): Electron.WebViewElement;

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
    removeWebview(id: string): void;

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
    hideWebview(id: string): void;

    /**
     *  Description:
     *      Main render function for tabs. Handles rendering a TabBar object
     *  
     *  Return Value:
     *      none
     *  
     *  @param bar   TabBar object to render
     */
    render(bar: TabBar): void;

    /**
     *  Description:
     *      Queries document for the ordered list of current tabs 
     * 
     *  Return Value:
     *      List of Tab objects in the order that they are displayed on screen
     */
    getAllTabs(): Tab[];
    /**
     *  Description:
     *      Given an input active tab id, return id of tab corresponding to the next active tab. 
     * 
     *  @param id   tab id that is active, use to fight neighboring tab to return.
     */
    getNexttabIdID(id: string): string;
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
        this.id = Math.round(Math.random() * 100000000000000000).toString(); // generate random string using library 
        this.title = tab.title || "";
        this.dom = dom;
        this.active = tab.active || true;
        this.dom.createWebview(this.url, this.id);
    }

    /**
     *  Description:
     *      Handles removal of a Tab's webview
     */
    public remove(): void {
        this.dom.removeWebview(this.id);
    }

    /**
     *  Description:
     *      hides Tab's webview and sets tab to inactive
     */
    public hide(): void {
        this.active = false;
        this.dom.hideWebview(this.id);
    }
    /**
     *  Description:
     *      returns url string of Tab 
     */
    public getURL(): string {
        return this.url;
    }
    /**
     *  Description:
     *      sets url of Tab 
     * 
     *  @param url   url to assign to Tab
     */
    public setUrl(url: string): void {
        this.url = url;
    }
    /**
     *  Description:
     *      returns string ID of Tab
     */
    public getId(): string {
        return this.id;
    }
    /**
     *  Description:
     *      returns boolean active status of tab 
     */
    public getActive(): boolean {
        return this.active;
    }
    /**
     *  Description:
     *      sets active state of tab to input boolean
     * 
     *  @param active   boolean to assign to active state of Tab
     */
    public setActive(active: boolean): void {
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
 *      tabId: number - index of tab in the list that is the active tab 
 */
// variables should be private 
// active tab maybe should be a tab or renamed tabId

export class TabBar {
    private tabs: {[id: string]: Tab};
    private tabId: string;
    private dom: IDOM;
    constructor(d: IDOM) {
        this.tabs = {};
        this.tabId = "";
        this.dom = d;
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
        this.activate(tab);
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
    public removeTab(tabID: string): boolean {
        if (this.size() === 0) {
            // this should not happen
            // console.log("Popping from empty TabBar"); Remove and Test in unit tests 
            return false;
        } else if (this.size() === 1) { // come back to this 
            require("electron").ipcRenderer.send("tabs-all-closed");
            return true;
        }

        let tab: Tab = this.getTab(tabID);
        if (tab !== null) {
            if (tab.getActive()) {
                this.tabId = this.dom.getNexttabIdID(tabID) || "";
            }
            tab.remove();
            delete this.tabs[tabID];
            return true;
        }
        // if we make it here the tab wasn't found or the bar is empty
        return false;
    }
    /**
     * Description:
     *      returns active Tab object within TabBar
     */
    public active(): Tab { // change name to gettabId 
        return this.getTab(this.tabId);
    }
    /**
     *  Description:
     *      activate the given tab, and set all other tabs in TabBar to inactive
     *  Return value:
     *      none
     * 
     * @param tab   Tab object to make active, make all others inactive.
     */
    public activate(tab: Tab): void { // maybe should be activateTab
        let tabId: Tab = this.active();
        if (tabId !== null) {
            tabId.setActive(false);
        }
        tab.setActive(true);
        this.tabId = tab.getId();
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
            this.removeTab(this.active().getId());
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
        // look at a better way to do this maybe? jQuery?
    }
}
/**
 * class TabBarSet: // change to user tab bar maybe 
 * 
 * Description:
 *      Overarching handler for Tabs and TabBars. 
 *      Essentially TabBarSet organizes multiple TabBars with their user.
 *      A user must have a non-zero number of tabs to have a TabBar
 */
export class TabBarSet {
    public bars: {[user: string]: TabBar};
    public activeUser: string;
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
    public get(user: string): TabBar { // change to getUserTabBar
        if (this.bars.hasOwnProperty(user)) {
            return this.bars[user];
        }
        return null;
    }
    /**
     *  Description
     *      adds a Tab to a users TabBar. 
     *      Creates a TabBar for them if they don't have one.
     *      Use this to create the TabBar for a user
     * 
     *  @param user   user who owns the tab
     *  @param tab   Tab object to add
     */
    public addTab(user: string, tab: Tab): void {
        let bar: TabBar = this.get(user);
        if (bar === null) {
            bar = new TabBar(this.dom);
            bar.addTab(tab);
            this.bars[user] = bar;
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
     *  @param user   username of tab owner
     *  @param tabID   id of tab to remove
     */
    public removeTab(user: string, tabID: string): boolean {
        // potentially handle case where removing tab causes empty TabBar
        let bar: TabBar = this.get(user);
        if (bar !== null) {
            return bar.removeTab(tabID);
        }
        return false;
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
    public activate(user: string): void { // activate tabUser
        let bar: TabBar = this.get(user);
        if (bar === null) {
            console.error("attempt to activate user that does not exist"); // throw exception!
            return;
        }
        this.activeUser = user;
        // set all other tabs to inactive (hidden)
        let self: TabBarSet = this;
        Object.keys(this.bars).forEach(function (key: string) {
            self.bars[key].hideTabs();
        });
        // set tab state of active tab in bar to active
        bar.active().setActive(true);
    }
    /**
     *  Description:
     *      returns the active Tab object from the active user's TabBar
     */
    public tabId(): Tab { // rename activateTabBar
        return this.activeBar().active();
    }
    /**
     *  Description:
     *      returns the active TabBar object 
     */
    public activeBar(): TabBar { // gettabIdBar
        return this.bars[this.activeUser];
    }
    /**
     * Description:
     *      returns the Tab object associated with the given id
     *  @param tab_id   tab id to search for
     */
    public getTab(tabID: string): Tab {
        let self: TabBarSet = this;
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
}

// create a tab factory and tabBar factory class