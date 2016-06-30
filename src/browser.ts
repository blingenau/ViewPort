/// <reference path="Definitions/github-electron.d.ts" />
/// <reference path="Definitions/node.d.ts" />
/// <reference path="Definitions/jquery/index.d.ts" />
/// <reference path="Definitions/jqueryui/jqueryui.d.ts" />

import {Tab, TabBar, UserTabBar, IDOM} from "./tabs";
const $ = require("jquery");
require("jquery-ui");

/**
 * class DOM 
 * 
 *  Description:
 *      Used to interface with the document and handles various global calls for tab management
 */
class BrowserDOM implements IDOM {
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
        let webview: Electron.WebViewElement = document.createElement("webview");
        webview.addEventListener("did-start-loading", handleLoadStart);
        webview.addEventListener("did-stop-loading", handleLoadStop);
        webview.addEventListener("did-fail-load", handleFailLoad);
        webview.addEventListener("load-commit", handleLoadCommit);
        webview.addEventListener("did-get-redirect-request", handleLoadRedirect);
        webview.style.display = "flex"; // should be in CSS
        // webview.style.width = "640px";
        // webview.style.height = "480px";
        webview.src = url;
        webview.setAttribute("tabID", id);
        document.getElementById("webviews").appendChild(webview);
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
        id = id || Tabs.tabId().getId();
        return <Electron.WebViewElement>document.querySelector("[tabID='"+id+"']");
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
        document.getElementById("webviews").removeChild(this.getWebview(id));
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
    // class with 0 height and width, ie inactive 
    public hideWebview(id: string): void {
        let webview: Electron.WebViewElement = this.getWebview(id);
        webview.style.width = "0px";
        webview.style.height = "0px";
    }

    // write description
    public updateTab(tab: Tab): void { // full name
        let tabElt: HTMLElement = document.getElementById(tab.getId());
        // update favicon
        let tabFavicon: NodeListOf<Element> = tabElt.getElementsByClassName("chrome-tab-favicon");
        let tabFav = "http://www.google.com/s2/favicons?domain=" + tab.getURL();
        tabFavicon[0].innerHTML = "<img src = " + tabFav + ">"; // create new img using jQuery and append 
        // update tab title
        let tabTitle: Element = tabElt.getElementsByClassName("chrome-tab-title")[0]; // fix this to put on one line
        tabTitle.innerHTML = tab.getTitle();
    }
    // Delete fcn below?
    /**
     *  Description:
     *      Queries document for the ordered list of current tabs 
     * 
     *  Return Value:
     *      List of Tab objects in the order that they are displayed on screen
     */
    public getAllTabs(): Tab[] {
        return Array.prototype.slice.call(document.getElementById("tabs")
        .childNodes).map(function (arg: HTMLElement) {
            return Tabs.getTab(arg.id);
        }).filter(function (arg: Tab) {
            return arg !== null;
        });
    }
    // .next and selector for tab class 
    /**
     *  Description:
     *      Given an input active tab id, return id of tab corresponding to the next active tab. 
     * 
     *  @param id   tab id that is active, use to fight neighboring tab to return.
     */
    public getNexttabIdID(id: string): string {
        let tab: HTMLElement = document.getElementById(id);
        let next: Element = tab.nextElementSibling || tab.previousElementSibling;
        if (next === null) {
            return "";
        }
        return next.id;
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
        let tabs: HTMLElement = document.getElementById("tabs");
        let allTabs: NodeListOf<Element> = document.getElementsByClassName("ui-state-default");
        // Loop through all of the front end and delete element if not found in back end
        for (let index = 0; index < allTabs.length; index++) {
            if (bar.getTab(allTabs[index].id) === null) {
                let element = allTabs[index];
                element.parentNode.removeChild(element);
            }
        }
        let tabIDs: string[] = Object.keys(bar.getTabs());
        // Loop through all of the back end and add a new element to the front end if not found in front end
        for (let index = 0; index < bar.size(); index++) {
            let elt = bar.getTab(tabIDs[index]); // use full names

            // elt in tab bar but not the document, create new element
            if (document.getElementById(elt.getId()) === null) {
                let tabDiv: HTMLDivElement = document.createElement("div");
                let tabTitle: HTMLDivElement = document.createElement("div");
                let tabFavicon: HTMLDivElement = document.createElement("div");
                let tabClose: HTMLDivElement = document.createElement("div");
                let tab: Tab = elt;
                let tabFav = "http://www.google.com/s2/favicons?domain=" + tab.getURL();

                tabDiv.className = "ui-state-default";
                tabDiv.id = tab.getId();

                // Make the title the name of the website not URL 
                tabTitle.title = tabTitle.innerHTML = tab.getTitle();

                tabFavicon.innerHTML = "<img src = " + tabFav + ">"; // put quotes in
                tabTitle.className = "chrome-tab-title"; // change name, also in css
                tabClose.className = "chrome-tab-close"; // change name, also in css
                tabFavicon.className = "chrome-tab-favicon"; // // change name, also in css
                // changes needed here 
                tabClose.onclick = () => {
                    if (!Tabs.removeTab(Tabs.activeUser, tabDiv.id)) {
                        // if there are no more tabs close application. Temporary
                        require("electron").remote.app.quit();
                    }
                    Doc.render(bar);
                    ipc.send("update-num-tabs", Tabs.activeBar().size());
                };

                tabDiv.appendChild(tabFavicon); tabDiv.appendChild(tabTitle); tabDiv.appendChild(tabClose);
                // change back 
                let click = function () {
                    Tabs.activeBar().hideTabs();
                    Tabs.bars[Tabs.activeUser].activateTab(tab);
                    tabSwitch();
                    doLayout();
                };
                tabDiv.onclick = () => { click(); };
                tabs.appendChild(tabDiv);
                if (!tab.getActiveStatus()) {
                    tab.hide();
                }
                // moved 
                $(function() {
                    $("#tabs").sortable({
                        revert:true,
                        axis: "x"
                    });
                });
            } // if
            if (!elt.getActiveStatus()) {
                    elt.hide();
                    let tabInact =  document.getElementById(elt.getId());
                    tabInact.className = "ui-state-default";
                }
            if (elt.getActiveStatus()) {
                let tabAct: HTMLElement = document.getElementById(elt.getId());
                tabAct.className = "ui-state-default active"; // add and remove class 
                this.updateTab(elt);
            }
        } // for
        doLayout();
    } // render fcn
}

let Doc: BrowserDOM = new BrowserDOM();
let Tabs: UserTabBar = new UserTabBar(Doc);
window.onresize = doLayout;
let isLoading: boolean = false;
const ipc = require("electron").ipcRenderer;
const homepage = "https://athenanet.athenahealth.com";

onload = () => {
    Tabs.addTab("test", new Tab(Doc, {
        url: homepage
    }));
    Tabs.activateUser("test");
    let reload: HTMLButtonElement = <HTMLButtonElement>document.getElementById("reload");
    let urlBar: HTMLFormElement = <HTMLFormElement>document.getElementById("location-form");
    let addressBar: HTMLInputElement = <HTMLInputElement>document.getElementById("location");

    urlBar.onsubmit = (): boolean => {
        let address: string = (<HTMLInputElement>document.querySelector("#location")).value;
        Tabs.tabId().setUrl(address);
        navigateTo(Doc.getWebview(), address);
        return false;
    };

    doLayout();

    addressBar.onfocus = (): void => {
        addressBar.select();
    };

    // Navigation button controls
    document.getElementById("back").onclick = function () {
        Doc.getWebview().goBack();
    };

    document.getElementById("forward").onclick = function () {
        Doc.getWebview().goForward();
    };

    document.getElementById("home").onclick = function () {
        navigateTo(Doc.getWebview(), homepage);
    };

    document.getElementById("add-tab").onclick = function () {
        Tabs.addTab(Tabs.activeUser, new Tab(Doc, {
            url: "about:blank"
        }));
        ipc.send("update-num-tabs", Tabs.activeBar().size());
    };

    ipc.on("openPDF", function (event, filedata) {
        let PDFViewerURL: string = "file://" + __dirname + "/pdfjs/web/viewer.html?url=";
        let PDFurl: string = PDFViewerURL + filedata.url;
        Tabs.addTab(Tabs.activeUser, new Tab(Doc, {
                url: PDFurl
        }));
    });

    reload.onclick = function () {
        if (isLoading) {
            Doc.getWebview().stop();
        } else {
            Doc.getWebview().reload();
        }
    };
};

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
        url = homepage;
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
    let webview: Electron.WebViewElement = Doc.getWebview();
    let controls: HTMLDivElement = <HTMLDivElement>document.querySelector("#controls");
    let tabBar: HTMLDivElement = <HTMLDivElement>document.querySelector("#tabs");
    let tabs: NodeListOf<Element> = document.querySelectorAll(".ui-state-default");
    let tabFav: NodeListOf<Element> = document.querySelectorAll(".chrome-tab-favicon");
    let tabTitle: NodeListOf<Element> = document.querySelectorAll(".chrome-tab-title");
    let controlsHeight: number = controls.offsetHeight;
    let tabBarHeight: number = tabBar.offsetHeight;
    let windowWidth: number = document.documentElement.clientWidth;
    let windowHeight: number = document.documentElement.clientHeight;
    let webviewWidth: number = windowWidth;
    let webviewHeight: number = windowHeight - controlsHeight - tabBarHeight;
    let tabWidth: string = tabs.length <= 6 ? "15%" : (100/tabs.length).toString() + "%";

    webview.style.width = webviewWidth + "px";
    webview.style.height = webviewHeight + "px";

    // Resize the tabs if there are many or the window is too small
    for (let i = 0; i < tabs.length; i++) {
        (<HTMLDivElement>tabs[i]).style.width = tabWidth;
        if (tabs[i].clientWidth <= 60) {
            (<HTMLDivElement>tabFav[i]).hidden = (<HTMLDivElement>tabTitle[i]).hidden = true;
        } else {
            (<HTMLDivElement>tabFav[i]).hidden = (<HTMLDivElement>tabTitle[i]).hidden = false;
        }
    }
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
    tab.setUrl(webview.getAttribute("src"));
    tab.setTitle(webview.getTitle());
    address.value = tab.getURL();
    Doc.render(Tabs.activeBar());
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
    let active: Electron.WebViewElement = Doc.getWebview();

    // Re-evaluate the back/forward navigation buttons based on new active Tab
    (<HTMLButtonElement>document.querySelector("#back")).disabled = !active.canGoBack();
    (<HTMLButtonElement>document.querySelector("#forward")).disabled = !active.canGoForward();

    document.getElementById("back").onclick = function () {
        active.goBack();
    };

    document.getElementById("forward").onclick = function () {
        active.goForward();
    };

    (<HTMLInputElement>document.getElementById("location")).value = active.getURL();
}