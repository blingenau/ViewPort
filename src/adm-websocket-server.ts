import * as fs from "fs";
import * as http from "http";
import * as https from "https";
import * as url from "url";
import * as ws from "ws";

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
            console.log("request");
            response.writeHead(200);
            response.end();
        };

        let handleMessage = (data: any, flags: {binary: boolean}): void => {
            console.log(`message: ${JSON.stringify(data, null, 4)}`);
        };

        let handleConnection = (client: ws): void => {
            const location = url.parse(client.upgradeReq.url, true);
            console.log(`connection; location: ${JSON.stringify(location, null, 4)}`);

            client.on("message", handleMessage);
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