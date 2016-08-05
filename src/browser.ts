/// <reference path="../typings/index.d.ts" />

import {Tab, UserTabBar, IDOM} from "./tabs";
import * as requestPromise from "request-promise";
import {PreferenceFile} from "./preference-file";
import {ipcRenderer, remote} from "electron";
import * as nodeUrl from "url";
const $: JQueryStatic = require("jquery");
const Stopwatch = require("timer-stopwatch");
require("jquery-ui");
require("jquery-ui/ui/data");
require("jquery-ui/ui/scroll-parent");
require("jquery-ui/ui/version");
require("jquery-ui/ui/widgets/mouse");
require("jquery-ui/ui/widgets/sortable");

const blankFaviconUri: string =
    "data:image/x-icon;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQEAYAAABPYyMiAAA" +
    "ABmJLR0T///////8JWPfcAAAACXBIWXMAAABIAAAASABGyWs+AAAAF0lEQVRIx2NgGAWjYBS" +
    "MglEwCkbBSAcACBAAAeaR9cIAAAAASUVORK5CYII=";
const athenaNetHomepage: string = "https://athenanet.athenahealth.com";
let almostDoneFired: boolean = false;
let previousTimeout: number = -1;
let clickIsValid = true;

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
        // webview.addEventListener("will-navigate", handleWillNavigate);
        // webview.addEventListener("did-get-redirect-request", handleLoadRedirect);
        webview.addEventListener("new-window", (event) => {
            browserDom.addTab(event.url);
        });
        webview.src = url;
        webview.setAttribute("tabID", id);
        webview.setAttribute("useragent", "Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 " +
            "(KHTML, like Gecko) Chrome/41.0.2228.0 Safari/537.36");
        document.getElementById("webviews").appendChild(webview);

        // If going to the settings page must use preload to set up IPC 
        // in order to interact with the webview
        if(url === "file://" + __dirname + "/settings.html") {
            webview.preload = "file://" + __dirname + "/settings.js";
            webview.nodeintegration = "on";
        }
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
        $("#tabs")
            .append($("<div>")
                .addClass("ui-state-default tab")
                .attr("id", id)
                .append($("<div>")
                    .addClass("tab-title")
                    .attr("title", title)
                    .html(title))
                .append($("<div>")
                    .addClass("tab-favicon")
                    .append($("<img>")
                        .attr("src", blankFaviconUri)))
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
     * Sets the address bar form value.
     * 
     * @param url   The new url being set as the address bar's value.
     */
    public setAddress(url: string): void {
        if (url.includes("file://")) {
            url = url.split("/").slice(-1)[0];
        }

        $("#location").val(url);
        $("#location").attr("value", url);
    }

    /**
     * Adds a tab
     * 
     * @param url   The url of the new tab
     */
    public addTab(url: string): void {
        let tab: Tab = new Tab(browserDom, {
            url: url
        });
        tabs.addTab(tab);
        tabs.getActiveTabBar().hideTabs();
        tabs.getUserTabBar().activateTab(tab);
        browserDom.doLayout();
        ipcRenderer.send("update-num-tabs", tabs.getActiveTabBar().size());
    }

    /**
     * Updates the favicon of the tab element when a new URL is set.
     * 
     * @param id   The ID of the tab element that contains the favicon to change.
     * @param url   The domain where the favicon is found.
     */
    public setTabFavicon(id: string, url: string): void {
        getFaviconImage(url).then(favicon => {
            $(`#${id}`).find(".tab-favicon").find("img")
            .attr("src", favicon);
        });
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
        let tabWidth: string =  (100/tabs.length).toString() + "%";
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
        // tabs.getActiveTab().back.push(webview.getAttribute("src"));
        // console.log(webview.getWebContents().getURL());
        tabs.getActiveTab().forward = [];
        // console.log(webview.getAttribute("src"));
        $("#location").blur();
        url = this.parseUrl(url);
        // dont allow navigation away from last athena tab
        // potentially add warning here describing this fact
        let athenaTabs: Tab[] = this.getAthenaTabs();
        if (athenaTabs.length === 1 &&
            tabs.getActiveTab() === athenaTabs[0] &&
            !this.isAthenaUrl(url)) {
            let options: any = {
                type: "info",
                message: "You must always have one tab with athenanet open.",
                buttons: ["OK"]
            };
            remote.dialog.showMessageBox(options);
        } else {
            tabs.getActiveTab().setUrl(url);
            webview.loadURL(url);
        }
    }

    /**
     * Actions to happen upon a context switch from Tab to Tab.
     */
    public tabSwitch(): void {
        let active: Electron.WebViewElement = browserDom.getWebview();
        let back: JQuery = $("#back");
        let forward: JQuery = $("#forward");
        let location: JQuery = $("#location");

        // if there is only one athenaTab remaining hide its close button 
        let athenaTabs = this.getAthenaTabs();
        if (athenaTabs.length === 1) {
            $(`#${athenaTabs[0].getId()} .tab-close`).hide();
        } else if (!tabs.getActiveTabBar().getLockedStatus()) {
                $(".tab-close").show();
        }
        // Re-evaluate the back/forward navigation buttons based on new active Tab
        (<HTMLButtonElement>back.get(0)).disabled = !active.canGoBack();
        (<HTMLButtonElement>forward.get(0)).disabled = !active.canGoForward();

        if (active.isLoading()) {
            location.removeClass("location-loaded");
        } else {
            location.addClass("location-loaded");
        }
        this.setAddress(active.getURL());
    }

    /**
     * Returns all Tabs that match the athena regex.
     * 
     * @returns An array of athena Tabs.
     */
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
        $("#add-tab").prop("disabled",true);
        $(".tab-close").hide();
        $("#location").prop("disabled",true);
        $("#settings").prop("disabled", true);
        $("#dock").hide();
    }

    public unlockActiveUser(): void {
        tabs.getActiveTabBar().setLockedStatus(false);
        $("#add-tab").prop("disabled",false);
        $(".tab-close").show();
        $("#location").prop("disabled",false);
        $("#settings").prop("disabled", false);
        $("#dock").show();
    }

    public parseUrl(url: string, isLocalContent?: boolean): string {
        isLocalContent = isLocalContent ? isLocalContent : url.includes("file://");
        if (!url) {
            url = homepage;
        }
        url = url.trim();
        // parse url to determine if it is a google search or actual url
        // todo move all parsing into single function
        if (url.indexOf("http") === -1 && !isLocalContent) {
            if(url.indexOf(" ") !== -1 || url.indexOf(".") === -1) {
                url = "https://google.com/search?q="+encodeURIComponent(url);
            } else {
                url = `http://${url}`;
            }
        }
        return url;
    }

    public isAthenaUrl(url: string): boolean {
        // let re: RegExp = new RegExp("^https://(?:[\w-]+\.)+athenahealth\.com(?::\d+)?");
        // return re.test(url);
        return url.match(/^https?:\/\/(?:[\w-]+\.)+athenahealth\.com(?::\d+)?/) !== null;
    }

    private closeTabOnClick(tab: Tab): void {
        if (!this.handleUserLock()) {
            tabs.removeTab(tab.getId());
            this.tabSwitch();
            this.doLayout();
            ipcRenderer.send("update-num-tabs", tabs.getActiveTabBar().size());
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

export const browserDom: BrowserDOM = new BrowserDOM();
export const tabs: UserTabBar = new UserTabBar(browserDom);
export const stopwatch: any = new Stopwatch(false, {refreshRateMS: 1, almostDoneMS: 30000});
let homepage = athenaNetHomepage;
let backgroundWindow: Electron.BrowserWindow = null;

window.onresize = () => browserDom.doLayout();
window.onload = () => {
    let user = "";
    let preferenceFile = new PreferenceFile(user, "settings.json");
    let path = ([remote.app.getPath("appData"), remote.app.getName(), "users", user]).join("/");
    let findMatchCase: boolean = false;
    // Event Handlers 
    $("#location-form").on("submit", (): boolean => {
            let address: string = $("#location").val();
            browserDom.navigateTo(browserDom.getWebview(), address);
            return false;
    });
    $("#location").on("focus", (event: JQueryMouseEventObject): void => {
            $(event.target).select();
        });

    // Navigation button controls
    /*
    $("#back").on("click", (): void => {
        let popped = tabs.getActiveTab().back.pop();
        tabs.getActiveTab().forward.push(popped);
        browserDom.getWebview().goBack();
    });
    */
    $("#forward").on("click", (): void => {
        let popped = tabs.getActiveTab().forward.pop();
        tabs.getActiveTab().back.push(popped);
        browserDom.getWebview().goForward();
    });
    let cancelClick: any;
    // mousedown, a global variable is set to the timeout function
    $("#back").mousedown( function() {
        cancelClick = setTimeout( displayBack, 500 );
    });
    // mouseup, the timeout for dontClick is cancelled
    $("#back").mouseup( function() {
        clearTimeout(cancelClick);
        // if the time limit wasn't passed, this will be true
        if(clickIsValid) {
            // this is where you call the function you want to happen on  a quick click
            let popped = tabs.getActiveTab().back.pop();
            tabs.getActiveTab().forward.push(popped);
            browserDom.getWebview().goBack();
        } else {
            $("#back").append($("<div></div>")
                        .attr("id", "back-history"));
            for(let i = tabs.getActiveTab().back.length - 1; i > 0 && i > tabs.getActiveTab().back.length - 6; i--) {
                $("#back-history").append($("<li>" + tabs.getActiveTab().back[i] + "</li>")
                .attr("id", i)
                .attr("class", tabs.getActiveTab().back[i]));
                $("#" + i).click(function(){
                    browserDom.navigateTo($("#" + i).attr("class"));
                    $("#back-history").off();
                    $("#back").empty();
                    tabs.getActiveTab().back = [];
                });
            }
            $("#back").mouseleave( function() {
                $("#back").empty();
            });
        }
        // reset the values to their defaults
        clickIsValid = true;
    });
    /* let timeoutId = 0;

    $("#back").mousedown(function() {
        timeoutId = setTimeout(displayBack, 1000);
    }).bind("mouseup mouseleave", function() {
        clearTimeout(timeoutId);
    });
    */

    $("#athena").on("click", (): void => {
        browserDom.navigateTo(browserDom.getWebview(), "https://athenanet.athenahealth.com");
    });
    $("#add-tab").on("click", (): void => {
        browserDom.addTab(homepage);
    });
    $("#settings").on("click", (): void => {
        $("#location").removeClass("location-loaded");
        console.log(path);
        browserDom.addTab("file://" + __dirname + "/settings.html");
        remote.ipcMain.on("get-user", (event, arg) => {
                    event.returnValue = {"username": user, "homepage": homepage};
        });
        remote.ipcMain.on("update-homepage", function(event: any, newHomepage: string){
            if (newHomepage.indexOf("http") === -1 && newHomepage !== "about:blank") {
                newHomepage = `http://${newHomepage}`;
            }
            homepage = new (<any>URL)(newHomepage).href;
            let newSettings = {"username" : user, "homepage" : newHomepage};
            preferenceFile.write(newSettings);
        });
    });
    $("#reload").on("click", (): void => {
        if (browserDom.getWebview().isLoading()) {
            browserDom.getWebview().stop();
        } else {
            browserDom.getWebview().reload();
        }
    });

    // Find-in-page controls
    $("#find-form").on("submit", (event: JQueryEventObject): void => {
        event.preventDefault();
        browserDom.getWebview().findInPage($("#find-text").val(),
            {matchCase: findMatchCase});
    });

    $("#find-text").keydown(function (event: JQueryKeyEventObject) {
        if (event.which === 27) {
            event.preventDefault();
            $("#find-close").click();
        }
    });

    $("#find-forward").on("click", (event: JQueryEventObject): void => {
        event.preventDefault();
        browserDom.getWebview().findInPage($("#find-text").val(),
            {matchCase: findMatchCase});
    });

    $("#find-backward").on("click", (event: JQueryEventObject): void => {
        event.preventDefault();
        browserDom.getWebview().findInPage($("#find-text").val(),
            {matchCase: findMatchCase, forward: false});
    });

    $("#match-case").on("click", function (event: JQueryEventObject) {
        event.preventDefault();
        if (!findMatchCase) {
            findMatchCase = true;
            $(this).addClass("on");
        } else {
            findMatchCase = false;
            $(this).removeClass("on");
        }
        browserDom.getWebview().findInPage($("#find-text").val(),
            {matchCase: findMatchCase});
    });

    $("#find-close").on("click", function (event: JQueryEventObject) {
        event.preventDefault();
        browserDom.getWebview().stopFindInPage("clearSelection");
        $("#find-box").slideUp("fast");
    });

    window.addEventListener("keydown", handleKeyDown);

    // Read user preference file or create a new file then create first tab
    preferenceFile.readJson()
    .then(settings => {
        homepage = new (<any>URL)(settings.homepage).href;
    })
    .catch(err => {
        // any errors in the file will result in the default settings being applied to the user
        createNewUserSettings(preferenceFile, user);
    })
    .then(() => {
        tabs.addUser("test");
        // browserDom.addTab("http://prodmirror.athenahealth.com");
        tabs.addTab(new Tab(browserDom, {
            url: "http://prodmirror.athenahealth.com"
        }), "test");
        tabs.activateUser("test");
        // browserDom.clearCookies();
        if (!process.env.athenahealth_viewport_test) {
            browserDom.lockActiveUser();
            // alert("Please login to continue using the Viewport");
        }

        browserDom.doLayout();

        ipcRenderer.on("openPDF", function (event, filedata) {
            let PDFViewerURL: string = "file://" + __dirname + "/pdfjs/web/viewer.html?url=";
            let PDFurl: string = PDFViewerURL + filedata.url;
            browserDom.addTab(PDFurl);
            // tabs.addTab(new Tab(browserDom, {
            //         url: PDFurl
            // }));
        });

        ipcRenderer.on("enter-full-screen", function() {
            $("#controls").addClass("fullscreen");
        });

        ipcRenderer.on("leave-full-screen", function() {
            $("#controls").removeClass("fullscreen");
        });

        // use getAthenaTabs
        // use the URL as domain
        // node's url module to get host domain
        remote.ipcMain.on("check-current-timeout", (): void => {
            let athenaWebview: Electron.WebViewElement =
                $("#webviews").children().get().filter((webview: Electron.WebViewElement) => {
                    return browserDom.isAthenaUrl(webview.getURL());
                })[0];
            if (!athenaWebview) {
                return;
            }
            let athenaDomain: string = nodeUrl.parse(athenaWebview.getURL()).hostname;
            if (!tabs.getActiveTabBar().getLockedStatus()) {
                athenaWebview.getWebContents().session.cookies.get({
                    domain: athenaDomain.replace(/prodmirror|athenanet/,""),
                    name: "UNENCRYPTED_USERNAME"
                }, (error: Error, cookies: Electron.Cookie[]) : void => {
                    // console.log(cookies);
                    if (cookies && cookies.length > 0) {
                        $("#username").text(cookies[0].value);
                        user = cookies[0].value;
                    } else {
                        $("#username").text("");
                    }
                });
            }

            athenaWebview.getWebContents().session.cookies.get({
                        domain: athenaDomain,
                        name: "TIMEOUT_UNENCRYPTED"
                    }, (error: Error, cookies: Electron.Cookie[]): void => {
                        if (!cookies || cookies.length < 1) {
                            console.log("No cookies");
                            stopwatch.stop();
                            return;
                        } else if (cookies.length === 1) {
                            let currentTimeout: number = parseInt(cookies[0].value, 10);
                            let userIsLocked: boolean = tabs.getActiveTabBar().getLockedStatus();

                            // console.log(`${currentTimeout} => ${stopwatch.ms}`);

                            if (currentTimeout > 0) {
                                if (userIsLocked) {
                                    browserDom.unlockActiveUser();
                                    stopwatch.reset(currentTimeout*1000);
                                    stopwatch.start();
                                    almostDoneFired = false;
                                    return;
                                } else if (previousTimeout === -1 || previousTimeout !== currentTimeout) {
                                    stopwatch.reset(currentTimeout*1000);
                                    stopwatch.start();
                                    previousTimeout = currentTimeout;
                                }
                            } else {
                                if (!tabs.getActiveTabBar().getLockedStatus()) {
                                    browserDom.lockActiveUser();
                                }
                            }
                        } else {
                            let currentTimeout: number = parseInt(cookies[1].value, 10);
                            let totalTimeout: number = parseInt(cookies[0].value, 10);
                            // let isHidden: boolean = $(athenaWebview).css("display") === "none";
                            // console.log(`${currentTimeout} => ${stopwatch.ms}`);

                            // Athenanet times out when the cookie's value is <= 0 so we lock the user.
                            if (currentTimeout > 0) {
                                let userIsLocked: boolean = tabs.getActiveTabBar().getLockedStatus();

                                if (userIsLocked) {
                                    browserDom.unlockActiveUser();
                                    stopwatch.reset(currentTimeout*1000);
                                    stopwatch.start();
                                    almostDoneFired = false;
                                    return;
                                }

                                // Reset the timeout stopwatch to the current cookie time.
                                if (previousTimeout === -1 || (previousTimeout !== currentTimeout && !userIsLocked)) {
                                    stopwatch.reset(currentTimeout*1000);
                                    stopwatch.start();
                                    if (totalTimeout === currentTimeout) {
                                        almostDoneFired = false;
                                    }
                                    previousTimeout = currentTimeout;
                                }
                            } else {
                                if (!tabs.getActiveTabBar().getLockedStatus()) {
                                    browserDom.lockActiveUser();
                                }
                            }
                        }
                    });
            });
        // Events for the athenanet timeout stopwatch

        stopwatch.onDone(() => {
            if (!tabs.getActiveTabBar().getLockedStatus()) {
                console.log("User locked out");
                browserDom.lockActiveUser();
            }
        });

        stopwatch.on("almostdone", () => {
            if (almostDoneFired) {
                return;
            }

            let options: any = {
                type: "info",
                message: "Your athenanet tab will lock itself from inactivity in 30 seconds.",
                buttons: ["OK"]
            };

            remote.dialog.showMessageBox(options);
            almostDoneFired = true;
        });

        $(function() {
            $("#tabs").sortable({
                revert: true,
                axis: "x",
                scroll: false,
                forcePlaceholderSize: true,
                items: ".ui-state-default",
                tolerance: "pointer",
                containment: "parent"
            })
            .on("sortactivate", function(event: Event, ui: any) {
                ui.placeholder.css("width", ui.item.css("width"));
            });
        });

        createBackgroundWindow();
    });
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
    let url: string = browserDom.parseUrl(webview.getURL());
    let tab: Tab = tabs.getTab(webview.getAttribute("tabID"));
    tab.setUrl(url);
    tab.setTitle(webview.getTitle());
    if (tabs.getActiveTab().getId() === tab.getId()) {
        browserDom.setAddress(tab.getUrl());
    }

    if (browserDom.isAthenaUrl(url)) {
        almostDoneFired = false;
        previousTimeout = -1;
    }

    browserDom.tabSwitch();
}

/**
 * Function to be called when a webview has committed to loading a URL.
 *
 * @param event   The event triggered.
 */
function handleLoadCommit(event: Electron.WebViewElement.LoadCommitEvent): void {
    let webview: Electron.WebViewElement = <Electron.WebViewElement>event.target;
    tabs.getActiveTab().back.push(webview.getWebContents().getURL());
    console.log(webview.getAttribute("src"));
    // console.log(webview.getWebContents().getURL());
    if (tabs.getTab(webview.getAttribute("tabID")).getActiveStatus()) {
        (<HTMLButtonElement>$("#back").get(0)).disabled = !webview.canGoBack();
        (<HTMLButtonElement>$("#forward").get(0)).disabled = !webview.canGoForward();
        browserDom.setAddress(webview.getWebContents().getURL());
    }
}

/**
 * Function to be called when a webview fails loading a URL. Loads an error page instead.
 *
 * @param event   The event triggered.
 */

/*
function handleLoadRedirect(event: Electron.WebViewElement.DidGetRedirectRequestEvent): void {
    if (tabs.getActiveTab().getId() === (<Electron.WebViewElement>event.target).getAttribute("tabID")) {
        browserDom.setAddress(event.newURL);
*/
function handleLoadFail(event: Electron.WebViewElement.DidFailLoadEvent): void {
    if (event.errorCode !== -3 && event.errorCode !== -300) {
        browserDom.navigateTo(<Electron.WebViewElement>event.target, "file://" + __dirname + "/error.html", true);
    }
}

/**
 * Function to handle local keyboard shortcuts. Not using Electron's globalShortcut
 * because it still listens for them when the app isn't focused.
 * 
 * @param event   The keyboard event triggered.
 * @todo Currently has a switch case for more Ctrl+... events, add more.
 */
function handleKeyDown(event: KeyboardEvent): void {
    if (event.metaKey) {
        switch (event.keyCode) {
            // Ctrl/Cmd+F - find in page.
            case 70:
                event.preventDefault();
                $("#find-box").slideDown("fast");
                $("#find-text").select();
                return;
            // Ctrl/Cmd+R - reload page.
            case 82:
                event.preventDefault();
                if ($("#location").hasClass("location-loaded")) {
                    $("#reload").click();
                }
                return;
            // Ctrl/Cmd+T - new tab.
            case 84:
                event.preventDefault();
                $("#add-tab").click();
                return;
            // Ctrl/Cmd+W - close current tab.
            case 87:
                event.preventDefault();
                let tabClose: JQuery = $(browserDom.getTabElement()).find(".tab-close");
                if (tabClose.is(":visible")) {
                    tabClose.click();
                }
                return;
            default:
                return;
        }
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
 * Gets the favicon from Google's API.
 * @param domain   The domain the favicon belongs to.
 * @returns A promise of the base64 string of the favicon.
 */
function getFaviconImage(domain: string): Promise<string> {
    const options: requestPromise.OptionsWithUri = {
        method: "GET",
        uri: "http://www.google.com/s2/favicons?domain=" + encodeURIComponent(domain),
        resolveWithFullResponse: true,
        encoding: null
    };

    return requestPromise(options)
        .then((response: any) => {
            let imageBase64: string = response.body.toString("base64");
            let type: string = response.headers["content-type"];
            let prefix: string = "data:" + type + ";base64,";
            let encodedImage: string = prefix + imageBase64;
            return encodedImage;
        })
        .catch((error: any) => {
            return blankFaviconUri;
        });
}
/**
 * Creates a file for a user if one does not exist already
 * @param preferenceFile    file for a given user
 * @param user  new user
 */
function createNewUserSettings(preferenceFile: PreferenceFile, user: string): void {
    let defaultSettings = {"username" : user, "homepage" : athenaNetHomepage};
    preferenceFile.write(defaultSettings);
}

function displayBack(): void {
    clickIsValid = false;
    console.log(tabs.getActiveTab().back);
}