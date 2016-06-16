import "mocha";
import {expect} from "chai";
import {PTY} from "../src/PTY";

describe("PTY", () => {
    it("doesn't interpolate expressions inside single quotes", (done) => {
        let output = "";
        new PTY(
            "echo", ["'$('"], process.env, {columns: 80, rows: 30},
            (data: string) => output += data,
            (exitCode: number) => {
                expect(exitCode).to.eq(0);
                done();
            }
        );
    });
});
