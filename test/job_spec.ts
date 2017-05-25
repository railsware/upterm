import "mocha";
import {expect} from "chai";
import {Job} from "../src/shell/Job";
import {Session} from "../src/shell/Session";
import {Aliases} from "../src/shell/Aliases";
import {PluginManager} from "../src/PluginManager";
import {isEqual} from "lodash";
import {Prompt} from "../src/shell/Prompt";

describe("Job", () => {
    it.only("runs interceptors", async () => {
        let calls = 0;
        PluginManager.registerCommandInterceptorPlugin({
            isApplicable: ({ command }) => isEqual(command, ["test1"]),
            intercept: (_) => {
                calls++;
                return undefined as any;
            },
        });
        const session = { aliases: new Aliases({}), environment: { pwd: "test" } } as any as Session;
        const prompt = new Prompt(session);
        prompt.setValue("test1");
        const job = new Job(session, prompt);
        await job.execute();
        expect(calls).to.eql(1);
    });

    it("doesn't run interceptors if user has an alias for the current command", async () => {
        let calls = 0;
        PluginManager.registerCommandInterceptorPlugin({
            isApplicable: ({ command }) => isEqual(command, ["test2"]),
            intercept: (_) => {
                calls++;
                return undefined as any;
            },
        });
        const session = { aliases: new Aliases({ test2: "not test2" }), environment: { pwd: "test" } } as any as Session;
        const prompt = new Prompt(session);
        prompt.setValue("test2");
        const job = new Job(session, prompt);
        job.handleError = () => undefined;
        await job.execute();
        expect(calls).to.eql(0);
    });
});
