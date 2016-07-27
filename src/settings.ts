/// <reference path="../typings/index.d.ts" />
import {ipcRenderer} from "electron";
let currentUserHomepage: string = "";
let currentUser: string = "";

window.onload = () => {
    /*
    console.log(`${__dirname}/dymo/DYMOLabelPrinter.dll`);
    let fs = require("fs");
    fs.readFile(`${__dirname}/dymo/DYMOLabelPrinter.dll`, (err: any, data: any) => {
        if (err) {
            console.log("error");
        } else {
            console.log("found");
        }
});
*/
    let userObject = ipcRenderer.sendSync("get-user");
    currentUser = userObject.username;
    currentUserHomepage = userObject.homepage;
    createUserSettings();

    $(document).ready(function () {
        highlightSelection("#user-nav");
        $("#device-nav").on("click", (): void => {
            highlightSelection("#device-nav");
            $("#user-settings").empty();
            $("#user-settings")
                .append($("<br><br><br>"))
                .append($("<div> ADM Settings </div>")
                    .append($("<br><br>"))
                    .attr("id", "deviceInformation")
                    .attr("class", "page-title")
                    .append($("<div> Device </div>")
                        .attr("id", "device"))
                    .append($("<div> Status </div>")
                        .attr("id", "status"))
                    .append($("<div> Module Version </div>")
                        .attr("id", "version")));
            $("#device")
                    .append($("<div> DYMO Label Printer  </div>")
                    .attr("id", "Dymo")
                    .append($("<div> </div>")
                        .attr("id", "dymo-status"))
                    .append($("<div> v1.1.2.1 </div> ")
                        .attr("id", "dymo-version")));
            getDeviceStatus();
            setInterval(function() {
                getDeviceStatus();
            }, 3000);
        });
        $("#user-nav").on("click", (): void => {
            highlightSelection("#user-nav");
            $("#user-settings").empty();
            createUserSettings();
        });
        $("#administrator-nav").on("click", (): void => {
            highlightSelection("#administrator-nav");
            $("#user-settings").empty();
            $("#user-settings")
                .append($("<br><br><br>"))
                .append($("<div> Admin Settings </div>")
                    .attr("id", "administrator-settings")
                    .attr("class", "page-title"));
        });
        $("#submit-user-settings").on("click", (): boolean => {
            let submitValue: string = $("input[name=newTabCreation]:checked", "#homepage-form").val();
            console.log("submitValue: " + submitValue);
            if(submitValue === "new-homepage") {
                console.log($("#new-homepage1").val());
                currentUserHomepage = $("#new-homepage1").val();
                console.log("#new-homepage1: " + currentUserHomepage);
                ipcRenderer.send("update-homepage", currentUserHomepage);
                updateHomePage(currentUserHomepage);
                return false;
            } else if (submitValue === "new-homepage2") {
                currentUserHomepage = "about:blank";
                ipcRenderer.send("update-homepage", currentUserHomepage);
                updateHomePage(currentUserHomepage);
                return false;
            } else {
                currentUserHomepage = "athenanet.athenahealth.com";
                ipcRenderer.send("update-homepage", currentUserHomepage);
                updateHomePage(currentUserHomepage);
                return false;
            }
        });
    });
    $("#navbar")
        .append($("<div> " + currentUser + "</div>")
            .attr("id", "username"))
        .append($("<br><br><br><br>"))
        .append($("<div> User </div>")
            .attr("id", "user-nav"))
        .append($("<div> Device </div>")
            .attr("id", "device-nav"))
        .append($("<div> Admin <div>")
            .attr("id", "administrator-nav"));
};

function highlightSelection(selected: string): void {
    $("#device-nav").css("color", "#8B8A91");
    $("#user-nav").css("color", "#8B8A91");
    $("#administrator-nav").css("color", "#8B8A91");
    $(selected).css("color", "#6D56A4");
}
function updateHomePage(newHomepage: string): void {
    $("#homepage").empty()
        .append($("<div>")
            .addClass("current-homepage")
            .html("New tabs open to " + newHomepage));
}
function createUserSettings(): void {
    $("#user-settings")
    .append($("<br><br><br>"))
    .append($("<div> Personal Settings </div>")
    .attr("class", "page-title"))
    .append($("<br>"))
    .append($("<div>")
        .attr("id", "homepage")
        .append($("<div>")
            .addClass("current-homepage")
            .html("New tabs open to " + currentUserHomepage)));
    $("#user-settings")
      .append($("<form>")
          .attr("class", "current-homepage")
          .attr("onsubmit", "event.preventDefault()")
          .attr("id", "homepage-form")
          .append($("<input>")
              .attr("value", "new-homepage")
              .attr("type", "radio")
              .attr("checked","checked")
              .attr("name", "newTabCreation"))
          .append("Specific page ")
              .append($("<input>")
                  .attr("id", "new-homepage1")
                  .attr("type", "text")
                  .attr("value", currentUserHomepage)
                  .attr("name", "newTabCreation"))
              .append("<br>")
                  .append($("<input>")
                      .attr("value", "new-homepage2")
                      .attr("type", "radio")
                      .attr("name", "newTabCreation"))
                  .append("Blank page")
                  .append("<br>")
                        .append($("<input>")
                            .attr("value", "new-homepage3")
                            .attr("type", "radio")
                            .attr("name", "newTabCreation"))
                            .append("athenaNet"));
    $("#user-settings")
    .append($("<button>")
        .attr("id", "submit-user-settings")
        .html("save"));
    $("#submit-user-settings").on("click", (): boolean => {
        let submitValue: string = $("input[name=newTabCreation]:checked", "#homepage-form").val();
        console.log("submitValue: " + submitValue);
        if(submitValue === "new-homepage") {
            console.log($("#new-homepage1").val());
            currentUserHomepage = $("#new-homepage1").val();
            console.log("#new-homepage1: " + currentUserHomepage);
            ipcRenderer.send("update-homepage", currentUserHomepage);
            updateHomePage(currentUserHomepage);
            return false;
        } else if (submitValue === "new-homepage2") {
            currentUserHomepage = "about:blank";
            ipcRenderer.send("update-homepage", currentUserHomepage);
            updateHomePage(currentUserHomepage);
            return false;
        } else {
            currentUserHomepage = "athenanet.athenahealth.com";
            ipcRenderer.send("update-homepage", currentUserHomepage);
            updateHomePage(currentUserHomepage);
            return false;
        }
    });
}

function getDeviceStatus(): void {
    let deviceStatus = ipcRenderer.sendSync("get-device-status");
    console.log("DeviceStatus" + deviceStatus.device);
    if(deviceStatus.device === true) {
        $("#dymo-status").css("background-image", `url("svg/huge-green-circle.svg")`);
        console.log("green circle");
    } else {
        $("#dymo-status").css("background-image", `url("svg/huge-yellow-circle.svg")`);
        console.log("yellow circle");
    }
}