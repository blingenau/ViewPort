window.onresize = doLayout;
onload = function () {
    var webview = document.getElementById("webpage");
    doLayout();
    document.getElementById("location-form").onsubmit = function () {
        navigateTo(document.getElementById("location").value);
        return false;
    };
    webview.addEventListener("load-commit", function (event) {
        var address = document.getElementById("location");
        address.value = event.url;
    });
};
function navigateTo(url) {
    var address = document.getElementById("location");
    var webview = document.getElementById("webpage");
    if (!url) {
        url = "http://athenanet.athenahealth.com";
    }
    if (url.indexOf("http") === -1) {
        url = "http://" + url;
    }
    // address.value = url;
    address.blur();
    webview.loadURL(url);
}
function doLayout() {
    var webview = document.getElementById("webpage");
    var controls = document.getElementById("controls");
    var controlsHeight = controls.offsetHeight;
    var windowWidth = document.documentElement.clientWidth;
    var windowHeight = document.documentElement.clientHeight;
    var webviewWidth = windowWidth;
    var webviewHeight = windowHeight - controlsHeight;
    webview.style.width = webviewWidth + "px";
    webview.style.height = webviewHeight + "px";
}
