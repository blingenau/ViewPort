/// <reference path="../../typings/index.d.ts" />
import {ipcRenderer} from "electron";

window.onload = function () {
    function checkTimeout() {
        ipcRenderer.send("check-current-timeout");
    }

    setInterval(checkTimeout, 1000);
};