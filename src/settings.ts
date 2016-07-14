/// <reference path="../typings/index.d.ts" />
import {ipcRenderer} from "electron";

let currentUserHomepage: string = "";
let currentUser: string = "";

window.onload = () => {
  let userObject = ipcRenderer.sendSync("get-user");
  currentUser = userObject.username;
  currentUserHomepage = userObject.homepage;
  $("#user-settings")
    .append($("<div>")
    .html("Welcome " + currentUser));
  $("#user-settings")
    .append($("<div>")
    .attr("id", "homepage")
      .append($("<div>")
      .addClass("current-homepage")
      .html("Homepage: " + currentUserHomepage)));
  $("#user-settings")
    .append($("<form>")
      .attr("id", "homepage-form")
        .append($("<input>").attr("id", "new-homepage").attr("type", "text")));
  $("#user-settings")
    .append($("<button>")
    .attr("id", "submit-user-settings")
    .html("save"));

  $(document).ready(function () {
    $("#submit-user-settings").on("click", (): boolean => {
            console.log($("#new-homepage").val());
            currentUserHomepage = $("#new-homepage").val();
            ipcRenderer.send("update-homepage", currentUserHomepage);
            $("#homepage").empty();
            $("#homepage")
                .append($("<div>")
                    .addClass("current-homepage")
                    .html("Homepage: " + currentUserHomepage));
            return false;
    });
  });
};
