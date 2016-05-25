const {Application} = require("spectron");
const {expect} = require("chai");

describe("application launch", function () {
    this.timeout(50000);

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
        waitForExist(".prompt").
        setValue(".prompt", "ls /\n").
        waitForExist(".prompt[contenteditable=false]").
        getText(".job .output").
        then((output) => {
            expect(output[0]).to.contain("usr").and.to.contain("var");
        });
    })
});
