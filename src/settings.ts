/// <reference path="../typings/index.d.ts" />
import {ipcRenderer} from "electron";
let currentUserHomepage: string = "";
let currentUser: string = "";

window.onload = () => {
  let userObject = ipcRenderer.sendSync("get-user");
  currentUser = userObject.username;
  currentUserHomepage = userObject.homepage;
  createUserSettings();
  $("#user-settings")
      .append($("<button>")
      .attr("id", "submit-user-settings")
      .css("font", "Helvetica Nueve")
      .html("save"));

  $(document).ready(function () {
      highlightSelection("#user");
      $("#device").on("click", (): void => {
          highlightSelection("#device");
          $("#user-settings").empty();
          console.log("here");
          $("#user-settings")
            .append($("<br><br><br>"))
            .append($("<div> ADM Settings </div>")
                .attr("id", "deviceInformation")
                .attr("class", "page-title"));
      });

      $("#user").on("click", (): void => {
          highlightSelection("#user");
          $("#user-settings").empty();
          createUserSettings();
      });
      $("#administrator").on("click", (): void => {
          highlightSelection("#administrator");
          $("#user-settings").empty();
          $("#user-settings")
            .append($("<br><br><br>"))
            .append($("<div> Administrator Settings </div>")
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
    .append($("<div> User: " + currentUser + "</div>")
        .attr("id", "username"))
    .append($("<br><br>"))
    .append($("<div> User </div>")
        .attr("id", "user"))
    .append($("<br>"))
    .append($("<div> Device </div>")
        .attr("id", "device"))
    .append($("<br>"))
    .append($("<div> Administrator <div>")
        .attr("id", "administrator"));
};

function highlightSelection(selected: string): void {
    $("#device").css("color", "#CCCCCC");
    $("#user").css("color", "#CCCCCC");
    $("#administrator").css("color", "#CCCCCC");
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
}