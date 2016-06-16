window.onresize = doLayout;

onload = () => {
    doLayout();

    document.getElementById("location-form").onsubmit = (): boolean => {
        navigateTo((<HTMLInputElement>document.getElementById("location")).value);
        return false;
    };
};

function navigateTo(url: string): void {
    if (!url) {
        url = "http://athenanet.athenahealth.com";
    }
    console.log(url);
    if (url.indexOf("http") === -1) {
        url = `http://${url}`;
    }
    (<Electron.WebViewElement>document.getElementById("webpage")).loadURL(url);
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