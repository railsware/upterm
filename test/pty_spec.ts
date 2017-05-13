import "mocha";
import {expect} from "chai";
import {PTY} from "../src/PTY";
import {scan} from "../src/shell/Scanner";

describe("PTY", () => {
    it("doesn't interpolate expressions inside single quotes", (done) => {
        let output = "";
        const tokens = scan("echo '$('");

        return new PTY(
            tokens.map(token => token.escapedValue),
            process.env,
            {columns: 80, rows: 30},
            (data: string) => output += data,
            (exitCode: number) => {
                expect(exitCode).to.eq(0);
                done();
            },
        );
    });
});
