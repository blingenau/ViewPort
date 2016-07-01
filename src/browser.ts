/// <reference path="Definitions/github-electron.d.ts" />
/// <reference path="Definitions/node.d.ts" />
/// <reference path="Definitions/jquery/index.d.ts" />
/// <reference path="Definitions/jqueryui/jqueryui.d.ts" />

import {Tab, UserTabBar, IDOM} from "./tabs";
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
        webview.style.display = "flex";
        webview.style.width = "640px";
        webview.style.height = "480px";
        webview.src = url;
        webview.setAttribute("tabID", id);
        document.getElementById("webviews").appendChild(webview);
    }

    public allTabsClosed(): void {
        require("electron").ipcRenderer.send("tabs-all-closed");
    }
    /**
     * Creates a new tab element and places it in the Tabs div in the document.
     * 
     * @param title   Title of the associated webview's URL to be displayed
     *                on the tab.
     * @param id   ID to be assigned to the new tab element. Corresponds with
     *             the ID stored with the tab object associated with this element.
     * @param url   The URL of the webview this tab element corresponds to.
     * @param tab   The Tab object associated with this new element.
     */
    public createTabElement(title: string, id: string, url: string, tab: Tab): void {
        $("#tabs")
            .append($("<div>")
                .addClass("ui-state-default")
                .attr("id", id)
                .append($("<div>")
                    .addClass("chrome-tab-title")
                    .attr("title", title)
                    .html(title))
                .append($("<div>")
                    .addClass("chrome-tab-favicon")
                    .append($("<img>")
                        .attr("src", "https://www.google.com/s2/favicons?domain=" + url)))
                .append($("<div>")
                    .addClass("chrome-tab-close")
                    .click(() => {
                        Tabs.removeTab(id);
                        tabSwitch();
                        doLayout();
                        ipc.send("update-num-tabs", Tabs.activeBar().size());
                    }))
                .mousedown((event: JQueryMouseEventObject) => {
                    if (event.which === 1) {
                        Tabs.activeBar().hideTabs();
                        Tabs.getUserTabBar().activateTab(tab);
                        tabSwitch();
                        doLayout();
                    }
                })
            );
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
        id = id || Tabs.getActiveTab().getId();
        return <Electron.WebViewElement>document.querySelector("[tabID='"+id+"']");
    }

    /**
     * Queries document for the tab element matching the specified id.
     * If no id provided then get the active tab element.
     */
    public getTabElement(id: string = ""): HTMLDivElement {
        id = id || Tabs.getActiveTab().getId();
        return <HTMLDivElement>document.querySelector(`#${id}`);
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
     * Removes tab element from the document.
     * 
     * @param id   ID of the tab element to be removed.
     */
    public removeTabElement(id: string): void {
        $(`#${id}`).remove();
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
        let webview: Electron.WebViewElement = this.getWebview(id);
        webview.style.width = "0px";
        webview.style.height = "0px";
    }

    public updateTab(tab: Tab): void {
        let tabElt: HTMLElement = document.getElementById(tab.getId());
        // update favicon
        let tabFavicon: NodeListOf<Element> = tabElt.getElementsByClassName("chrome-tab-favicon");
        let tabFav = "http://www.google.com/s2/favicons?domain=" + tab.getUrl();
        tabFavicon[0].innerHTML = "<img src = " + tabFav + ">";
        // update tab title
        let tabTitle: NodeListOf<Element> = tabElt.getElementsByClassName("chrome-tab-title");
        tabTitle[0].innerHTML = tab.getTitle();
    }
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
    /**
     *  Description:
     *      Given an input active tab id, return id of tab corresponding to the next active tab. 
     * 
     *  @param id   tab id that is active, use to fight neighboring tab to return.
     */
    public getNextActiveTabId(id: string): string {
        let tab: HTMLElement = document.getElementById(id);
        let next: Element = tab.nextElementSibling || tab.previousElementSibling;
        if (next === null) {
            return "";
        }
        return next.id;
    }

    /**
     * Updates the title and innerHTML of the tab element when a new page is loaded.
     * 
     * @param id   The ID of the tab element.
     * @param title   The new title to be set. 
     */
    public setTitle(id: string, title: string): void {
        $(`#${id} > .chrome-tab-title`)
            .attr("title", title)
            .html(title);
    }

    /**
     * Updates the favicon of the tab element when a new URL is set.
     * 
     * @param id   The ID of the tab element that contains the favicon to change.
     * @param url   The domain where the favicon is found.
     */
    public setTabFavicon(id: string, url: string): void {
        $(`#${id} > .chrome-tab-favicon > img`)
            .attr("src", "https://www.google.com/s2/favicons?domain=" + url);
    }
}

let Doc: BrowserDOM = new BrowserDOM();
let Tabs: UserTabBar = new UserTabBar(Doc);
window.onresize = doLayout;
let isLoading: boolean = false;
const ipc = require("electron").ipcRenderer;
const homepage = "https://athenanet.athenahealth.com";

onload = () => {
    Tabs.addUser("test");
    Tabs.addTab(new Tab(Doc, {
        url: homepage
    }), "test");
    Tabs.activateUser("test");
    let reload: HTMLButtonElement = <HTMLButtonElement>document.getElementById("reload");
    let urlBar: HTMLFormElement = <HTMLFormElement>document.getElementById("location-form");
    let addressBar: HTMLInputElement = <HTMLInputElement>document.getElementById("location");

    urlBar.onsubmit = (): boolean => {
        let address: string = (<HTMLInputElement>document.querySelector("#location")).value;
        Tabs.getActiveTab().setUrl(address);
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
        let tab: Tab = new Tab(Doc, {
            url: "about:blank"
        });
        Tabs.addTab(tab);
        Tabs.activeBar().hideTabs();
        Tabs.getUserTabBar().activateTab(tab);
        doLayout();
        ipc.send("update-num-tabs", Tabs.activeBar().size());
    };

    ipc.on("openPDF", function (event, filedata) {
        let PDFViewerURL: string = "file://" + __dirname + "/pdfjs/web/viewer.html?url=";
        let PDFurl: string = PDFViewerURL + filedata.url;
        Tabs.addTab(new Tab(Doc, {
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

    $(function() {
        $("#tabs").sortable({
            revert:true,
            axis: "x",
            scroll: false,
            forcePlaceholderSize: true,
        });
        $( "#tabs" ).on( "sortactivate", function( event : Event, ui : any) {
            ui.placeholder[0].style.width = ui.item[0].style.width;
            ui.item[0].top = ui.originalPosition.top;
            console.log(ui);
        });
    });
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
    let webview: Electron.WebViewElement = <Electron.WebViewElement>event.target;
    if (Tabs.getActiveTab().getId() === webview.getAttribute("tabID")) {
        document.body.classList.add("loading");
        document.getElementById("reload").innerHTML = "&#10005;";
        isLoading = true;
    }
}

/**
 * Function to be called when a webview stops loading a new URL.
 *
 * @param event   The event triggered.
 */
function handleLoadStop(event: Event): void {
    let address: HTMLInputElement = <HTMLInputElement>document.querySelector("#location");
    let webview: Electron.WebViewElement = <Electron.WebViewElement>event.target;
    let tab: Tab = Tabs.getTab(webview.getAttribute("tabID"));
    tab.setUrl(webview.getAttribute("src"));
    tab.setTitle(webview.getTitle());
    if (Tabs.getActiveTab().getId() === tab.getId()) {
        isLoading = false;
        address.value = tab.getUrl();
    }
    tabSwitch();
}

/**
 * Function to be called when a webview has committed to loading a URL.
 *
 * @param event   The event triggered.
 */
function handleLoadCommit(event: Electron.WebViewElement.LoadCommitEvent): void {
    let webview: Electron.WebViewElement = <Electron.WebViewElement>event.target;
    if (Tabs.getTab(webview.getAttribute("tabID")).getActiveStatus()) {
        document.getElementById("reload").innerHTML = "&#10227;";
        // let address: HTMLInputElement = <HTMLInputElement>document.querySelector("#location");
        // address.value = event.url;
        (<HTMLButtonElement>document.querySelector("#back")).disabled = !webview.canGoBack();
        (<HTMLButtonElement>document.querySelector("#forward")).disabled = !webview.canGoForward();
    }
}

/**
 * Function to be called when a webview redirects.
 *
 * @param event   The event triggered.
 */
function handleLoadRedirect(event: Electron.WebViewElement.DidGetRedirectRequestEvent): void {
    if (Tabs.getActiveTab().getId() === (<Electron.WebViewElement>event.target).getAttribute("tabID")) {
        (<HTMLInputElement>document.getElementById("location")).value = event.newURL;
    }
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
    isLoading = active.isLoading();
    if (isLoading) {
        document.getElementById("reload").innerHTML = "&#10005;";
    } else {
        document.getElementById("reload").innerHTML = "&#10227;";
    }

    document.getElementById("back").onclick = function () {
        active.goBack();
    };

    document.getElementById("forward").onclick = function () {
        active.goForward();
    };

    (<HTMLInputElement>document.getElementById("location")).value = active.getURL();
}