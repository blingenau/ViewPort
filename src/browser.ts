/// <reference path="Definitions/github-electron.d.ts" />
/// <reference path="Definitions/node.d.ts" />
class Tab {
    url: string;
    id: string;
    active: boolean;
    webview: Electron.WebViewElement;
    constructor (tab: any) {
        this.url = tab.url || "",
        this.id = tab.id || Math.round(Math.random() * 100000000000000000).toString(),
        this.webview = tab.webview || createWebview();
        this.active = tab.active || true;
        this.webview.src = this.url;
        this.webview.setAttribute("tab_id", this.id);
      }
  }
class TabBar {
    tabs: Tab[];
    active_tab: number;
    constructor() {
        this.tabs = [];
        this.active_tab = -1 ;
    }
    public get(id: string): Tab {
        for (let index = 0; index < this.size(); index++) {
            if (this.tabs[index].id === id) {
                return this.tabs[index];
            }
        }
        return null;
    }
    public size(): number {
        return this.tabs.length;
    }
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
    public remove_tab(tab_id: string = "") {
        if (this.size() === 0) {
            console.log("Popping from empty TabBar");
            return;
        }
        if (tab_id === "") {
            this.tabs.pop();
            if (this.active_tab === this.size()) {
                this.active_tab -= 1;
            }
        }
        else {
            this.tabs.filter(function (tab: Tab) {
                return tab.id !== tab_id;
            });
        }
        this.render();
    }
    public active(): Tab {
        return this.tabs[this.active_tab];
    }
    public activate(tab: Tab): void {
        let button: HTMLElement = document.getElementById(tab.id);
        for (let index = 0; index < this.size(); index++) {
            this.tabs[index].active = this.tabs[index].id === tab.id;
            if (this.tabs[index].active) {
                this.active_tab = index;
            }
        }
        this.render();
    }
    public render(): void {
        let tabs: HTMLElement = document.getElementById("tabs");
        tabs.innerHTML = "";
        for (let index = 0; index < this.size(); index++) {
            let button: HTMLButtonElement = document.createElement("button");
            let tab: Tab = this.tabs[index];

            button.title = button.innerHTML = tab.url;
            button.className = "tab";
            button.id = tab.id;

            let click = function () {
                Tabs.activate(tab);
            };
            button.onclick = function () { click(); };
            tabs.appendChild(button);
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
onload = () => {
    Tabs.add_tab(new Tab({
        url: "http://athenanet.athenahealth.com"
    }));
    // let webview: Electron.WebViewElement = <Electron.WebViewElement>document.querySelector("#webpage");
    let reload: HTMLButtonElement = <HTMLButtonElement>document.getElementById("reload");

    doLayout();
    let urlBar: HTMLElement = document.getElementById("location-form");

    urlBar.onsubmit = (): boolean => {
        let address: string = (<HTMLInputElement>document.querySelector("#location")).value;
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

    reload.onclick = function () {
        if (isLoading) {
            Tabs.active().webview.stop();
        } else {
            Tabs.active().webview.reload();
        }
    };

    reload.addEventListener("webkitAnimationIteration", (): void => {
        if (!isLoading) {
            document.body.classList.remove("loading");
        }
    });

};

function handlePageLoad(event: Event ): void {
    debugger;
    let tab = Tabs.get(this.tab_id);
}

function createWebview(): Electron.WebViewElement {
    let webview: Electron.WebViewElement = document.createElement("webview");
    webview.addEventListener("did-start-loading", handleLoadStart);
    webview.addEventListener("did-stop-loading", handleLoadStop);
    webview.addEventListener("did-fail-load", handleFailLoad);
    webview.addEventListener("load-commit", handleLoadCommit);
    webview.addEventListener("did-get-redirect-request", handleLoadRedirect);
    webview.addEventListener("did-navigate-in-page", handlePageLoad);
    webview.style.display = "flex";
    webview.style.width = "640px";
    webview.style.height = "480px";
    document.getElementById("webviews").appendChild(webview);

    return webview;
}

function navigateTo(webview: Electron.WebViewElement, url: string, html?: boolean): void {
    let address: HTMLInputElement = (<HTMLInputElement>document.querySelector("#location"));
    debugger;
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
    isLoading = true;
}

function handleLoadStop(event: Event): void {
    debugger;
    isLoading = false;
    console.log(this);
    let address: HTMLInputElement = <HTMLInputElement>document.querySelector("#location");
    let webview: Electron.WebViewElement = Tabs.active().webview;
    let tab = Tabs.get(webview.getAttribute("tab_id"));
    tab.url = webview.getAttribute("src");
    address.value = tab.url;
    Tabs.render();
}

function handleLoadCommit(event: Electron.WebViewElement.LoadCommitEvent): void {
    console.log(event.srcElement);
    let webview: Electron.WebViewElement = Tabs.active().webview;
    // address.value = event.url;
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