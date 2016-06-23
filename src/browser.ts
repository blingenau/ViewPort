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
    url: string;
    id: string;
    title: string;
    active: boolean;
    webview: Electron.WebViewElement;

    constructor (tab: any) {
        this.url = tab.url || "";
        this.id = tab.id || Math.round(Math.random() * 100000000000000000).toString();
        this.title = tab.title || "";
        this.webview = tab.webview || createWebview();
        this.active = tab.active || true;
        this.webview.src = this.url;
        this.webview.setAttribute("tab_id", this.id);
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
 *      active_tab: number - index of tab in the list that is the active tab 
*/
class TabBar {
    user: string;
    tabs: Tab[];
    active_tab: number;
    constructor(user: string = "") {
        this.tabs = [];
        this.active_tab = -1 ;
        this.user = user || Math.round(Math.random() * 100000000000000000).toString();
    }
    /**   
     *  Description:
     *      gets a Tab from within the list with id matching input
     * 
     *  Return Value:
     *      Tab object matching id input if found, else null
     * 
     * @param id   : id of tab to return.
     */
    public get(id: string): Tab {
        for (let index: number = 0; index < this.size(); index++) {
            if (this.tabs[index].id === id) {
                return this.tabs[index];
            }
        }
        return null;
    }
    /*
        Function: TabBar.size()
        returns number of tabs currently in the TabBar
    */
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
     *  @param tab   : Tab object to insert
     *  @param background   if true open tab in background (not active), default false 
     */
    public add_tab(tab: Tab, background: boolean = false): void {
        this.tabs.push(tab);
        if (this.active_tab === -1) {
            this.active_tab = 0;
        }
        if (!background) {
            // if tab not a background tab then set it as active tab
            this.active_tab = this.size() - 1;
        }
        for (let index = 0; index < this.size(); index++) {
            this.tabs[index].active = this.active_tab === index;
        }
    }
    /**
     *  Description:
     *      Removes a tab matching tab_id input.
     * 
     *  Return Value:
     *      returns remove state (true is good, false means TabBar is empty (closed) or error)
     * 
     * @param tab_id   id of tab to find and remove.
     */
    public remove_tab(tab_id: string): boolean {
        if (this.size() === 0) {
            // this should not happen
            console.log("Popping from empty TabBar");
            return false;
        }

        let result: number = -1;
        for (let index = 0; index < this.size(); index++) {
            if (this.tabs[index].id === tab_id) {
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
            }
            else {
                if (result < this.active_tab) {
                    this.active_tab--;
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
        return this.tabs[this.active_tab];
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
        let button: HTMLElement = document.getElementById(tab.id);
        for (let index = 0; index < this.size(); index++) {
            this.tabs[index].active = this.tabs[index].id === tab.id;
            if (this.tabs[index].active) {
                this.active_tab = index;
            }
        }
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
            let tabDiv: HTMLDivElement = document.createElement("div"),
                tabTitle: HTMLDivElement = document.createElement("div"),
                tabFavicon: HTMLDivElement = document.createElement("div"),
                tabClose: HTMLDivElement = document.createElement("div"),
                xButton: HTMLButtonElement = document.createElement("button"),
                tab: Tab = this.tabs[index];

            tabDiv.className = "chrome-tab";
            tabDiv.id = tab.id;

            tabTitle.title = tabTitle.innerHTML = tab.title;
            let tab_fav = "http://www.google.com/s2/favicons?domain=" + tab.url;
            tabFavicon.innerHTML = "<img src = " + tab_fav + ">";
            tabTitle.className = "chrome-tab-title";
            tabClose.className = "chrome-tab-close";
            tabFavicon.className = "chrome-tab-favicon";
            tabClose.onclick = () => {
                if (!Tabs.removeTab(Tabs.activeUser(), tabDiv.id)) {
                    // if there are no more tabs close application. Temporary
                    require("electron").remote.app.quit();
                }
                Tabs.render();
            };

            // Make the button title the name of the website not URL 

            // tabDiv.title = tabDiv.innerHTML = tab.title;

            tabDiv.appendChild(tabFavicon); tabDiv.appendChild(tabTitle); tabDiv.appendChild(tabClose);
            // xButton.innerHTML = "&#215";
            // xButton.onclick = () => { Tabs.remove_tab(tabDiv.id); };
            // tabDiv.appendChild(xButton);
            let click = function () {
                Tabs.bars[Tabs.active_bar].activate(tab);
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
    bars: TabBar[];
    active_bar: number;
    constructor() {
        this.bars = [];
        this.active_bar = -1;
    }
    /**
     *  Description:
     *      returns the number of TabBar objects within the set
     */
    public size(): number {
        return this.bars.length;
    }
    /**
     * Description:
     *      returns the TabBar associated with the user input, null if not found
     * 
     * @param user   username accociated with the returned TabBar
     */
    public get(user: string): TabBar {
        for (let index = 0; index < this.size(); index++) {
            if (user === this.bars[index].user) {
                return this.bars[index];
            }
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
            bar = new TabBar(user);
            bar.add_tab(tab);
            this.bars.push(bar);
        }
        else {
            bar.add_tab(tab);
        }

    }
    /**
     *  Description:
     *      removes tab with tab.id = tab_id from the input users bar
     *  
     *  Return Value:
     *      boolean indicating success of removal, false is problematic (TabBar is now empty and needs to be handled)
     *  @param user   username of tab owner
     *  @param tab_id   id of tab to remove
     */
    public removeTab(user: string, tab_id: string): boolean {
        let bar: TabBar = this.get(user);
        if (bar !== null) {
            return bar.remove_tab(tab_id);
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
        let result: number = -1;
        for (let index = 0; index < this.size(); index++) {
            if (this.bars[index].user === user) {
                result = index;
                break;
            }
        }
        if (result > -1) {
            let bar = this.bars.splice(result, 1)[0];
            while (bar.size() > 0) {
                bar.remove_tab(bar.active().id);
            }
        }
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
        this.active_bar = -1;
        // set all other tabs to inactive (hidden)
        for (let index = 0; index < this.size(); index++) {
            let tmpBar = this.bars[index];
            if (tmpBar.user === bar.user) {
                this.active_bar = index;
            }
            for (let bar_index = 0; bar_index < tmpBar.size(); bar_index++) {
                tmpBar.tabs[bar_index].active = false;
                if (tmpBar.tabs[bar_index].id !== bar.active().id) {
                    // setting the size to zero of the active webview causes rendering issue
                    tmpBar.tabs[bar_index].webview.style.width = "0px";
                    tmpBar.tabs[bar_index].webview.style.height = "0px";
                }
            }
        }
        // set tab state of active tab in bar to active
        bar.active().active = true;
        bar.render();
    }
    /**
     *  Description:
     *      returns the active Tab object from the active user's TabBar
     */
    public activeTab(): Tab {
        return this.bars[this.active_bar].active();
    }
    /**
     *  Description:
     *      returns the current active user
     */
    public activeUser(): string {
        return this.bars[this.active_bar].user;
    }
    /**
     * Description:
     *      returns the Tab object associated with the given id
     *  @param tab_id   tab id to search for
     */
    public getTab(tab_id: string): Tab {
        for (let index = 0; index < this.size(); index++) {
            let bar: TabBar = this.bars[index];
            for (let tab_index = 0; tab_index < bar.size(); tab_index++) {
                if (bar.tabs[tab_index].id === tab_id) {
                    return bar.tabs[tab_index];
                }
            }
        }
    return null;
    }
    /**
     *  Description:
     *      handles rendering of the current user's TabBar.
     */
    public render(): void {
        this.bars[this.active_bar].render();
    }

}

let Tabs: TabBarSet = new TabBarSet();
window.onresize = doLayout;
let isLoading: boolean = false;
let ipc: Electron.IpcRenderer = require("electron").ipcRenderer;
onload = () => {

    Tabs.addTab("test", new Tab({
        url: "http://athenanet.athenahealth.com"
    }));
    Tabs.activate("test");
    let reload: HTMLButtonElement = <HTMLButtonElement>document.getElementById("reload"),
        urlBar: HTMLFormElement = <HTMLFormElement>document.getElementById("location-form");

    doLayout();

    urlBar.onsubmit = (): boolean => {
        let address: string = (<HTMLInputElement>document.querySelector("#location")).value;
        Tabs.activeTab().url = address;
        navigateTo(Tabs.activeTab().webview, address);
        return false;
    };

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
        Tabs.addTab(Tabs.activeUser(), new Tab({
            url: "about:blank"
        }));
    };


    ipc.on("openPDF", function (event, filedata) {
        let PDFViewerURL: string = "file://" + __dirname + "/pdfjs/web/viewer.html?url=";
        let PDFurl: string = PDFViewerURL + filedata.url;
        let hasOpenedPDF: boolean = false;
        Tabs.addTab(Tabs.activeUser(), new Tab({
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

function doLayout(): void {
    let webview: Electron.WebViewElement = Tabs.activeTab().webview,
        controls: HTMLDivElement = <HTMLDivElement> document.querySelector("#controls"),
        controlsHeight: number = controls.offsetHeight,
        windowWidth: number = document.documentElement.clientWidth,
        windowHeight: number = document.documentElement.clientHeight,
        webviewWidth: number = windowWidth,
        webviewHeight: number = windowHeight - controlsHeight;

    webview.style.width = webviewWidth + "px";
    webview.style.height = webviewHeight + "px";
}

function handleLoadStart(event: Event): void {
    document.body.classList.add("loading");
    document.getElementById("reload").innerHTML = "&#10005";
    isLoading = true;
}

function handleLoadStop(event: Event): void {
    isLoading = false;
    let address: HTMLInputElement = <HTMLInputElement>document.querySelector("#location");
    let webview: Electron.WebViewElement = <Electron.WebViewElement>event.target;
    let tab = Tabs.getTab(webview.getAttribute("tab_id"));
    tab.url = webview.getAttribute("src");
    tab.title = webview.getTitle();
    address.value = tab.url;
    Tabs.render();
}

/*
function handleLoadCommit(event: Electron.WebViewElement.LoadCommitEvent): void {
    document.getElementById("reload").innerHTML = "&#10227";
    isLoading = false;
}
*/
function handleLoadCommit(event: Electron.WebViewElement.LoadCommitEvent): void {
    document.getElementById("reload").innerHTML = "&#10227";
    let address: HTMLInputElement = <HTMLInputElement>document.querySelector("#location");
    let webview: Electron.WebViewElement = <Electron.WebViewElement>event.target;

    address.value = event.url;
    (<HTMLButtonElement>document.querySelector("#back")).disabled = !webview.canGoBack();
    (<HTMLButtonElement>document.querySelector("#forward")).disabled = !webview.canGoForward();
}

function handleLoadRedirect(event: Electron.WebViewElement.DidGetRedirectRequestEvent): void {
    (<HTMLInputElement>document.getElementById("location")).value = event.newURL;
}

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