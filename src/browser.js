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
var Tab = (function () {
    function Tab(tab) {
        this.url = tab.url || "";
        this.id = tab.id || Math.round(Math.random() * 100000000000000000).toString();
        this.title = tab.title || "";
        this.webview = tab.webview || createWebview();
        this.active = tab.active || true;
        this.webview.src = this.url;
        this.webview.setAttribute("tabID", this.id);
    }
    return Tab;
}());
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
var TabBar = (function () {
    function TabBar(user) {
        if (user === void 0) { user = ""; }
        this.tabs = [];
        this.activeTab = -1;
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
    TabBar.prototype.get = function (id) {
        for (var index = 0; index < this.size(); index++) {
            if (this.tabs[index].id === id) {
                return this.tabs[index];
            }
        }
        return null;
    };
    /*
        Function: TabBar.size()
        returns number of tabs currently in the TabBar
    */
    /**
     *  Description:
     *      returns number of tabs currently in the TabBar
     */
    TabBar.prototype.size = function () {
        return this.tabs.length;
    };
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
    TabBar.prototype.add_tab = function (tab, background) {
        if (background === void 0) { background = false; }
        this.tabs.push(tab);
        if (this.activeTab === -1) {
            this.activeTab = 0;
        }
        if (!background) {
            // if tab not a background tab then set it as active tab
            this.activeTab = this.size() - 1;
        }
        for (var index = 0; index < this.size(); index++) {
            this.tabs[index].active = this.activeTab === index;
        }
    };
    /**
     *  Description:
     *      Removes a tab matching tabID input.
     *
     *  Return Value:
     *      returns remove state (true is good, false means TabBar is empty (closed) or error)
     *
     * @param tabID   id of tab to find and remove.
     */
    TabBar.prototype.removeTab = function (tabID) {
        if (this.size() === 0) {
            // this should not happen
            console.log("Popping from empty TabBar");
            return false;
        }
        else if (this.size() === 1) {
            ipc.send("tabs-all-closed");
            return true;
        }
        var result = -1;
        for (var index = 0; index < this.size(); index++) {
            if (this.tabs[index].id === tabID) {
                result = index;
                break;
            }
        }
        if (result > -1) {
            var tab = this.tabs.splice(result, 1)[0];
            document.getElementById("webviews").removeChild(tab.webview);
            if (this.size() === 0) {
                return false;
            }
            if (tab.active) {
                // tab was active, activate another.
                this.activate(this.tabs[Math.min(result, this.size() - 1)]);
            }
            else {
                if (result < this.activeTab) {
                    this.activeTab--;
                }
            }
            return true;
        }
        return false;
    };
    /**
     * Description:
     *      returns active Tab object within TabBar
     */
    TabBar.prototype.active = function () {
        return this.tabs[this.activeTab];
    };
    /**
     *  Description:
     *      activate the given tab, and set all other tabs in TabBar to inactive
     *  Return value:
     *      none
     *
     * @param tab   Tab object to make active, make all others inactive.
     */
    TabBar.prototype.activate = function (tab) {
        // let button: HTMLElement = document.getElementById(tab.id);
        for (var index = 0; index < this.size(); index++) {
            this.tabs[index].active = this.tabs[index].id === tab.id;
            if (this.tabs[index].active) {
                this.activeTab = index;
            }
        }
    };
    /**
     * Description:
     *      Handles the rendering of multiple tabs and setting up tab buttons.
     *      Currently assigns an on-click call to global Tabs variable.
     *
     *  Return Value:
     *      none
     */
    TabBar.prototype.render = function () {
        var tabs = document.getElementById("tabs");
        tabs.innerHTML = "";
        var _loop_1 = function(index) {
            var tabDiv = document.createElement("div");
            var tabTitle = document.createElement("div");
            var tabFavicon = document.createElement("div");
            var tabClose = document.createElement("div");
            var tab = this_1.tabs[index];
            var tabFav = "http://www.google.com/s2/favicons?domain=" + tab.url;
            tabDiv.className = "chrome-tab";
            tabDiv.id = tab.id;
            // Make the button title the name of the website not URL 
            tabTitle.title = tabTitle.innerHTML = tab.title;
            tabFavicon.innerHTML = "<img src = " + tabFav + ">";
            tabTitle.className = "chrome-tab-title";
            tabClose.className = "chrome-tab-close";
            tabFavicon.className = "chrome-tab-favicon";
            tabClose.onclick = function () {
                if (!Tabs.removeTab(Tabs.activeUser(), tabDiv.id)) {
                    // if there are no more tabs close application. Temporary
                    require("electron").remote.app.quit();
                }
                Tabs.render();
            };
            tabDiv.appendChild(tabFavicon);
            tabDiv.appendChild(tabTitle);
            tabDiv.appendChild(tabClose);
            var click = function () {
                Tabs.bars[Tabs.activeBar].activate(tab);
                Tabs.render();
                tabSwitch();
            };
            tabDiv.onclick = function () { click(); };
            tabs.appendChild(tabDiv);
            if (!tab.active) {
                tab.webview.style.width = "0px";
                tab.webview.style.height = "0px";
            }
        };
        var this_1 = this;
        for (var index = 0; index < this.size(); index++) {
            _loop_1(index);
        }
        doLayout();
    };
    return TabBar;
}());
/**
 * class TabBarSet:
 *
 * Description:
 *      Overarching handler for Tabs and TabBars.
 *      Essentially TabBarSet organizes multiple TabBars with their user.
 *      A user must have a non-zero number of tabs to have a TabBar
 */
var TabBarSet = (function () {
    function TabBarSet() {
        this.bars = [];
        this.activeBar = -1;
    }
    /**
     *  Description:
     *      returns the number of TabBar objects within the set
     */
    TabBarSet.prototype.size = function () {
        return this.bars.length;
    };
    /**
     * Description:
     *      returns the TabBar associated with the user input, null if not found
     *
     * @param user   username accociated with the returned TabBar
     */
    TabBarSet.prototype.get = function (user) {
        for (var index = 0; index < this.size(); index++) {
            if (user === this.bars[index].user) {
                return this.bars[index];
            }
        }
        return null;
    };
    /**
     *  Description
     *      adds a Tab to a users TabBar.
     *      Creates a TabBar for them if they don't have one.
     *      Use this to create the TabBar for a user
     *
     *  @param user   user who owns the tab
     *  @param tab   Tab object to add
     */
    TabBarSet.prototype.addTab = function (user, tab) {
        var bar = this.get(user);
        if (bar === null) {
            bar = new TabBar(user);
            bar.add_tab(tab);
            this.bars.push(bar);
        }
        else {
            bar.add_tab(tab);
        }
    };
    /**
     *  Description:
     *      removes tab with tab.id = tabID from the input users bar
     *
     *  Return Value:
     *      boolean indicating success of removal, false is problematic (TabBar is now empty and needs to be handled)
     *  @param user   username of tab owner
     *  @param tabID   id of tab to remove
     */
    TabBarSet.prototype.removeTab = function (user, tabID) {
        var bar = this.get(user);
        if (bar !== null) {
            return bar.removeTab(tabID);
        }
        return false;
    };
    /**
     *  Description:
     *      removes user and destroys all their tabs and TabBar
     *
     *  @param user   user to remove
     */
    TabBarSet.prototype.removeUser = function (user) {
        var result = -1;
        for (var index = 0; index < this.size(); index++) {
            if (this.bars[index].user === user) {
                result = index;
                break;
            }
        }
        if (result > -1) {
            var bar = this.bars.splice(result, 1)[0];
            while (bar.size() > 0) {
                bar.removeTab(bar.active().id);
            }
        }
    };
    /**
     *  Description:
     *      makes the given user the current user and sets up their active tab as the displayed tab
     *
     *  @param user   user to activate
     */
    TabBarSet.prototype.activate = function (user) {
        var bar = this.get(user);
        if (bar === null) {
            console.error("attempt to activate user that does not exist");
            return;
        }
        this.activeBar = -1;
        // set all other tabs to inactive (hidden)
        for (var index = 0; index < this.size(); index++) {
            var tmpBar = this.bars[index];
            if (tmpBar.user === bar.user) {
                this.activeBar = index;
            }
            for (var barIndex = 0; barIndex < tmpBar.size(); barIndex++) {
                tmpBar.tabs[barIndex].active = false;
                tmpBar.tabs[barIndex].webview.style.width = "0px";
                tmpBar.tabs[barIndex].webview.style.height = "0px";
            }
        }
        // set tab state of active tab in bar to active
        bar.active().active = true;
        bar.render();
    };
    /**
     *  Description:
     *      returns the active Tab object from the active user's TabBar
     */
    TabBarSet.prototype.activeTab = function () {
        return this.bars[this.activeBar].active();
    };
    /**
     *  Description:
     *      returns the current active user
     */
    TabBarSet.prototype.activeUser = function () {
        return this.bars[this.activeBar].user;
    };
    /**
     * Description:
     *      returns the Tab object associated with the given id
     *  @param tab_id   tab id to search for
     */
    TabBarSet.prototype.getTab = function (tabID) {
        for (var index = 0; index < this.size(); index++) {
            var bar = this.bars[index];
            for (var tabIndex = 0; tabIndex < bar.size(); tabIndex++) {
                if (bar.tabs[tabIndex].id === tabID) {
                    return bar.tabs[tabIndex];
                }
            }
        }
        return null;
    };
    /**
     *  Description:
     *      handles rendering of the current user's TabBar.
     */
    TabBarSet.prototype.render = function () {
        this.bars[this.activeBar].render();
    };
    return TabBarSet;
}());
var Tabs = new TabBarSet();
window.onresize = doLayout;
var isLoading = false;
var ipc = require("electron").ipcRenderer;
onload = function () {
    Tabs.addTab("test", new Tab({
        url: "http://athenanet.athenahealth.com"
    }));
    Tabs.activate("test");
    var reload = document.getElementById("reload");
    var urlBar = document.getElementById("location-form");
    var addressBar = document.getElementById("location");
    urlBar.onsubmit = function () {
        var address = document.querySelector("#location").value;
        Tabs.activeTab().url = address;
        navigateTo(Tabs.activeTab().webview, address);
        return false;
    };
    doLayout();
    addressBar.onfocus = function () {
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
        Tabs.addTab(Tabs.activeUser(), new Tab({
            url: "about:blank"
        }));
    };
    ipc.on("openPDF", function (event, filedata) {
        var PDFViewerURL = "file://" + __dirname + "/pdfjs/web/viewer.html?url=";
        var PDFurl = PDFViewerURL + filedata.url;
        Tabs.addTab(Tabs.activeUser(), new Tab({
            url: PDFurl
        }));
    });
    reload.onclick = function () {
        if (isLoading) {
            Tabs.activeTab().webview.stop();
        }
        else {
            Tabs.activeTab().webview.reload();
        }
    };
};
/**
 * Creates a new webview
 *
 * @returns A newly created webview tag.
 */
function createWebview() {
    var webview = document.createElement("webview");
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
function navigateTo(webview, url, html) {
    var address = document.querySelector("#location");
    if (!url) {
        url = "http://athenanet.athenahealth.com";
    }
    if (url.indexOf("http") === -1 && !html) {
        url = "http://" + url;
    }
    address.blur();
    webview.loadURL(url);
}
/**
 * Resizes the elements in the window.
 */
function doLayout() {
    var webview = Tabs.activeTab().webview;
    var controls = document.querySelector("#controls");
    var tabBar = document.querySelector("#tabs-shell");
    var controlsHeight = controls.offsetHeight;
    var tabBarHeight = tabBar.offsetHeight;
    var windowWidth = document.documentElement.clientWidth;
    var windowHeight = document.documentElement.clientHeight;
    var webviewWidth = windowWidth;
    var webviewHeight = windowHeight - controlsHeight - tabBarHeight;
    webview.style.width = webviewWidth + "px";
    webview.style.height = webviewHeight + "px";
}
/**
 * Function to be called when a webview starts loading a new URL.
 *
 * @param event   The event triggered.
 */
function handleLoadStart(event) {
    document.body.classList.add("loading");
    document.getElementById("reload").innerHTML = "&#10005;";
    isLoading = true;
}
/**
 * Function to be called when a webview stops loading a new URL.
 *
 * @param event   The event triggered.
 */
function handleLoadStop(event) {
    isLoading = false;
    var address = document.querySelector("#location");
    var webview = event.target;
    var tab = Tabs.getTab(webview.getAttribute("tabID"));
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
function handleLoadCommit(event) {
    document.getElementById("reload").innerHTML = "&#10227;";
    var address = document.querySelector("#location");
    var webview = event.target;
    address.value = event.url;
    document.querySelector("#back").disabled = !webview.canGoBack();
    document.querySelector("#forward").disabled = !webview.canGoForward();
}
/**
 * Function to be called when a webview redirects.
 *
 * @param event   The event triggered.
 */
function handleLoadRedirect(event) {
    document.getElementById("location").value = event.newURL;
}
/**
 * Function to be called when a webview fails loading a URL. Loads an error page instead.
 *
 * @param event   The event triggered.
 */
function handleFailLoad(event) {
    if (event.errorCode !== -3) {
        navigateTo(event.target, "file://" + __dirname + "/error.html", true);
    }
}
/**
 * Actions to happen upon a context switch from Tab to Tab.
 */
function tabSwitch() {
    var active = Tabs.activeTab().webview;
    // Re-evaluate the back/forward navigation buttons based on new active Tab
    document.querySelector("#back").disabled = !active.canGoBack();
    document.querySelector("#forward").disabled = !active.canGoForward();
    document.getElementById("back").onclick = function () {
        active.goBack();
    };
    document.getElementById("forward").onclick = function () {
        active.goForward();
    };
    document.getElementById("location").value = Tabs.activeTab().webview.getURL();
}
