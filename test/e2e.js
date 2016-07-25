const {Application} = require("spectron");
const {expect} = require("chai");

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
        setValue(".prompt", "ls /\n").
        waitForExist(".prompt[contenteditable=false]").
        waitForExist(".prompt[contenteditable=true]").
        getText(".job .output").
        then((output) => {
            expect(output[0]).to.contain("usr").and.to.contain("var");
        });
    })
});
