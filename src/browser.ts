/// <reference path="../typings/index.d.ts" />

import {Tab, UserTabBar, IDOM} from "./tabs";
import * as rp from "request-promise";
const $: JQueryStatic = require("jquery");
const ipc = require("electron").ipcRenderer;
const {remote} = require("electron");
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
        webview.addEventListener("did-fail-load", handleLoadFail);
        webview.addEventListener("load-commit", handleLoadCommit);
        webview.addEventListener("did-get-redirect-request", handleLoadRedirect);
        webview.src = url;
        webview.setAttribute("tabID", id);
        document.getElementById("webviews").appendChild(webview);
    }

    /**
     * Triggered when all tabs have been closed. Requests that the
     * main process handle it. 
     */
    public allTabsClosed(): void {
        require("electron").ipcRenderer.send("tabs-all-closed");
    }

    /**
     * Creates a new tab element and places it in the tabs div in the document.
     * 
     * @param title   Title of the associated webview's URL to be displayed
     *                on the tab.
     * @param id   ID to be assigned to the new tab element. Corresponds with
     *             the ID stored with the tab object associated with this element.
     * @param url   The URL of the webview this tab element corresponds to.
     * @param tab   The Tab object associated with this new element.
     */
    public createTabElement(title: string, id: string, url: string, tab: Tab): void {
        let self: BrowserDOM = this;
        // url = checkUrlDoesntExist("https://www.google.com/s2/favicons?domain=" + url) ?
        //     "a" : url;
        $("#add-tab")
            .before($("<div>")
                .addClass("ui-state-default tab")
                .attr("id", id)
                .append($("<div>")
                    .addClass("tab-title")
                    .attr("title", title)
                    .html(title))
                .append($("<div>")
                    .addClass("tab-favicon")
                    .append($("<img>")
                        .attr("src", "https://www.google.com/s2/favicons?domain=" + url)))
                .append($("<div>")
                    .addClass("tab-close")
                    .click((event: JQueryMouseEventObject) => {
                        event.stopPropagation();
                        self.closeTabOnClick(tab);
                        return false;
                    }))
                .click(() => {
                    self.changeTabOnClick(tab);
                    return false;
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
        id = id || tabs.getActiveTab().getId();
        return <Electron.WebViewElement>$(`[tabID='${id}']`).get(0);
    }

    /**
     * Queries document for the tab element matching the specified id.
     * If no id provided then get the active tab element.
     */
    public getTabElement(id: string = ""): HTMLDivElement {
        id = id || tabs.getActiveTab().getId();
        return <HTMLDivElement>$(`#${id}`).get(0);
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
        this.getWebview(id).remove();
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
     *      Also removes tab-current as class from tab
     *  
     *  Return Value:
     *      none
     * 
     *  @param id   string ID corresponding to the webview's tabID to hide, if empty hide active webview
     */
    public hideTab(id: string): void {
        id = id || tabs.getActiveTab().getId();
        $(`[tabID='${id}']`).hide();
        $(`#${id}`).removeClass("tab-current");
    }

    /**
     *  Description:
     *      shows webview element from document that matches id = tabID 
     *      If no id provided then show active webview. 
     *      Also adds tab-current as class from tab
     *  
     *  Return Value:
     *      none
     * 
     *  @param id   string ID corresponding to the webview's tabID to show, if empty show active webview
     */
    public showTab(id: string): void {
        id = id || tabs.getActiveTab().getId();
        $(`[tabID='${id}']`).show();
        $(`#${id}`).addClass("tab-current");
    }

    /**
     *  Description:
     *      Given an input active tab id, return id of tab corresponding to the next active tab. 
     * 
     *  @param id   tab id that is active, use to find neighboring tab to return.
     */
    public getNextActiveTabId(id: string): string {
        let tab = $(`#${id}`);
        let next: string = tab.next(".ui-state-default").attr("id")
                         || tab.prev(".ui-state-default").attr("id");
        return next || "";
    }

    /**
     * Updates the title and innerHTML of the tab element when a new page is loaded.
     * 
     * @param id   The ID of the tab element.
     * @param title   The new title to be set. 
     */
    public setTitle(id: string, title: string): void {
        $(`#${id}`).find(".tab-title")
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
        // url = checkUrlDoesntExist("https://www.google.com/s2/favicons?domain=" + url) ?
        //     "a" : url;
        let favicon: string = getFaviconImage(url);

        $(`#${id}`).find(".tab-favicon").find("img")
            .attr("src", favicon);
    }

    /**
     *  Resizes the elements in the window. 
     */
    public doLayout(): void {
        let tabs: JQuery = $(".ui-state-default").not(".ui-sortable-placeholder");
        let tabFav: JQuery = $(".tab-favicon");
        let tabTitle: JQuery = $(".tab-title");
        let controlsHeight: number = $("#controls").outerHeight();
        let tabBarHeight: number = $("#tabs").outerHeight();
        let windowWidth: number = document.documentElement.clientWidth;
        let windowHeight: number = document.documentElement.clientHeight;
        let webviewWidth: number = windowWidth;
        let webviewHeight: number = windowHeight - controlsHeight - tabBarHeight;
        let tabWidth: string =  (95/tabs.length).toString() + "%";

        $("webview").css({
            width: webviewWidth + "px",
            height: webviewHeight + "px"
        });

        // Resize the tabs if there are many or the window is too small
        tabs.css("width", tabWidth);

        if (tabs.get(0).clientWidth <= 60) {
            tabFav.hide();
            tabTitle.hide();
        } else {
            tabFav.show();
            tabTitle.show();
        }
    }
    /**
     * Navigates a tab to a new URL.
     *
     * @param webview   The webview to load the new URL into.
     * @param url   The URL to navigate to.
     * @param isLocalContent   Whether the URL is local isLocalContent to load.
     */
    public navigateTo(webview: Electron.WebViewElement, url: string, isLocalContent?: boolean): void {
        if (!url) {
            url = homepage;
        }

        if (url.indexOf("http") === -1 && !isLocalContent) {
            url = `http://${url}`;
        }
        $("#location").blur();
        webview.loadURL(url);
    }

    /**
     * Actions to happen upon a context switch from Tab to Tab.
     */
    public tabSwitch(): void {
        let active: Electron.WebViewElement = browserDom.getWebview();
        let back: JQuery = $("#back");
        let forward: JQuery = $("#forward");
        let location: JQuery = $("#location");
        let reload: JQuery = $("#reload");

        // Re-evaluate the back/forward navigation buttons based on new active Tab
        (<HTMLButtonElement>back.get(0)).disabled = !active.canGoBack();
        (<HTMLButtonElement>forward.get(0)).disabled = !active.canGoForward();

        if (active.isLoading()) {
            // change icon to X 
            reload.html("&#10005;");
            location.removeClass("location-loaded");
        } else {
            // change icon to 
            reload.html("&#10227;");
            location.addClass("location-loaded");
        }
        location.val(active.getURL());
    }

    public getAthenaTabs(): Tab[] {
        let self: BrowserDOM = this;
        return tabs.getActiveTabBar().getAllTabs()
        .filter(function (tab: Tab) {
            return self.isAthenaUrl(tab.getUrl());
        });
    }

    public handleUserLock(): boolean {
        if (tabs.getActiveTabBar().getLockedStatus()) {
            let athenaTabs: Tab[] = this.getAthenaTabs();
            if (athenaTabs.length) {
                tabs.getActiveTabBar().hideTabs();
                tabs.getUserTabBar().activateTab(athenaTabs[0]);
                this.tabSwitch();
                this.doLayout();
                return true;
            }
        }
        return false;
    }

    public lockActiveUser(): void {
        tabs.getActiveTabBar().setLockedStatus(true);
        $("#add-tab").hide();
    }

    public unlockActiveUser(): void {
        tabs.getActiveTabBar().setLockedStatus(false);
        $("#add-tab").show();
    }

    private isAthenaUrl(url: string): boolean {
        // let re: RegExp = new RegExp("^https://(?:[\w-]+\.)+athenahealth\.com(?::\d+)?");
        // return re.test(url);
        return url.match(/^https:\/\/(?:[\w-]+\.)+athenahealth\.com(?::\d+)?/) !== null;
    }

    private closeTabOnClick(tab: Tab): void {
        if (!this.handleUserLock()) {
            tabs.removeTab(tab.getId());
            this.tabSwitch();
            this.doLayout();
            ipc.send("update-num-tabs", tabs.getActiveTabBar().size());
        }
    }

    private changeTabOnClick(tab: Tab): void {
        if (!tab.getActiveStatus() && !this.handleUserLock()) {
            tabs.getActiveTabBar().hideTabs();
            tabs.getUserTabBar().activateTab(tab);
            this.tabSwitch();
            this.doLayout();
        }
    }
}

const browserDom: BrowserDOM = new BrowserDOM();
const tabs: UserTabBar = new UserTabBar(browserDom);
let homepage = "https://athenanet.athenahealth.com";
let backgroundWindow: Electron.BrowserWindow = null;

window.onresize = browserDom.doLayout;
window.onload = () => {
    tabs.addUser("test");
    tabs.addTab(new Tab(browserDom, {
        url: homepage
    }), "test");
    tabs.activateUser("test");

    $("#location-form").on("submit", (): boolean => {
        let address: string = $("#location").val();
        tabs.getActiveTab().setUrl(address);
        browserDom.navigateTo(browserDom.getWebview(), address);
        return false;
    });

    browserDom.doLayout();

    $("#location").on("focus", (event: JQueryMouseEventObject): void => {
        $(event.target).select();
    });

    // Navigation button controls
    $("#back").on("click", (): void => {
        browserDom.getWebview().goBack();
    });

    $("#forward").on("click", (): void => {
        browserDom.getWebview().goForward();
    });

    $("#home").on("click", (): void => {
        browserDom.navigateTo(browserDom.getWebview(), homepage);
    });

    $("#add-tab").on("click", (): void => {
        let tab: Tab = new Tab(browserDom, {
            url: homepage
        });
        tabs.addTab(tab);
        tabs.getActiveTabBar().hideTabs();
        tabs.getUserTabBar().activateTab(tab);
        browserDom.doLayout();
        ipc.send("update-num-tabs", tabs.getActiveTabBar().size());
    });

    ipc.on("openPDF", function (event, filedata) {
        let PDFViewerURL: string = "file://" + __dirname + "/pdfjs/web/viewer.html?url=";
        let PDFurl: string = PDFViewerURL + filedata.url;
        tabs.addTab(new Tab(browserDom, {
                url: PDFurl
        }));
    });

    ipc.on("enter-full-screen", function() {
        $("#controls").addClass("fullscreen");
    });

    ipc.on("leave-full-screen", function() {
        $("#controls").removeClass("fullscreen");
    });

    // use getAthenaTabs
    // use the URL as domain
    // node's url module to get host domain
    remote.ipcMain.on("check-current-timeout", (): void => {
        (<Electron.WebViewElement>($("#webviews").find("[src*='athena']")[0]))
            .getWebContents().session.cookies.get({
                    domain: "prodmirror.athenahealth.com",
                    name: "TIMEOUT_UNENCRYPTED"
                }, (error: Error, cookies: Electron.Cookie[]): void => {
                    if (!cookies || cookies.length < 2) {
                        return;
                    }

                    // Athenanet times out when the cookie's value is <= 0 so we lock the user
                    if (parseInt(cookies[1].value, 10) <= 0) {
                        if (!tabs.getActiveTabBar().getLockedStatus()) {
                            browserDom.lockActiveUser();
                        }
                    } else { // If the user has logged back in the cookie resets, unlock user
                        if (tabs.getActiveTabBar().getLockedStatus()) {
                            browserDom.unlockActiveUser();
                        }
                    }
                });
    });

    $("#reload").on("click", (): void => {
        if (browserDom.getWebview().isLoading()) {
            browserDom.getWebview().stop();
        } else {
            browserDom.getWebview().reload();
        }
    });

    $(function() {
        $("#tabs").sortable({
            revert: true,
            axis: "x",
            scroll: false,
            forcePlaceholderSize: true,
            items: ".ui-state-default",
            tolerance: "pointer"
        })
        .on("sortactivate", function(event: Event, ui: any) {
            ui.placeholder.css("width", ui.item.css("width"));
            $("#add-tab").hide();
        })
        .on("sortstop", function() {
            if (!tabs.getActiveTabBar().getLockedStatus()) {
                $("#add-tab").show();
            }
        });
    });

    createBackgroundWindow();
};

/**
 * Function to be called when a webview starts loading a new URL.
 *
 * @param event   The event triggered.
 */
function handleLoadStart(event: Event): void {
    let webview: Electron.WebViewElement = <Electron.WebViewElement>event.target;
    if (tabs.getActiveTab().getId() === webview.getAttribute("tabID")) {
        document.body.classList.add("loading");
        document.getElementById("reload").innerHTML = "&#10005;";
        $("#location").removeClass("location-loaded");
    }
}

/**
 * Function to be called when a webview stops loading a new URL.
 *
 * @param event   The event triggered.
 */
function handleLoadStop(event: Event): void {
    let webview: Electron.WebViewElement = <Electron.WebViewElement>event.target;
    let tab: Tab = tabs.getTab(webview.getAttribute("tabID"));
    tab.setUrl(webview.getAttribute("src"));
    tab.setTitle(webview.getTitle());
    if (tabs.getActiveTab().getId() === tab.getId()) {
        $("#location").val(tab.getUrl());
    }
    $("#reload").html("&#10227;");
    browserDom.tabSwitch();
}

/**
 * Function to be called when a webview has committed to loading a URL.
 *
 * @param event   The event triggered.
 */
function handleLoadCommit(event: Electron.WebViewElement.LoadCommitEvent): void {
    let webview: Electron.WebViewElement = <Electron.WebViewElement>event.target;
    if (tabs.getTab(webview.getAttribute("tabID")).getActiveStatus()) {
        // let address: HTMLInputElement = <HTMLInputElement>document.querySelector("#location");
        // address.value = event.url;
        (<HTMLButtonElement>$("#back").get(0)).disabled = !webview.canGoBack();
        (<HTMLButtonElement>$("#forward").get(0)).disabled = !webview.canGoForward();
    }
}

/**
 * Function to be called when a webview redirects.
 *
 * @param event   The event triggered.
 */
function handleLoadRedirect(event: Electron.WebViewElement.DidGetRedirectRequestEvent): void {
    if (tabs.getActiveTab().getId() === (<Electron.WebViewElement>event.target).getAttribute("tabID")) {
        (<HTMLInputElement>document.getElementById("location")).value = event.newURL;
    }
}

/**
 * Function to be called when a webview fails loading a URL. Loads an error page instead.
 *
 * @param event   The event triggered.
 */
function handleLoadFail(event: Electron.WebViewElement.DidFailLoadEvent): void {
    if (event.errorCode !== -3 && event.errorCode !== -300) {
        browserDom.navigateTo(<Electron.WebViewElement>event.target, "file://" + __dirname + "/error.html", true);
    }
}

/**
 * Function to create a hidden, window. Runs background
 * processes.
 */
function createBackgroundWindow(): void {
    backgroundWindow = new remote.BrowserWindow({show: false});
    backgroundWindow.loadURL(`file://${__dirname}/athenanet-timeout/timeout.html`);
}

/**
 * Checks if the given url exists (returns an error or not)
 * 
 * @param url   The url to check.
 * @returns Whether the url returns a 400 error code.
 */
// function checkUrlDoesntExist(url: string): boolean {
//     let requestResponse: number = 0;

//     if (url.includes("file://")) {
//         return true;
//     }

//     rp({
//         method: "GET",
//         uri: url,
//         resolveWithFullResponse: true
//     })
//         .catch(function(error: any) {
//             requestResponse = error.statusCode;
//             while (requestResponse === 0) {
//                 ;
//             }
//         });
//     console.log(requestResponse);

//     return requestResponse === 400;
// }

/**
 * Gets the favicon from Google's API.
 * @param domain   The domain the favicon belongs to.
 * @returns The base64 encoding of the image.
 */
function getFaviconImage(domain: string): string {
    let encodedImage: string;
    const options: rp.OptionsWithUri = {
        method: "GET",
        uri: "http://www.google.com/s2/favicons?domain=" + domain,
        resolveWithFullResponse: true
    };

    rp(options)
        .then((response: any) => {
            let imageBase64: string = new Buffer(response.body).toString("base64");
            let type: string = response.headers["content-type"];
            let prefix: string = "data:" + type + ";base64";
            encodedImage = prefix + imageBase64;
        })
        .catch((error: any) => {
            encodedImage = "#";
        });
    return encodedImage;
}