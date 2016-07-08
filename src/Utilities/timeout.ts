const {ipcRenderer} = require("electron");

window.onload = function () {
    function checkTimeout() {
        ipcRenderer.send("get-current-timeout");
    }

    setInterval(checkTimeout, 5000);
};