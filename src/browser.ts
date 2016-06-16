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


function navigateTo(webview: Electron.WebViewElement, url: string): void {
    let address: HTMLInputElement = (<HTMLInputElement>document.getElementById("location"));

    if (!url) {
        url = "http://athenanet.athenahealth.com";
    }

    if (url.indexOf("http") === -1) {
        url = `http://${url}`;
    }
    address.blur();
    webview.loadURL(url);
}

function doLayout(): void {
    let webview: MSHTMLWebViewElement = <MSHTMLWebViewElement> document.getElementById("webpage");
    let controls: HTMLDivElement = <HTMLDivElement> document.getElementById("controls");
    let controlsHeight: number = controls.offsetHeight;
    let windowWidth: number = document.documentElement.clientWidth;
    let windowHeight: number = document.documentElement.clientHeight;
    let webviewWidth: number = windowWidth;
    let webviewHeight: number = windowHeight - controlsHeight;

    webview.style.width = webviewWidth + "px";
    webview.style.height = webviewHeight + "px";
}