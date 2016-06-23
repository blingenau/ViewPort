/// <reference path="Definitions/github-electron.d.ts" />
/// <reference path="Definitions/node.d.ts" />

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
class Tab {
    public url: string;
    public id: string;
    public title: string;
    public active: boolean;
    public webview: Electron.WebViewElement;

    constructor (tab: any) {
        this.url = tab.url || "";
        this.id = Math.round(Math.random() * 100000000000000000).toString();
        this.title = tab.title || "";
        this.webview = tab.webview || createWebview();
        this.active = tab.active || true;
        this.webview.src = this.url;
        this.webview.setAttribute("tabID", this.id);
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
 *      activeTab: number - index of tab in the list that is the active tab 
 */
class TabBar {
    public tabs: Tab[];
    public activeTab: number;
    constructor(user: string = "") {
        this.tabs = [];
        this.activeTab = -1 ;
    }
    /**   
     *  Description:
     *      gets a Tab from within the list with id matching input
     * 
     *  Return Value:
     *      Tab object matching id input if found, else null
     * 
     * @param id   id of tab to return.
     */
    public get(id: string): Tab {
        for (let index: number = 0; index < this.size(); index++) {
            if (this.tabs[index].id === id) {
                return this.tabs[index];
            }
        }
        return null;
    }
    /**
     *  Description: 
     *      returns number of tabs currently in the TabBar
     */
    public size(): number {
        return this.tabs.length;
    }
    /**
     *  Description:
     *      pushes a Tab into list of tabs
     * 
     *  Return Value:
     *      none
     * 
     *  @param tab   Tab object to insert
     *  @param background   if true open tab in background (not active), default false 
     */
    public add_tab(tab: Tab, background: boolean = false): void {
        this.tabs.push(tab);
        if (this.activeTab === -1) {
            this.activeTab = 0;
        }
        if (!background) {
            // if tab not a background tab then set it as active tab
            this.activeTab = this.size() - 1;
            this.activate(tab);
        } else {
            tab.active = false;
        }
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
            ipc.send("tabs-all-closed");
            return true;
        }

        let result: number = -1;
        for (let index = 0; index < this.size(); index++) {
            if (this.tabs[index].id === tabID) {
                result = index;
                break;
            }
        }
        if (result > -1) {
            let tab: Tab = this.tabs.splice(result, 1)[0];
            document.getElementById("webviews").removeChild(tab.webview);
            if (this.size() === 0) {
                return false;
            }
            if (tab.active) {
                // tab was active, activate another.
                this.activate(this.tabs[Math.min(result, this.size() - 1)]);
            } else {
                if (result < this.activeTab) {
                    this.activeTab--;
                }
            }
            return true;
        }
        return false;
    }
    /**
     * Description:
     *      returns active Tab object within TabBar
     */
    public active(): Tab {
        return this.tabs[this.activeTab];
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
        for (let index = 0; index < this.size(); index++) {
            this.tabs[index].active = this.tabs[index].id === tab.id;
            if (this.tabs[index].active) {
                this.activeTab = index;
            }
        }
    }
    /**
     *  Description:
     *      Clears all tabs from bar
     */
    public clearAllTabs(): void {
        while (this.size()) {
            this.removeTab(this.active().id);
        }
    }
    /**
     *  Description:
     *      Sets all tabs to inactive and hides webviews
     */
    public hideTabs(): void {
        this.tabs.forEach(function (tab: Tab) {
            tab.active = false;
            tab.webview.style.width = "0px";
            tab.webview.style.height = "0px";
        });
    }
    /**
     * Description:
     *      Handles the rendering of multiple tabs and setting up tab buttons.
     *      Currently assigns an on-click call to global Tabs variable. 
     *  
     *  Return Value: 
     *      none
     */
    public render(): void {
        let tabs: HTMLElement = document.getElementById("tabs");
        tabs.innerHTML = "";
        for (let index = 0; index < this.size(); index++) {
            let tabDiv: HTMLDivElement = document.createElement("div");
            let tabTitle: HTMLDivElement = document.createElement("div");
            let tabFavicon: HTMLDivElement = document.createElement("div");
            let tabClose: HTMLDivElement = document.createElement("div");
            let tab: Tab = this.tabs[index];
            let tabFav = "http://www.google.com/s2/favicons?domain=" + tab.url;

            tabDiv.className = "chrome-tab";
            tabDiv.id = tab.id;

            // Make the button title the name of the website not URL 
            tabTitle.title = tabTitle.innerHTML = tab.title;

            tabFavicon.innerHTML = "<img src = " + tabFav + ">";
            tabTitle.className = "chrome-tab-title";
            tabClose.className = "chrome-tab-close";
            tabFavicon.className = "chrome-tab-favicon";
            tabClose.onclick = () => {
                if (!Tabs.removeTab(Tabs.activeUser, tabDiv.id)) {
                    // if there are no more tabs close application. Temporary
                    require("electron").remote.app.quit();
                }
                Tabs.render();
            };

            tabDiv.appendChild(tabFavicon); tabDiv.appendChild(tabTitle); tabDiv.appendChild(tabClose);
            let click = function () {
                Tabs.bars[Tabs.activeUser].activate(tab);
                Tabs.render();
                tabSwitch();
            };
            tabDiv.onclick = () => { click(); };
            tabs.appendChild(tabDiv);
            if (!tab.active) {
                tab.webview.style.width = "0px";
                tab.webview.style.height = "0px";
            }
        }
        doLayout();
    }
}

/**
 * class TabBarSet:
 * 
 * Description:
 *      Overarching handler for Tabs and TabBars. 
 *      Essentially TabBarSet organizes multiple TabBars with their user.
 *      A user must have a non-zero number of tabs to have a TabBar
 */
class TabBarSet {
    // figure out how to make this typed as string -> TabBar instead of any
    public bars: any;
    public activeUser: string;
    constructor() {
        this.bars = {};
        this.activeUser = "";
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
            bar = new TabBar();
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
           this.bars[user].removeAllTabs();
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
        bar.active().active = true;
        bar.render();
    }
    /**
     *  Description:
     *      returns the active Tab object from the active user's TabBar
     */
    public activeTab(): Tab {
        return this.bars[this.activeUser].active();
    }
    /**
     * Description:
     *      returns the Tab object associated with the given id
     *  @param tab_id   tab id to search for
     */
    public getTab(tabID: string): Tab {
        let self: TabBarSet = this;
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
     *      handles rendering of the current user's TabBar.
     */
    public render(): void {
        this.bars[this.activeUser].render();
    }

    /**
     *  Description: 
     *      returns list of current users.
     */
    public getUsers(): string[] {
        return Object.keys(this.bars);
    }

}

let Tabs: TabBarSet = new TabBarSet();
window.onresize = doLayout;
let isLoading: boolean = false;
const ipc = require("electron").ipcRenderer;

onload = () => {
    Tabs.addTab("test", new Tab({
        url: "http://athenanet.athenahealth.com"
    }));
    Tabs.activate("test");
    let reload: HTMLButtonElement = <HTMLButtonElement>document.getElementById("reload");
    let urlBar: HTMLFormElement = <HTMLFormElement>document.getElementById("location-form");
    let addressBar: HTMLInputElement = <HTMLInputElement>document.getElementById("location");

    urlBar.onsubmit = (): boolean => {
        let address: string = (<HTMLInputElement>document.querySelector("#location")).value;
        Tabs.activeTab().url = address;
        navigateTo(Tabs.activeTab().webview, address);
        return false;
    };

    doLayout();

    addressBar.onfocus = (): void => {
        addressBar.select();
    };

    // Navigation button controls
    document.getElementById("back").onclick = function () {
        Tabs.activeTab().webview.goBack();
    };

    document.getElementById("forward").onclick = function () {
        Tabs.activeTab().webview.goForward();
    };

    document.getElementById("home").onclick = function () {
        navigateTo(Tabs.activeTab().webview, "http://athenanet.athenahealth.com/");
    };

    document.getElementById("add-tab").onclick = function () {
        Tabs.addTab(Tabs.activeUser, new Tab({
            url: "about:blank"
        }));
    };

    ipc.on("openPDF", function (event, filedata) {
        let PDFViewerURL: string = "file://" + __dirname + "/pdfjs/web/viewer.html?url=";
        let PDFurl: string = PDFViewerURL + filedata.url;
        Tabs.addTab(Tabs.activeUser, new Tab({
                url: PDFurl
        }));
    });

    reload.onclick = function () {
        if (isLoading) {
            Tabs.activeTab().webview.stop();
        } else {
            Tabs.activeTab().webview.reload();
        }
    };
};

/**
 * Creates a new webview
 *
 * @returns A newly created webview tag.
 */
function createWebview(): Electron.WebViewElement {
    let webview: Electron.WebViewElement = document.createElement("webview");
    webview.addEventListener("did-start-loading", handleLoadStart);
    webview.addEventListener("did-stop-loading", handleLoadStop);
    webview.addEventListener("did-fail-load", handleFailLoad);
    webview.addEventListener("load-commit", handleLoadCommit);
    webview.addEventListener("did-get-redirect-request", handleLoadRedirect);
    webview.style.display = "flex";
    webview.style.width = "640px";
    webview.style.height = "480px";
    document.getElementById("webviews").appendChild(webview);
    return webview;
}

/**
 * Navigates a tab to a new URL.
 *
 * @param webview   The webview to load the new URL into.
 * @param url   The URL to navigate to.
 * @param html   Whether the URL is local HTML to load.
 */
function navigateTo(webview: Electron.WebViewElement, url: string, html?: boolean): void {
    let address: HTMLInputElement = (<HTMLInputElement>document.querySelector("#location"));
    if (!url) {
        url = "http://athenanet.athenahealth.com";
    }

    if (url.indexOf("http") === -1 && !html) {
        url = `http://${url}`;
    }
    address.blur();
    webview.loadURL(url);
}

/**
 * Resizes the elements in the window.
 */
function doLayout(): void {
    let webview: Electron.WebViewElement = Tabs.activeTab().webview;
    let controls: HTMLDivElement = <HTMLDivElement>document.querySelector("#controls");
    let tabBar: HTMLDivElement = <HTMLDivElement>document.querySelector("#tabs-shell");
    let controlsHeight: number = controls.offsetHeight;
    let tabBarHeight: number = tabBar.offsetHeight;
    let windowWidth: number = document.documentElement.clientWidth;
    let windowHeight: number = document.documentElement.clientHeight;
    let webviewWidth: number = windowWidth;
    let webviewHeight: number = windowHeight - controlsHeight - tabBarHeight;

    webview.style.width = webviewWidth + "px";
    webview.style.height = webviewHeight + "px";
}

/**
 * Function to be called when a webview starts loading a new URL.
 *
 * @param event   The event triggered.
 */
function handleLoadStart(event: Event): void {
    document.body.classList.add("loading");
    document.getElementById("reload").innerHTML = "&#10005;";
    isLoading = true;
}

/**
 * Function to be called when a webview stops loading a new URL.
 *
 * @param event   The event triggered.
 */
function handleLoadStop(event: Event): void {
    isLoading = false;
    let address: HTMLInputElement = <HTMLInputElement>document.querySelector("#location");
    let webview: Electron.WebViewElement = <Electron.WebViewElement>event.target;
    let tab = Tabs.getTab(webview.getAttribute("tabID"));
    tab.url = webview.getAttribute("src");
    tab.title = webview.getTitle();
    address.value = tab.url;
    Tabs.render();
}

/**
 * Function to be called when a webview has committed to loading a URL.
 *
 * @param event   The event triggered.
 */
function handleLoadCommit(event: Electron.WebViewElement.LoadCommitEvent): void {
    document.getElementById("reload").innerHTML = "&#10227;";
    let address: HTMLInputElement = <HTMLInputElement>document.querySelector("#location");
    let webview: Electron.WebViewElement = <Electron.WebViewElement>event.target;

    address.value = event.url;
    (<HTMLButtonElement>document.querySelector("#back")).disabled = !webview.canGoBack();
    (<HTMLButtonElement>document.querySelector("#forward")).disabled = !webview.canGoForward();
}

/**
 * Function to be called when a webview redirects.
 *
 * @param event   The event triggered.
 */
function handleLoadRedirect(event: Electron.WebViewElement.DidGetRedirectRequestEvent): void {
    (<HTMLInputElement>document.getElementById("location")).value = event.newURL;
}

/**
 * Function to be called when a webview fails loading a URL. Loads an error page instead.
 *
 * @param event   The event triggered.
 */
function handleFailLoad(event: Electron.WebViewElement.DidFailLoadEvent): void {
    if (event.errorCode !== -3) {
        navigateTo(<Electron.WebViewElement>event.target, "file://" + __dirname + "/error.html", true);
    }
}

/**
 * Actions to happen upon a context switch from Tab to Tab.
 */
function tabSwitch(): void {
    let active: Electron.WebViewElement = Tabs.activeTab().webview;

    // Re-evaluate the back/forward navigation buttons based on new active Tab
    (<HTMLButtonElement>document.querySelector("#back")).disabled = !active.canGoBack();
    (<HTMLButtonElement>document.querySelector("#forward")).disabled = !active.canGoForward();

    document.getElementById("back").onclick = function () {
        active.goBack();
    };

    document.getElementById("forward").onclick = function () {
        active.goForward();
    };

    (<HTMLInputElement>document.getElementById("location")).value = Tabs.activeTab().webview.getURL();
}