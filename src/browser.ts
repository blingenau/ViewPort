/// <reference path="Definitions/github-electron.d.ts" />
/// <reference path="Definitions/node.d.ts" />
class Tab {
    url: string;
    id: number;
    active: boolean;
    webview: Electron.WebViewElement;
    constructor (tab: any) {
        this.url = tab.url || "",
        this.id = tab.id || Math.round(Math.random() * 100000000000000000),
        this.webview = tab.webview || null;
        this.active = tab.active || false;
        this.webview.addEventListener("dom-ready", () => {
            debugger;
        document.getElementById("location-form").onsubmit = (): boolean => {
            if (this.active) {
                let address: HTMLInputElement = (<HTMLInputElement>document.getElementById("location"));
                this.url = address.value;
                navigateTo(this.webview, this.url);
            }
        return false;
        };
        this.webview.addEventListener("load-commit", (event: Electron.WebViewElement.LoadCommitEvent) => {
            let address: HTMLInputElement = (<HTMLInputElement>document.getElementById("location"));
            address.value = event.url;
        });

         });
      }
  }
class TabBar {
    tabs: Tab[];
    active_tab: number;
    constructor() {
        this.tabs = [];
        this.active_tab = -1 ;
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
        this.render();
    }
    public remove_tab(tab_id: number = -1) {
        if (this.size() === 0) {
            console.log("Popping from empty TabBar");
            return;
        }
        if (tab_id === -1) {
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
    public render(): void {
        doLayout();
        // perhaps TabBar should always be non-empty
        /*
        let tab: Tab = this.tabs[this.active_tab];
        tab.webview.addEventListener("load-commit", (event: Electron.WebViewElement.LoadCommitEvent) => {
        let address: HTMLInputElement = (<HTMLInputElement>document.getElementById("location"));
        address.value = event.url; 
    });
    */
    }
}

let Tabs: TabBar = new TabBar();

window.onresize = doLayout;
let isLoading: boolean = false;
onload = () => {
    let webview: Electron.WebViewElement = <Electron.WebViewElement>document.querySelector("#webpage"),
        reload: HTMLButtonElement = <HTMLButtonElement>document.getElementById("reload");

    doLayout();

    document.getElementById("location-form").onsubmit = (): boolean => {
        navigateTo((<HTMLInputElement>document.querySelector("#location")).value);
        return false;
    };

    document.getElementById("back").onclick = function () {
        webview.goBack();
    };

    document.getElementById("forward").onclick = function () {
        webview.goForward();
    };

    document.getElementById("home").onclick = function () {
        navigateTo("http://athenanet.athenahealth.com/");
    };

    reload.onclick = function () {
        if (isLoading) {
            webview.stop();
        } else {
            webview.reload();
        }
    };

    reload.addEventListener("webkitAnimationIteration", (): void => {
        if (!isLoading) {
            document.body.classList.remove("loading");
        }
    });

    webview.addEventListener("did-start-loading", handleLoadStart);
    webview.addEventListener("did-stop-loading", handleLoadStop);
    webview.addEventListener("did-fail-load", handleFailLoad);
    webview.addEventListener("load-commit", handleLoadCommit);
    webview.addEventListener("did-get-redirect-request", handleLoadRedirect);
};

function navigateTo(url: string, html?: boolean): void {
    let address: HTMLInputElement = (<HTMLInputElement>document.querySelector("#location"));
    let webview: Electron.WebViewElement = <Electron.WebViewElement>document.querySelector("#webpage");

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
    let webview: MSHTMLWebViewElement = <MSHTMLWebViewElement> document.querySelector("#webpage"),
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
    isLoading = false;
}

function handleLoadCommit(event: Electron.WebViewElement.LoadCommitEvent): void {
    let address: HTMLInputElement = <HTMLInputElement>document.querySelector("#location"),
        webview: Electron.WebViewElement = <Electron.WebViewElement>document.querySelector("#webpage");

    address.value = event.url;
    (<HTMLButtonElement>document.querySelector("#back")).disabled = !webview.canGoBack();
    (<HTMLButtonElement>document.querySelector("#forward")).disabled = !webview.canGoForward();
}

function handleLoadRedirect(event: Electron.WebViewElement.DidGetRedirectRequestEvent): void {
    (<HTMLInputElement>document.getElementById("location")).value = event.newURL;
}

function handleFailLoad(event: Electron.WebViewElement.DidFailLoadEvent): void {
    navigateTo("file://" + __dirname + "/error.html", true);
}