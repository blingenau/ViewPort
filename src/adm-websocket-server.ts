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

        let isTrayAppRunning = (client: ws) => {
            responder(client)("istrayapprunning", true);
        };

        let getApplicationInfo = (client: ws, data: any) => {
            sender(client)("getapplicationinfo", {
                Version: "1.5.1.0"
            });
        };

        let getInstalledModules = (client: ws) => {
            responder(client)("info", {
                Error: false,
                Message: "Success",
                Data: [
                    {
                        Name: "DYMOLabelPrinter",
                        Version: {
                            Name: "1.1.2.1",
                            Persist: false,
                            DeviceConnected: true,
                            DeviceVisible: true
                        }
                    }
                ]
            });
        };

        let getModuleInfo = (client: ws, data: any) => {
            switch (data.module) {
                case "":
                    getInstalledModules(client);
                    break;
                case "AthenanetPerformanceMonitor":
                case "ConfigureMyComputer":
                    break;
                default:
                    console.log(`getModuleInfo: ${data.module}`);
                    break;
            }
        };

        let execDymoLabelPrinter = (client: ws, data: any) => {
            if (data.Action === "IsSoftwareInstalled") {
                // child returns "true" or "false" indicating if dymo is installed
                this.child.stdout.once("data", function (output: any) {
                    eventResponder(client)("dymolabelprinter", data.Callback, {
                        Error: false,
                        Message: "Success",
                        Data: output.toString().replace(/^\s+|\s+$/g, "") === "true"
                    });
                });
                this.child.stdin.write(JSON.stringify(data) + "\0");
            }
        };

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

    public start(): void {
        // this.child = proc.spawn("python",["./src/test.py"]);
        this.child = proc.spawn("./src/bin/dymo/viewport-adm-executable.exe");
        this.httpsServer.listen(config.port, "127.0.0.1");
    }
}