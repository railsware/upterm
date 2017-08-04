import {remote} from "electron";
import * as https from "https";

export class UpdatesService {
    isAvailable = false;
    private currentVersion: string;
    private INTERVAL = 1000 * 60 * 60 * 12;

    constructor() {
        if (process.env.NODE_ENV === "test") {
            return;
        }

        this.currentVersion = "v" + remote.app.getVersion();
        this.checkUpdate();
        setInterval(() => this.checkUpdate(), this.INTERVAL);
    }

    private checkUpdate() {
        https.get(
            {
                host: "api.github.com",
                path: "/repos/railsware/upterm/releases/latest",
                headers: {
                    "User-Agent": "Upterm",
                },
            },
            (response) => {
                let body = "";
                response.on("data", data => body += data);
                response.on("end", () => {
                    const parsed = JSON.parse(body);
                    this.isAvailable = parsed.tag_name !== this.currentVersion;
                });
            },
        );
    }
}
