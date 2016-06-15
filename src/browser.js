window.onresize = doLayout;
onload = function () {
    doLayout();
    document.getElementById("location-form").onsubmit = function () {
        navigateTo(document.getElementById("location").value);
        return false;
    };
};
function navigateTo(url) {
    if (!url) {
        url = "http://athenanet.athenahealth.com";
    }
    console.log(url);
    if (url.indexOf("http") === -1) {
        url = "http://" + url;
    }
    document.getElementById("webpage").loadURL(url);
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
