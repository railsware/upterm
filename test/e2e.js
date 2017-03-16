const {Application} = require("spectron");
const {expect} = require("chai");
const {join} = require("path");

const timeout = 50000;

describe("application launch", function () {
    this.timeout(timeout);

    let app;

    beforeEach(function () {
        app = new Application({path: "node_modules/.bin/electron", args: ["."]});
        return app.start();
    });

    afterEach(function () {
        if (app && app.isRunning()) {
            return app.stop()
        }
    });

    it("can execute a command", function () {
        return app.client.
        waitUntilWindowLoaded().
        waitForExist(".prompt", timeout).
        setValue(".prompt", "echo expected-text\n").
        waitForExist(".prompt[contenteditable=false]").
        waitForExist(".prompt[contenteditable=true]").
        getText(".job .output").
        then((output) => {
            expect(output[0]).to.contain("expected-text");
        });
    });

    it("send signals via button", function () {
        return app.client.
        waitUntilWindowLoaded().
        waitForExist(".prompt", timeout).
        setValue(".prompt", `node ${join(__dirname, "test_files", "print_on_sigterm.js")}\n`).
        waitForExist(".jobMenu", timeout).
        click(".jobMenu").
        waitForExist(".floatingMenuItem").
        click(".floatingMenuItem:last-of-type").
        click(".jobMenu").
        waitForExist(".floatingMenuItem").
        click(".floatingMenuItem:first-of-type").
        waitForExist(".prompt[contenteditable=true]").
        getText(".job .output").
        then(output => {
            expect(output[0]).to.eql('Received SIGTERM');
        });
    });
});
