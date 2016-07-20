import * as crypto from "crypto";
import * as fs from "fs";
import * as http from "http";
import * as https from "https";
import * as url from "url";
import * as ws from "ws";

const Subscribe = "0x12c";
const Unsubscribe = "0x12d";
const Opened = "0xc8";

const config = {
    pfx: fs.readFileSync(`${__dirname}/ssl/ADM.pfx`),
    passphrase: "today is xsockets day",
    port: 46000
};

export class AdmWebsocketServer {
    private httpsServer: https.Server;
    private websocketServer: ws.Server;

    constructor() {
        let handleRequest = (request: http.IncomingMessage, response: http.ServerResponse): void => {
            console.log(`request: ${JSON.stringify(request, ["method", "url"], 4)}`);
            response.writeHead(200);
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
                    response: response
                }));
            };
        };

        let isTrayAppRunning = (client: ws) => {
            responder(client)("istrayapprunning", true);
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
                switch (request.event) {
                    case Subscribe:
                    case Unsubscribe:
                        break;
                    case "istrayapprunning":
                        isTrayAppRunning(client);
                        break;
                    default:
                        console.log(`message: ${data}`);
                        break;
                }
            };
        };

        let handleConnection = (client: ws): void => {
            const location = url.parse(client.upgradeReq.url, true);
            console.log(`connection: ${JSON.stringify(location, null, 4)}`);

            client.on("message", handleMessage(client));
            client.on("open", () => console.log("open"));
            client.on("error", err => {
                console.log(`error: ${JSON.stringify(err, null, 4)}`);
            });
            client.on("close", (code, message) => {
                console.log(`close: ${code} - ${message}`);
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
        this.websocketServer = new ws.Server({
            server: <any>(this.httpsServer)
        });
        this.websocketServer.on("connection", handleConnection);
    }

    public start(): void {
        this.httpsServer.listen(config.port, "127.0.0.1");
    }
}