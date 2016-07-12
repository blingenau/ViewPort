/// <reference path="../../typings/index.d.ts" />

const {ipcRenderer} = require("electron");

window.onload = function () {
    function checkTimeout() {
        ipcRenderer.send("check-current-timeout");
    }

    setInterval(checkTimeout, 5000);
};