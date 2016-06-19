import "mocha";
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

type CSIFinalCharacter = "A" | "B" | "C" | "D" | "E" | "F" | "R" | "m" | "n";

const csi = (params: number[], final: CSIFinalCharacter) => {
    return `\x1b[${params.join(";")}${final}`;
};

const sgr = (params: number[]) => {
    return csi(params, "m");
};

const output = (string: string) => string.slice(1, -1);

describe("ANSI parser", () => {
    let terminal: DummyTerminal;
    let parser: ANSIParser;

    beforeEach(() => {
        terminal = new DummyTerminal();
        parser = new ANSIParser(terminal);
    });

    it("can parse an ASCII string", async() => {
        parser.parse("something");

        expect(terminal.screenBuffer.toString()).to.eql("something");
    });

    describe("movements", () => {
        it("can move down", async() => {
            parser.parse(`first${csi([1], "B")}second`);

            expect(terminal.screenBuffer.toString()).to.eql(output(`
first
     second
`));
        });
    });

    describe("true color", () => {
        it("sets the correct foreground color", async() => {
            parser.parse(`${sgr([38, 2, 255, 100, 0])}A${sgr([0])}`);

            expect(terminal.screenBuffer.toString()).to.eql("A");
            const firstChar = terminal.screenBuffer.at({row: 0, column: 0});
            expect(firstChar.attributes.color).to.eql([255, 100, 0]);
        });
    });

    describe("CSI", () => {
        describe("Device Status Report (DSR)", () => {
            describe("Report Cursor Position (CPR)", () => {
                it("report cursor position", async() => {
                    parser.parse(`some text${csi([6], "n")}`);

                    expect(terminal.screenBuffer.toString()).to.eql("some text");
                    expect(terminal.written).to.eql(`${csi([1, 10], "R")}`);
                });
            });
        });
    });
});
