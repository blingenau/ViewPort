/// <reference path="Definitions/github-electron.d.ts" />
/// <reference path="Definitions/node.d.ts" />
/*
    Class Tab:
    
    Description:
        Organizes information needed to display a tab and webview
    Properties:
        url: string - url of the tab
        id: string - random unique ID for the tab
        active: boolean - is the tab the current active tab on screen
        webview: Electron.WebViewElement - webview element of tab
*/
var Tab = (function () {
    function Tab(tab) {
        this.url = tab.url || "",
            this.id = tab.id || Math.round(Math.random() * 100000000000000000).toString(),
            this.title = tab.title || "",
            this.webview = tab.webview || createWebview();
        this.active = tab.active || true;
        this.webview.src = this.url;
        this.webview.setAttribute("tab_id", this.id);
    }
    return Tab;
}());
/*
    Class TabBar:
    
    Description:
        Organizes Tab objects and handles displaying them in some way
    Properties:
        tabs: Tab[] - list of Tab objects (see Tab class)
        active_tab: number - index of tab in the list that is the active tab
*/
var TabBar = (function () {
    function TabBar() {
        this.tabs = [];
        this.active_tab = -1;
    }
    /*
        Function: TabBar.get(id: string): Tab
        
        Description:
            gets a Tab from within the list with id matching input
        
        Arguments:
            id: string - id of tab to return

        Return Value:
            Tab object matching id input if found, else null
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
    TabBar.prototype.size = function () {
        return this.tabs.length;
    };
    /*
        Function: TabBar.add_tab(tab: Tab, background: boolean = false): void

        Description:
            pushes a Tab into list of tabs
        
        Arguments:
            tab: Tab - Tab object to insert
            background: boolean - if true open in background (not active) - default false
        
        Return Value:
            none
    */
    TabBar.prototype.add_tab = function (tab, background) {
        if (background === void 0) { background = false; }
        this.tabs.push(tab);
        if (this.active_tab === -1) {
            this.active_tab = 0;
        }
        if (!background) {
            // if tab not a background tab then set it as active tab
            this.active_tab = this.size() - 1;
        }
        for (var index = 0; index < this.size(); index++) {
            this.tabs[index].active = this.active_tab === index;
        }
        this.render();
    };
    /*
        Function: TabBar.remove_tab(tab_id: string): boolean

        Description:
            Removes a tab matching tab_id input.
        
        Arguments:
            tab_id: string - tab_id to find and remove tab
        
        Return Value:
            returns remove state (true is good, false means TabBar is empty (closed) or error)
    */
    // 
    TabBar.prototype.remove_tab = function (tab_id) {
        if (this.size() === 0) {
            // this should not happen
            console.log("Popping from empty TabBar");
            return false;
        }
        var result = -1;
        for (var index = 0; index < this.size(); index++) {
            if (this.tabs[index].id === tab_id) {
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
                if (result < this.active_tab) {
                    this.active_tab--;
                }
            }
            return true;
        }
        return false;
    };
    /*
        Function: TabBar.active(): Tab
        returns active tab within TabBar
    */
    TabBar.prototype.active = function () {
        return this.tabs[this.active_tab];
    };
    /*
        Function: TabBar.activate(tab: Tab): void

        Description:
            activate the given tab, and set all other tabs in TabBar to inactive

        Arguments:
            tab: Tab - Tab object ot activate
        
        Return value:
            none
    */
    TabBar.prototype.activate = function (tab) {
        var button = document.getElementById(tab.id);
        for (var index = 0; index < this.size(); index++) {
            this.tabs[index].active = this.tabs[index].id === tab.id;
            if (this.tabs[index].active) {
                this.active_tab = index;
            }
        }
    };
    /*
        Function: TabBar.render(): void

        Description:
            Handles the rendering of multiple tabs and setting up tab buttons.
            Currently assigns an on-click call to global Tabs variable.

        Arguments:
            none
        
        Return Value:
            none
    */
    TabBar.prototype.render = function () {
        var tabs = document.getElementById("tabs");
        tabs.innerHTML = "";
        var _loop_1 = function(index) {
            var tabDiv = document.createElement("div"), tabTitle = document.createElement("div"), tabFavicon = document.createElement("div"), tabClose = document.createElement("div"), xButton = document.createElement("button"), tab = this_1.tabs[index];
            tabDiv.className = "chrome-tab";
            tabDiv.id = tab.id;
            tabTitle.title = tabTitle.innerHTML = tab.title;
            var tab_fav = "http://www.google.com/s2/favicons?domain=" + tab.url;
            // tabFavicon.innerHTML = `style="background-image: url(` + tab_fav + ")";
            // tabFavicon.style = background-image: url( + tab_fav + ")" + `"`;
            tabFavicon.innerHTML = "<img src = " + tab_fav + ">";
            tabTitle.className = "chrome-tab-title";
            tabClose.className = "chrome-tab-close";
            tabFavicon.className = "chrome-tab-favicon";
            tabClose.onclick = function () {
                Tabs.remove_tab(tabDiv.id);
                Tabs.render();
            };
            // Make the button title the name of the website not URL 
            // tabDiv.title = tabDiv.innerHTML = tab.title;
            tabDiv.appendChild(tabFavicon);
            tabDiv.appendChild(tabTitle);
            tabDiv.appendChild(tabClose);
            // xButton.innerHTML = "&#215";
            // xButton.onclick = () => { Tabs.remove_tab(tabDiv.id); };
            // tabDiv.appendChild(xButton);
            var click = function () {
                Tabs.activate(tab);
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
var Tabs = new TabBar();
window.onresize = doLayout;
var isLoading = false;
var ipc = require("electron").ipcRenderer;
onload = function () {
    Tabs.add_tab(new Tab({
        url: "http://athenanet.athenahealth.com"
    }));
    var reload = document.getElementById("reload"), urlBar = document.getElementById("location-form");
    doLayout();
    urlBar.onsubmit = function () {
        var address = document.querySelector("#location").value;
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
        var PDFViewerURL = "file://" + __dirname + "/pdfjs/web/viewer.html?url=";
        var PDFurl = PDFViewerURL + filedata.url;
        var hasOpenedPDF = false;
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
        }
        else {
            Tabs.active().webview.reload();
        }
    };
};
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
function doLayout() {
    var webview = Tabs.active().webview, controls = document.querySelector("#controls"), controlsHeight = controls.offsetHeight, windowWidth = document.documentElement.clientWidth, windowHeight = document.documentElement.clientHeight, webviewWidth = windowWidth, webviewHeight = windowHeight - controlsHeight;
    webview.style.width = webviewWidth + "px";
    webview.style.height = webviewHeight + "px";
}
function handleLoadStart(event) {
    document.body.classList.add("loading");
    document.getElementById("reload").innerHTML = "&#10005";
    isLoading = true;
}
function handleLoadStop(event) {
    isLoading = false;
    var address = document.querySelector("#location");
    var webview = Tabs.active().webview;
    var tab = Tabs.get(webview.getAttribute("tab_id"));
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
function handleLoadCommit(event) {
    document.getElementById("reload").innerHTML = "&#10227";
    console.log(event.srcElement);
    var address = document.querySelector("#location");
    var webview = Tabs.active().webview;
    address.value = event.url;
    document.querySelector("#back").disabled = !webview.canGoBack();
    document.querySelector("#forward").disabled = !webview.canGoForward();
}
function handleLoadRedirect(event) {
    document.getElementById("location").value = event.newURL;
}
function handleFailLoad(event) {
    if (event.errorCode !== -3) {
        navigateTo(Tabs.active().webview, "file://" + __dirname + "/error.html", true);
    }
}
/**

 * Actions to happen upon a context switch from Tab to Tab.

 */
function tabSwitch() {
    var active = Tabs.active().webview;
    // Re-evaluate the back/forward navigation buttons based on new active Tab
    document.querySelector("#back").disabled = !active.canGoBack();
    document.querySelector("#forward").disabled = !active.canGoForward();
    document.getElementById("back").onclick = function () {
        active.goBack();
    };
    document.getElementById("forward").onclick = function () {
        active.goForward();
    };
    document.getElementById("location").value = Tabs.active().webview.getURL();
}
