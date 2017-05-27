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

    get job() {
        return new Job(this.client, this.client.element(".job"));
    }

    get statusBar() {
        return new StatusBar(this.client, this.client.element(".status-bar"));
    }
}

abstract class Block {
    constructor(
        protected client: SpectronClient,
        protected selector: WebdriverIO.Client<WebdriverIO.RawResult<WebdriverIO.Element>> & WebdriverIO.RawResult<WebdriverIO.Element>,
    ) {}
}

class Job extends Block {
    get output() {
        return this.selector.element(".output");
    }

    get menu() {
        return new JobMenu(this.client, this.selector.element(".jobMenu"));
    }
}

class JobMenu extends Block {
    get sigkillItem() {
        return this.client.element(".floatingMenuItem:first-of-type");
    }

    get sigtermItem() {
        return this.client.element(".floatingMenuItem:last-of-type");
    }

    open() {
        return this.selector.click();
    }
}

class StatusBar extends Block {
    get presentDirectory() {
        return this.selector.element(".present-directory");
    }
}

describe("application launch", function () {
    this.timeout(timeout);

    let app: Application;
    let page: Page;

    before(async () => {
        app = new Application({path: "node_modules/.bin/electron", args: ["."]});
    });

    beforeEach(async () => {
        if (app.isRunning()) {
            await app.restart();
        } else {
            await app.start();
        }

        await app.client.waitUntilWindowLoaded();
        page = new Page(app.client);
        return page.waitTillLoaded();
    });

    after(() => {
        if (app.isRunning()) {
            return app.stop();
        }
    });

    it("can execute a command", async () => {
        await page.executeCommand("echo expected-text");
        const output = await page.job.output.getText();

        expect(output).to.contain("expected-text");
    });

    it("send signals via button", async () => {
        await page.executeCommand(`node ${join(__dirname, "test_files", "print_on_sigterm.js")}`);

        await page.job.menu.open();
        await page.job.menu.sigtermItem.click();

        await page.job.menu.open();
        await page.job.menu.sigkillItem.click();

        const output = await page.job.output.getText();
        expect(output).to.eql("Received SIGTERM");
    });

    describe("status bar", () => {
        it("changes working directory on cd", async () => {
            const oldDirectory = __dirname + "/";
            const newDirectory = join(oldDirectory, "utils") + "/";

            await page.executeCommand(`cd ${oldDirectory}`);
            expect(await page.statusBar.presentDirectory.getText()).to.eql(oldDirectory);

            await page.executeCommand(`cd ${newDirectory}`);
            expect(await page.statusBar.presentDirectory.getText()).to.eql(newDirectory);
        });
    });
});
