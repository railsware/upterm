import {expect} from "chai";
import {ScreenBuffer} from "../src/ScreenBuffer";
import {ANSIParser} from "../src/ANSIParser";
import {TerminalLikeDevice} from "../src/Interfaces";

class DummyTerminal implements TerminalLikeDevice {
    screenBuffer = new ScreenBuffer();
    dimensions = {columns: 80, rows: 24};
    written = "";
    write = (input: string) => this.written += input;
}

describe.only("ANSI parser", () => {
    it("can parse an ASCII string", async() => {
        let terminal = new DummyTerminal();
        let parser = new ANSIParser(terminal);

        parser.parse("something");

        expect(terminal.screenBuffer.toString()).to.eql("something");
    });
});
