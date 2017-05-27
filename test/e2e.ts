import {Application, SpectronClient} from "spectron";
import {expect} from "chai";
import {join} from "path";

const timeout = 50000;

class Page {
    private promptSelector = ".prompt";

    constructor(private client: SpectronClient) {}

    waitTillLoaded() {
        return this.client.waitForExist(this.promptSelector);
    }

    executeCommand(command: string) {
        return this.prompt.setValue(`${command}\n`);
    }

    get prompt() {
        return this.client.element(this.promptSelector);
    }

    get jobOutput() {
        return this.client.element(".job .output");
    }
}

describe("application launch", function () {
    this.timeout(timeout);

    let app: Application;
    let page: Page;

    beforeEach(async () => {
        app = new Application({path: "node_modules/.bin/electron", args: ["."]});
        await app.start();
        app.client.waitUntilWindowLoaded();
        page = new Page(app.client);
        return page.waitTillLoaded();
    });

    afterEach(function () {
        if (app && app.isRunning()) {
            return app.stop();
        }
    });

    it("can execute a command", async () => {
        await page.executeCommand("echo expected-text");
        const text = await page.jobOutput.getText();

        expect(text).to.contain("expected-text");
    });

    it("send signals via button", async () => {
        await page.executeCommand(`node ${join(__dirname, "test_files", "print_on_sigterm.js")}`);

        return app.client.waitForExist(".jobMenu", timeout).
        click(".jobMenu").
        waitForExist(".floatingMenuItem").
        click(".floatingMenuItem:last-of-type").
        click(".jobMenu").
        waitForExist(".floatingMenuItem").
        click(".floatingMenuItem:first-of-type").
        waitForExist(".prompt").
        getText(".job .output").
        then(output => {
            expect(output).to.eql("Received SIGTERM");
        });
    });
});
