/// <reference path="Definitions/github-electron.d.ts" />
/// <reference path="Definitions/node.d.ts" />
window.onresize = doLayout;
var isLoading = false;
onload = function () {
    var webview = document.querySelector("#webpage"), reload = document.getElementById("reload");
    doLayout();
    document.getElementById("location-form").onsubmit = function () {
        navigateTo(document.querySelector("#location").value);
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
        }
        else {
            webview.reload();
        }
    };
    reload.addEventListener("webkitAnimationIteration", function () {
        if (!isLoading) {
            document.body.classList.remove("loading");
        }
    });
    webview.addEventListener("did-start-loading", handleLoadStart);
    webview.addEventListener("did-stop-loading", handleLoadStop);
    webview.addEventListener("load-commit", handleLoadCommit);
};
function navigateTo(url) {
    var address = document.querySelector("#location");
    var webview = document.querySelector("#webpage");
    if (!url) {
        url = "http://athenanet.athenahealth.com";
    }
    if (url.indexOf("http") === -1) {
        url = "http://" + url;
    }
    address.blur();
    webview.loadURL(url);
}
function doLayout() {
    var webview = document.querySelector("#webpage"), controls = document.querySelector("#controls"), controlsHeight = controls.offsetHeight, windowWidth = document.documentElement.clientWidth, windowHeight = document.documentElement.clientHeight, webviewWidth = windowWidth, webviewHeight = windowHeight - controlsHeight;
    webview.style.width = webviewWidth + "px";
    webview.style.height = webviewHeight + "px";
}
function handleLoadStart(event) {
    document.body.classList.add("loading");
    isLoading = true;
}
function handleLoadStop(event) {
    isLoading = false;
}
function handleLoadCommit(event) {
    var address = document.querySelector("#location"), webview = document.querySelector("#webpage");
    address.value = event.url;
    document.querySelector("#back").disabled = !webview.canGoBack();
    document.querySelector("#forward").disabled = !webview.canGoForward();
}
