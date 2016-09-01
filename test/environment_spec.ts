import "mocha";
import {expect} from "chai";
import {Environment, preprocessEnv} from "../src/shell/Environment";

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

    describe("environment preprocessor", () => {
        it("preprocesses bash functions", () => {
            expect(preprocessEnv([
                "BASH_FUNC_foo%%=() if 0; then",
                " x",
                " else",
                " y",
                " fi",
                "}",
                "var=val",
            ])).to.eql([
                "BASH_FUNC_foo%%=() if 0; then\n x\n else\n y\n fi\n}",
                "var=val",
            ]);
        });
    });
});
