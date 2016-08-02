import * as crypto from "crypto";
import * as fs from "fs";
import * as http from "http";
import * as https from "https";
import * as ws from "ws";
import * as proc from "child_process";
// import * as url from "url";

const Subscribe = "0x12c";
const Unsubscribe = "0x12d";
const Opened = "0xc8";

const config = {
    pfx: fs.readFileSync(`${__dirname}/ssl/viewport.pfx`),
    passphrase: "today is xsockets day",
    port: 46000
};

export class AdmWebSocketServer {
    private httpsServer: https.Server;
    private webSocketServer: ws.Server;
    private child: proc.ChildProcess;

    constructor() {
        let handleRequest = (request: http.IncomingMessage, response: http.ServerResponse): void => {
            response.writeHead(200);
            response.write(`ADM web server\n${request.method} ${request.url}`);
            response.end();
        };

        let sender = (client: ws) => {
            return (event: string, data: any): void => {
                client.send(JSON.stringify({
                    event: event,
                    data: JSON.stringify(data)
                }));
            };
        };

        let responder = (client: ws) => {
            return (event: string, response: any): void => {
                sender(client)(event, JSON.stringify({
                    response: JSON.stringify(response)
                }));
            };
        };

        let eventResponder = (client: ws) => {
            return (module: string, event: string, data: any): void => {
                let encodedData = JSON.stringify(data);

                let hash = crypto.createHash("md5");
                hash.update(encodedData);
                let encodedDataChecksum = hash.digest("hex");

                sender(client)(module, JSON.stringify({
                    eventname: event,
                    data: encodedData,
                    checksum: encodedDataChecksum,
                    chunknum: 0,
                    totalchunks: 1
                }));
            };
        };

        /**
         * Spoofs the message from the ADM tray app saying it's running.
         * Athenanet requires this message in order to use any device functionality.
         */
        let isTrayAppRunning = (client: ws) => {
            responder(client)("istrayapprunning", true);
        };

        /**
         * Spoofs the ADM version. Needs to be the latest version or Athenanet will
         * require you to update ADM.
         * 
         * @todo Replace the hardcoded version with some function call that gets
         *       the latest version of ADM.
         */
        let getApplicationInfo = (client: ws, data: any) => {
            sender(client)("getapplicationinfo", {
                Version: "1.5.1.0"
            });
        };

        /**
         * Responds with all installed modules. Currently hardcoded to return DYMOLabelPrinter.
         * 
         * @todo Actually search for all installed modules. Perhaps by checking the modules folder
         *       for installed dll's with the names of devices.
         */
        let getInstalledModules = (client: ws) => {
            let id: string = crypto.randomBytes(16).toString("hex");
            let customData = {
                id: id,
                message: JSON.stringify({Action: "Status"})
            };
            this.child.stdout.once(id, function (response: string) {
               // response is "0" device is not connected or "1" device is connected
                responder(client)("info", {
                Error: false,
                Message: "Success",
                Data: [
                    {
                        Name: "DYMOLabelPrinter",
                        Version: {
                            Name: "1.1.2.1",
                            Persist: false,
                            DeviceConnected: response.includes("1"),
                            DeviceVisible: true
                        }
                    }
                ]
                });
            });
            this.child.stdin.write(JSON.stringify(customData) + "\n");
        };

        /**
         * Gets the installed status of a device or all devices. Empty string as the module
         * signifies all devices. Currently Only handles DYMOLabelPrinter and all devices,
         * but both cases call the same function.
         * 
         * @todo Write a getModuleInfo for DYMOLabelPrinter.
         * @todo Once more devices are supported, write functions for them too.
         */
        let getModuleInfo = (client: ws, data: any) => {
            switch (data.module) {
                case "DYMOLabelPrinter":
                    getInstalledModules(client);
                    break;
                case "":
                    getInstalledModules(client);
                    break;
                case "AthenanetPerformanceMonitor":
                case "ConfigureMyComputer":
                    break;
                default:
                    break;
            }
        };

        /**
         * Responsible for executing commands related to the DYMOLabelPrinter. Corresponds
         * to actual method calls within the DYMO dll.
         */
        let execDymoLabelPrinter = (client: ws, data: any) => {
            let id: string = crypto.randomBytes(16).toString("hex");
            let customData = {
                id: id,
                message: JSON.stringify(data)
            };

            if (data.Action === "IsSoftwareInstalled") {
                // child returns "true" or "false" indicating if dymo is installed
                this.child.stdout.once(id,  function (response: string) {
                    eventResponder(client)("dymolabelprinter", data.Callback, {
                        Error: false,
                        Message: "Success",
                        Data: response.includes("True")
                    });
                });
            } else if (data.Action === "Print") {
                this.child.stdout.once("data", function (response: string) {
                    response = response.includes("null") ? "" : response;
                    eventResponder(client)("dymolabelprinter", data.Callback, {
                        Error: false,
                        Message: "Success",
                        Data: response
                    });
                });
            }
            this.child.stdin.write(JSON.stringify(customData) + "\n");
        };

        /**
         * Switch case for execution commands of the various modules.
         * 
         * @todo Once other devices are supported add them and write their
         *       respective functions.
         */
        let execModule = (client: ws, data: any) => {
            switch (data.Module) {
                case "DYMOLabelPrinter":
                    execDymoLabelPrinter(client, data);
                    break;
                default:
                    console.log(`execModule: ${data.Module}`);
            }
        };

        let handleMessage = (client: ws) => {
            return (data: any, flags: {binary: boolean}): void => {
                if (typeof data !== "string") {
                    console.log("invalid message received");
                }

                let request = JSON.parse(data);
                if (!request.event) {
                    console.log("request is missing event field");
                    return;
                }
                let requestData = (request.data) ? JSON.parse(request.data) : null;

                switch (request.event) {
                    case Subscribe:
                    case Unsubscribe:
                        break;
                    case "istrayapprunning":
                        isTrayAppRunning(client);
                        break;
                    case "getapplicationinfo":
                        getApplicationInfo(client, requestData);
                        break;
                    case "info":
                        getModuleInfo(client, requestData);
                        break;
                    case "exec":
                        execModule(client, requestData);
                        break;
                    default:
                        console.log(`message: ${data}`);
                        break;
                }
            };
        };

        let handleConnection = (client: ws): void => {
            // const location = url.parse(client.upgradeReq.url, true);
            // console.log(`connection: ${JSON.stringify(location, null, 4)}`);

            client.on("message", handleMessage(client));
            client.on("open", () => console.log("open"));
            client.on("error", err => {
                console.log(`error: ${JSON.stringify(err, null, 4)}`);
            });
            client.on("close", (code, message) => {
                // console.log(`close: ${code} - ${message}`);
            });

            // send opening handshake
            let uuid = () => crypto.randomBytes(16).toString("hex");
            sender(client)(Opened, {
                ClientGuid: uuid(),
                StorageGuid: uuid()
            });
        };

        this.httpsServer = https.createServer({
                pfx: config.pfx,
                passphrase: config.passphrase
            }, handleRequest);
        this.httpsServer.on("error", (err: any) => {
            console.log(`HTTPS server error: ${JSON.stringify(err, null, 4)}`);
        });
        this.httpsServer.on("listening", () => {
            this.webSocketServer = new ws.Server({
                server: <any>(this.httpsServer)
            });
            this.webSocketServer.on("connection", handleConnection);
            this.webSocketServer.on("error", (err: any) => {
                console.log(`WebSocket server error: ${JSON.stringify(err, null, 4)}`);
            });
        });
    }
    public getChild(): proc.ChildProcess {
        return this.child;
    }
    public start(): void {
        this.child = proc.spawn(`${__dirname}/bin/dymo/viewport-adm-executable.exe`);
        let self = this;
        this.child.stdout.on("data", function (output: any) {
            output = JSON.parse(output);
            if (!self.child.stdout.emit(output.id, output.response)) {
                console.log("id not found");
            }
        });
        this.child.on("exit", () => {
            console.log("CHILD EXITED!");
        });
        this.child.stderr.on("data", (data: any) => {
            console.log("ERROR: "+ data.toString());
        });
        this.httpsServer.listen(config.port, "127.0.0.1");
    }
}