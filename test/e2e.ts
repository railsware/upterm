import {Application} from "spectron";
import {expect} from "chai";
import {join} from "path";

const timeout = 50000;

describe("application launch", function () {
    this.timeout(timeout);

    let app: Application;

    beforeEach(async () => {
        app = new Application({path: "node_modules/.bin/electron", args: ["."]});
        await app.start();
        return app.client.waitUntilWindowLoaded();
    });

    afterEach(function () {
        if (app && app.isRunning()) {
            return app.stop();
        }
    });

    it("can execute a command", async function () {
        return app.client.waitForExist(".prompt", timeout).
        setValue(".prompt", "echo expected-text\n").
        waitForExist(".job-header").
        waitForExist(".prompt").
        getText(".job .output").
        then((output) => {
            expect(output).to.contain("expected-text");
        });
    });

    it("send signals via button", async function () {
        return app.client.waitForExist(".prompt", timeout).
        setValue(".prompt", `node ${join(__dirname, "test_files", "print_on_sigterm.js")}\n`).
        waitForExist(".jobMenu", timeout).
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
