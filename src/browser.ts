/// <reference path="Definitions/github-electron.d.ts" />
/// <reference path="Definitions/node.d.ts" />

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
    webview.addEventListener("load-commit", handleLoadCommit);
};

function navigateTo(url: string): void {
    let address: HTMLInputElement = (<HTMLInputElement>document.querySelector("#location"));
    let webview: Electron.WebViewElement = <Electron.WebViewElement>document.querySelector("#webpage");

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