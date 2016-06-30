import "mocha";
import {expect} from "chai";
import {Environment} from "../src/shell/Environment";

describe("EnvironmentPath", () => {
    describe("input method", () => {
        it("prepend", async() => {
            const environment = new Environment({});

            environment.path.prepend("/usr/bin");
            environment.path.prepend("/usr/local/bin");

            expect(environment.toObject()).to.eql({
                PATH: "/usr/local/bin:/usr/bin",
            });
        });
    });
});
