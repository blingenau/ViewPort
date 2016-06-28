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
    getNextActiveTabID(id: string): string;
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

    /**
     *  Description:
     *      constructor for Tab class
     *  
     *  @param d   DOM object for handling document interaction
     *  @param tab   object to populate url, title, and active status of Tab
     */
    constructor (d: IDOM, tab: any) {
        this.url = tab.url || "";
        this.id = Math.round(Math.random() * 100000000000000000).toString();
        this.title = tab.title || "";
        this.dom = d;
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
    public setURL(url: string): void {
        this.url = url;
    }
    /**
     *  Description:
     *      returns string ID of Tab
     */
    public getID(): string {
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

interface ITabMap {
    [id: string]: Tab;
}
/** 
 *  Class TabBar:
 * 
 *  Description: 
 *      Organizes Tab objects and handles displaying them in some way
 *  Properties:
 *      user: string - user_id associated with a set of tabs
 *      tabs: Tab[] - list of Tab objects (see Tab class)
 *      activeTab: number - index of tab in the list that is the active tab 
 */
export class TabBar {
    public tabs: ITabMap;
    public activeTab: string;
    private dom: IDOM;
    constructor(d: IDOM) {
        this.tabs = {};
        this.activeTab = "";
        this.dom = d;
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
    public get(id: string): Tab {
        if (this.tabs.hasOwnProperty(id)) {
            return this.tabs[id];
        }
        return null;
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
    public add_tab(tab: Tab): void {
        // if there is an active tab currently, set it to inactive
        this.tabs[tab.getID()] = tab;
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
            console.log("Popping from empty TabBar");
            return false;
        } else if (this.size() === 1) {
            require("electron").ipcRenderer.send("tabs-all-closed");
            return true;
        }

        let tab: Tab = this.get(tabID);
        if (tab !== null) {
            if (tab.getActive()) {
                this.activeTab = this.dom.getNextActiveTabID(tabID);
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
    public active(): Tab {
        return this.get(this.activeTab);
    }
    /**
     *  Description:
     *      activate the given tab, and set all other tabs in TabBar to inactive
     *  Return value:
     *      none
     * 
     * @param tab   Tab object to make active, make all others inactive.
     */
    public activate(tab: Tab): void {
        let active: Tab = this.active();
        if (active !== null) {
            active.setActive(false);
        }
        tab.setActive(true);
        this.activeTab = tab.getID();
    }
    /**
     *  Description:
     *      Clears all tabs from bar
     */
    public clearAllTabs(): void {
        while (this.size()) {
            this.removeTab(this.active().getID());
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
}

/**
 *  Description:
 *      define interface for user->TabBar dictionary
 */
interface IUserMap {
    [user: string]: TabBar;
}

/**
 * class TabBarSet:
 * 
 * Description:
 *      Overarching handler for Tabs and TabBars. 
 *      Essentially TabBarSet organizes multiple TabBars with their user.
 *      A user must have a non-zero number of tabs to have a TabBar
 */
export class TabBarSet {
    // figure out how to make this typed as string -> TabBar instead of any
    public bars: IUserMap;
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
    public get(user: string): TabBar {
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
            bar.add_tab(tab);
            this.bars[user] = bar;
        }else {
            bar.add_tab(tab);
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
    public activate(user: string): void {
        let bar: TabBar = this.get(user);
        if (bar === null) {
            console.error("attempt to activate user that does not exist");
            return;
        }
        this.activeUser = user;
        // set all other tabs to inactive (hidden)
        let self: TabBarSet = this;
        Object.keys(this.bars).forEach(function (key: string){
            self.bars[key].hideTabs();
        });
        // set tab state of active tab in bar to active
        bar.active().setActive(true);
    }
    /**
     *  Description:
     *      returns the active Tab object from the active user's TabBar
     */
    public activeTab(): Tab {
        return this.activeBar().active();
    }
    /**
     *  Description:
     *      returns the active TabBar object 
     */
    public activeBar(): TabBar {
        return this.bars[this.activeUser];
    }
    /**
     * Description:
     *      returns the Tab object associated with the given id
     *  @param tab_id   tab id to search for
     */
    public getTab(tabID: string): Tab {
        let self: TabBarSet = this;
        /*let result: Tab = Object.keys(this.bars).map( function (key: string) {
            return self.bars[key].get(tabID);
        }).find(function (val: Tab){
            return val !== null;
        });*/
        let result: Tab[] = Object.keys(this.bars).map( function (key: string) {
            return self.bars[key].get(tabID);
        }).filter(function (val: Tab){
            return val !== null;
        });

        if (result.length) {
            return result[0];
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