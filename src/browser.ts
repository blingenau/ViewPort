window.onresize = doLayout;

onload = () => {
    let webview: Electron.WebViewElement = <Electron.WebViewElement>document.getElementById("webpage");

    doLayout();
    document.getElementById("location-form").onsubmit = (): boolean => {
        navigateTo((<HTMLInputElement>document.getElementById("location")).value);
        return false;
    };
    webview.addEventListener("load-commit", (event: Electron.WebViewElement.LoadCommitEvent) => {
        let address: HTMLInputElement = (<HTMLInputElement>document.getElementById("location"));

        address.value = event.url;
    });
};

function navigateTo(url: string): void {
    let address: HTMLInputElement = (<HTMLInputElement>document.getElementById("location"));
    let webview: Electron.WebViewElement = <Electron.WebViewElement>document.getElementById("webpage");

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