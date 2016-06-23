const os = require("os");
document.getElementById("id1").innerHTML = os.cpus()[0].model;
document.getElementById("id2").innerHTML = "Time Idle: " + os.cpus()[0].times.idle + " milliseconds";
document.getElementById("id3").innerHTML = "Time IRQ: " + os.cpus()[0].times.irq + " milliseconds";
document.getElementById("id4").innerHTML = "Time Nice: " + os.cpus()[0].times.nice + " milliseconds";
document.getElementById("id5").innerHTML = "Time Sys: " + os.cpus()[0].times.sys + " milliseconds";
document.getElementById("id6").innerHTML = "Time User: " + os.cpus()[0].times.user + " milliseconds";

document.getElementById("id7").innerHTML = "Home Directory: " + os.userInfo().homedir;
document.getElementById("id8").innerHTML = "Username: " + os.userInfo().username;
document.getElementById("id9").innerHTML = "Operating System Name: " + os.type();
document.getElementById("id10").innerHTML = "Total Memory: " + os.totalmem() + " bytes";
document.getElementById("id11").innerHTML = "OS Release: " + os.release();
