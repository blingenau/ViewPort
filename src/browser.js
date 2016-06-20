/// <reference path="Definitions/github-electron.d.ts" />
/// <reference path="Definitions/node.d.ts" />
var Tab = (function () {
    function Tab(tab) {
        this.url = tab.url || "",
            this.id = tab.id || Math.round(Math.random() * 100000000000000000).toString(),
            this.webview = tab.webview || createWebview();
        this.active = tab.active || true;
        this.webview.src = this.url;
        this.webview.setAttribute("tab_id", this.id);
    }
    return Tab;
}());
var TabBar = (function () {
    function TabBar() {
        this.tabs = [];
        this.active_tab = -1;
    }
    TabBar.prototype.get = function (id) {
        for (var index = 0; index < this.size(); index++) {
            if (this.tabs[index].id === id) {
                return this.tabs[index];
            }
        }
    };
    TabBar.prototype.size = function () {
        return this.tabs.length;
    };
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
    TabBar.prototype.remove_tab = function (tab_id) {
        if (tab_id === void 0) { tab_id = ""; }
        if (this.size() === 0) {
            console.log("Popping from empty TabBar");
            return;
        }
        var tab = null;
        if (tab_id === "") {
            tab = this.tabs.pop();
            if (this.active_tab === this.size()) {
                this.active_tab -= 1;
            }
        }
        else {
            this.tabs = this.tabs.filter(function (tab) {
                return tab.id !== tab_id;
            });
        }
        // delete webview from webviews
        document.getElementById("webviews").removeChild(this.get(tab_id).webview);
        this.render();
    };
    TabBar.prototype.active = function () {
        return this.tabs[this.active_tab];
    };
    TabBar.prototype.activate = function (tab) {
        var button = document.getElementById(tab.id);
        for (var index = 0; index < this.size(); index++) {
            this.tabs[index].active = this.tabs[index].id === tab.id;
            if (this.tabs[index].active) {
                this.active_tab = index;
            }
        }
        this.render();
    };
    TabBar.prototype.render = function () {
        var tabs = document.getElementById("tabs");
        tabs.innerHTML = "";
        var _loop_1 = function(index) {
            var button = document.createElement("button"), xButton = document.createElement("button");
            var tab = this_1.tabs[index];
            button.title = button.innerHTML = tab.url;
            button.className = "tab";
            button.id = tab.id;
            // xButton.innerHTML = "&#10005";
            // xButton.onclick = () => { this.remove_tab(button.id); };
            // button.appendChild(xButton);
            var click = function () {
                Tabs.activate(tab);
            };
            button.onclick = function () { click(); };
            tabs.appendChild(button);
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
