/// <reference path="../typings/index.d.ts" />
const ipcRenderer = require("electron").ipcRenderer;

let currentUserHomepage: string = "broke.com";
let currentUser: string = "broke-guy";

window.onload = () => {
  let userObject = ipcRenderer.sendSync("get-user", "ping");
  currentUser = userObject.username;
  currentUserHomepage = userObject.homepage;
  $("#username").append($("<div>").html("Welcome " + currentUser));
  $("#homepage").append($("<div>").addClass("current-homepage").html("Homepage: " + currentUserHomepage));
  $("#submit-user-settings").on("click", (): boolean => {
            console.log($("#new-homepage").val());
            currentUserHomepage = $("#new-homepage").val();
            ipcRenderer.send("update-homepage", currentUserHomepage);
            $("#homepage").empty();
            $("#homepage")
                .append($("<div>")
                    .addClass("current-homepage")
                    .html(currentUserHomepage));
            return false;
});

};
