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
        this.render();
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
            tabTitle.className = "chrome-tab-title";
            tabClose.className = "chrome-tab-close";
            tabClose.onclick = () => {
                Tabs.remove_tab(tabDiv.id);
                Tabs.render();
            };

            // Make the button title the name of the website not URL 

            // tabDiv.title = tabDiv.innerHTML = tab.title;

            tabDiv.appendChild(tabFavicon); tabDiv.appendChild(tabTitle); tabDiv.appendChild(tabClose);
            // xButton.innerHTML = "&#215";
            // xButton.onclick = () => { Tabs.remove_tab(tabDiv.id); };
            // tabDiv.appendChild(xButton);
            let click = function () {
                Tabs.activate(tab);
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


let Tabs: TabBar = new TabBar();

window.onresize = doLayout;
let isLoading: boolean = false;
let ipc: Electron.IpcRenderer = require("electron").ipcRenderer;
onload = () => {

    Tabs.add_tab(new Tab({
        url: "http://athenanet.athenahealth.com"
    }));

    let reload: HTMLButtonElement = <HTMLButtonElement>document.getElementById("reload"),
        urlBar: HTMLFormElement = <HTMLFormElement>document.getElementById("location-form");

    doLayout();

    urlBar.onsubmit = (): boolean => {
        let address: string = (<HTMLInputElement>document.querySelector("#location")).value;
        Tabs.active().url = address;
        navigateTo(Tabs.active().webview, address);
        return false;
    };

    document.getElementById("back").onclick = function () {
        Tabs.active().webview.goBack();
    };

    document.getElementById("forward").onclick = function () {
        Tabs.active().webview.goForward();
    };

    document.getElementById("home").onclick = function () {
        navigateTo(Tabs.active().webview, "http://athenanet.athenahealth.com/");
    };

    document.getElementById("add-tab").onclick = function () {
        Tabs.add_tab(new Tab({
            url: "about:blank"
        }));
    };


    ipc.on("openPDF", function (event, filedata) {
        debugger;
        let PDFViewerURL: string = "file://" + __dirname + "/pdfjs/web/viewer.html?url=";
        let PDFurl: string = PDFViewerURL + filedata.url;
        let hasOpenedPDF: boolean = false;

        Tabs.tabs.forEach(function (tab) {
            if (tab.url === filedata.url) {
                navigateTo(tab.webview, PDFurl);
                hasOpenedPDF = true;
            }
        });
        // open in new tab
        if (!hasOpenedPDF) {
            Tabs.add_tab(new Tab({
                url: PDFurl
            }));
        }
    });

    reload.onclick = function () {
        if (isLoading) {
            Tabs.active().webview.stop();
        } else {
            Tabs.active().webview.reload();
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
    let webview: Electron.WebViewElement = Tabs.active().webview,
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
    let webview: Electron.WebViewElement = Tabs.active().webview;
    let tab = Tabs.get(webview.getAttribute("tab_id"));
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
    console.log(event.srcElement);
    let address: HTMLInputElement = <HTMLInputElement>document.querySelector("#location");
    let webview: Electron.WebViewElement = Tabs.active().webview;

    address.value = event.url;
    (<HTMLButtonElement>document.querySelector("#back")).disabled = !webview.canGoBack();
    (<HTMLButtonElement>document.querySelector("#forward")).disabled = !webview.canGoForward();
}

function handleLoadRedirect(event: Electron.WebViewElement.DidGetRedirectRequestEvent): void {
    (<HTMLInputElement>document.getElementById("location")).value = event.newURL;
}

function handleFailLoad(event: Electron.WebViewElement.DidFailLoadEvent): void {
    if (event.errorCode !== -3) {
        navigateTo(Tabs.active().webview, "file://" + __dirname + "/error.html", true);
    }
}

/**

 * Actions to happen upon a context switch from Tab to Tab.

 */

function tabSwitch(): void {
    let active: Electron.WebViewElement = Tabs.active().webview;

    // Re-evaluate the back/forward navigation buttons based on new active Tab
    (<HTMLButtonElement>document.querySelector("#back")).disabled = !active.canGoBack();
    (<HTMLButtonElement>document.querySelector("#forward")).disabled = !active.canGoForward();

    document.getElementById("back").onclick = function () {
        active.goBack();
    };

    document.getElementById("forward").onclick = function () {
        active.goForward();
    };

    (<HTMLInputElement>document.getElementById("location")).value = Tabs.active().webview.getURL();
}