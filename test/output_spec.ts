/// <reference path="../typings/Interfaces.d.ts" />

import "mocha";
import {expect} from "chai";
import {Output} from "../src/Output";
import {TerminalLikeDevice} from "../src/Interfaces";
import {readFileSync} from "fs";

class DummyTerminal implements TerminalLikeDevice {
    output: Output;
    written = "";
    write = (input: string) => this.written += input;

    constructor(dimensions: Dimensions = {columns: 80, rows: 80}) {
        this.output = new Output(this, dimensions);
    }
}

type CSIFinalCharacter = "A" | "B" | "C" | "D" | "E" | "F" | "R" | "m" | "n";

const esc = `\x1b`;
const ri = `${esc}M`;
const ich = `${esc}[1@`;
const dl = (rows: number) => `${esc}[${rows}M`;
const dch = (n: number) => `${esc}[${n}P`;
const cup = (row: number, column: number) => `${esc}[${row};${column}H`;
const decsel = (param: number) => `${esc}[${param}K`;
const decstbm = (topMargin: number, bottomMargin: number) => `${esc}[${topMargin};${bottomMargin}r`;
const csi = (params: number[], final: CSIFinalCharacter) => {
    return `${esc}[${params.join(";")}${final}`;
};

const sgr = (params: number[]) => {
    return csi(params, "m");
};

describe("Output", () => {
    it("contains the first row even if there was no input (to show cursor on)", () => {
        const terminal = new DummyTerminal({columns: 5, rows: 5});

        expect(terminal.output.toLines()).to.eql([
            "     ",
        ]);
    });

    it("wraps long strings", () => {
        const terminal = new DummyTerminal({columns: 5, rows: 5});
        terminal.output.write("0123456789");

        expect(terminal.output.toLines()).to.eql([
            "01234",
            "56789",
        ]);
    });

    describe("movements", () => {
        it("can move down", () => {
            const terminal = new DummyTerminal({columns: 11, rows: 2});
            terminal.output.write(`first${csi([1], "B")}second`);

            expect(terminal.output.toLines()).to.eql([
                "first      ",
                "     second",
            ]);
        });

        it("stays at the same line after writing last column character", () => {
            const terminal = new DummyTerminal({columns: 10, rows: 5});
            terminal.output.write(`${esc}[1;10H*${esc}[5D*`);

            expect(terminal.output.toString()).to.eql("    *    *");
            expect(terminal.output.toString()).to.eql("    *    *");
        });

        it("doesn't move outside of the current page", () => {
            const terminal = new DummyTerminal({columns: 10, rows: 5});
            terminal.output.write(`1\r\n2\r\n3\r\n4\r\n5\r\n6\r\n7${esc}[1;1H42`);

            expect(terminal.output.toLines()).to.eql([
                "1         ",
                "2         ",
                "42        ",
                "4         ",
                "5         ",
                "6         ",
                "7         ",
            ]);
        });

        describe("Reverse Index", () => {
            it("scrolls down when cursor is at the beginning of page", () => {
                const terminal = new DummyTerminal({columns: 10, rows: 5});
                terminal.output.write(`1\r\n2\r\n3\r\n4\r\n5\r\n6\r\n7${cup(1, 1)}${ri}`);

                expect(terminal.output.toLines()).to.eql([
                    "1         ",
                    "2         ",
                    "          ",
                    "3         ",
                    "4         ",
                    "5         ",
                    "6         ",
                ]);
            });

            it("scrolls down scrolling region", () => {
                const terminal = new DummyTerminal({columns: 10, rows: 5});
                terminal.output.write(`1\r\n2\r\n3\r\n4\r\n5\r\n6\r\n7${decstbm(1, 3)}${cup(1, 1)}${ri}`);

                expect(terminal.output.toLines()).to.eql([
                    "1         ",
                    "2         ",
                    "          ",
                    "3         ",
                    "4         ",
                    "6         ",
                    "7         ",
                ]);
            });
        });
    });

    it("can parse an ASCII string", () => {
        const terminal = new DummyTerminal();
        terminal.output.write("something");

        expect(terminal.output.toString().trim()).to.eql("something");
    });

    it("ICH", () => {
        const terminal = new DummyTerminal();
        terminal.output.write(`123${cup(1, 1)}${ich}0`);

        expect(terminal.output.toString().trim()).to.eql("0123");
    });

    describe("true color", () => {
        it("sets the correct foreground color", () => {
            const terminal = new DummyTerminal();
            terminal.output.write(`${sgr([38, 2, 255, 100, 0])}A${sgr([0])}`);

            const firstChar = terminal.output.activeBuffer.at({rowIndex: 0, columnIndex: 0});
            expect(firstChar.attributes.color).to.eql([255, 100, 0]);
        });
    });

    it("uses default attributes to fill in new lines", () => {
        const terminal = new DummyTerminal();
        terminal.output.write(`${sgr([46])}${cup(2, 1)}`);

        const firstChar = terminal.output.activeBuffer.at({rowIndex: 1, columnIndex: 0});
        expect(firstChar.attributes.backgroundColor).to.eql(0);
    });

    describe("CSI", () => {
        describe("Device Status Report (DSR)", () => {
            describe("Report Cursor Position (CPR)", () => {
                it("report cursor position", () => {
                    const terminal = new DummyTerminal();
                    terminal.output.write(`some text${csi([6], "n")}`);

                    expect(terminal.written).to.eql(`${csi([1, 10], "R")}`);
                });
            });
        });

        describe("DL", () => {
            // A temporary test. Can be removed when we have a test for the real behavior.
            it("doesn't fail", () => {
                const terminal = new DummyTerminal({columns: 10, rows: 5});
                const input = `1\r\n2\r\n3${cup(3, 1)}${dl(1)}`;
                terminal.output.write(input);

                terminal.output.toLines();
            });
        });

        describe("DCH", () => {
            it("Removes chars from cursor position", () => {
                const terminal = new DummyTerminal({columns: 10, rows: 5});
                const input = `1234567890${cup(1, 2)}${dch(2)}`;
                terminal.output.write(input);

                expect(terminal.output.toLines()).to.deep.equal([
                    "14567890  ",
                ]);
            });
        });

        describe("DECSEL", () => {
            it("Erases line to right", () => {
                const terminal = new DummyTerminal({columns: 10, rows: 5});
                const input = `1234567890${cup(1, 5)}${decsel(0)}`;
                terminal.output.write(input);

                expect(terminal.output.toLines()).to.deep.equal([
                    "1234      ",
                ]);
            });
        });
    });

    describe("vttest", () => {
        function vttest(fileName: string, expectedOutput: string[]) {
            const input = readFileSync(`${__dirname}/test_files/vttest/${fileName}`).toString();

            return it(fileName, () => {
                const terminal = new DummyTerminal();
                terminal.output.write(input);
                const actualOutput = terminal.output.toLines();

                expect(actualOutput).to.deep.equal(expectedOutput);
            });
        }

        describe("cursor movements", () => {
            vttest("1-1", [
                "********************************************************************************",
                "*++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++*",
                "*+                                                                            +*",
                "*+                                                                            +*",
                "*+                                                                            +*",
                "*+                                                                            +*",
                "*+                                                                            +*",
                "*+                                                                            +*",
                "*+        EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE        +*",
                "*+        E                                                          E        +*",
                "*+        E The screen should be cleared,  and have an unbroken bor- E        +*",
                "*+        E der of *'s and +'s around the edge,   and exactly in the E        +*",
                "*+        E middle  there should be a frame of E's around this  text E        +*",
                "*+        E with  one (1) free position around it.    Push <RETURN>  E        +*",
                "*+        E                                                          E        +*",
                "*+        EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE        +*",
                "*+                                                                            +*",
                "*+                                                                            +*",
                "*+                                                                            +*",
                "*+                                                                            +*",
                "*+                                                                            +*",
                "*+                                                                            +*",
                "*++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++*",
                "********************************************************************************",
                "                                                                                ",
                "                                                                                ",
                "                                                                                ",
                "                                                                                ",
                "                                                                                ",
                "                                                                                ",
                "                                                                                ",
                "                                                                                ",
                "                                                                                ",
                "                                                                                ",
                "                                                                                ",
                "                                                                                ",
            ]);

            vttest("1-2", [
                "************************************************************************************************************************************",
                "*++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++*",
                "*+                                                                                                                                +*",
                "*+                                                                                                                                +*",
                "*+                                                                                                                                +*",
                "*+                                                                                                                                +*",
                "*+                                                                                                                                +*",
                "*+                                                                                                                                +*",
                "*+                                  EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE                                  +*",
                "*+                                  E                                                          E                                  +*",
                "*+                                  E The screen should be cleared,  and have an unbroken bor- E                                  +*",
                "*+                                  E der of *'s and +'s around the edge,   and exactly in the E                                  +*",
                "*+                                  E middle  there should be a frame of E's around this  text E                                  +*",
                "*+                                  E with  one (1) free position around it.    Push <RETURN>  E                                  +*",
                "*+                                  E                                                          E                                  +*",
                "*+                                  EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE                                  +*",
                "*+                                                                                                                                +*",
                "*+                                                                                                                                +*",
                "*+                                                                                                                                +*",
                "*+                                                                                                                                +*",
                "*+                                                                                                                                +*",
                "*+                                                                                                                                +*",
                "*++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++*",
                "************************************************************************************************************************************",
                "                                                                                                                                    ",
                "                                                                                                                                    ",
                "                                                                                                                                    ",
                "                                                                                                                                    ",
                "                                                                                                                                    ",
                "                                                                                                                                    ",
                "                                                                                                                                    ",
                "                                                                                                                                    ",
                "                                                                                                                                    ",
                "                                                                                                                                    ",
                "                                                                                                                                    ",
                "                                                                                                                                    ",
            ]);

            vttest("1-3", [
                "Test of autowrap, mixing control and print characters.                          ",
                "The left/right margins should have letters in order:                            ",
                "I                                                                              i",
                "J                                                                              j",
                "K                                                                              k",
                "L                                                                              l",
                "M                                                                              m",
                "N                                                                              n",
                "O                                                                              o",
                "P                                                                              p",
                "Q                                                                              q",
                "R                                                                              r",
                "S                                                                              s",
                "T                                                                              t",
                "U                                                                              u",
                "V                                                                              v",
                "W                                                                              w",
                "X                                                                              x",
                "Y                                                                              y",
                "Z                                                                              z",
                "                                                                                ",
                "Push <RETURN>                                                                   ",
                "                                                                                ",
            ]);

            vttest("1-4", [
                "Test of autowrap, mixing control and print characters.                                                                              ",
                "The left/right margins should have letters in order:                                                                                ",
                "I                                                                                                                                  i",
                "J                                                                                                                                  j",
                "K                                                                                                                                  k",
                "L                                                                                                                                  l",
                "M                                                                                                                                  m",
                "N                                                                                                                                  n",
                "O                                                                                                                                  o",
                "P                                                                                                                                  p",
                "Q                                                                                                                                  q",
                "R                                                                                                                                  r",
                "S                                                                                                                                  s",
                "T                                                                                                                                  t",
                "U                                                                                                                                  u",
                "V                                                                                                                                  v",
                "W                                                                                                                                  w",
                "X                                                                                                                                  x",
                "Y                                                                                                                                  y",
                "Z                                                                                                                                  z",
                "                                                                                                                                    ",
                "Push <RETURN>                                                                                                                       ",
                "                                                                                                                                    ",
            ]);

            vttest("1-5", [
                "Test of cursor-control characters inside ESC sequences.                         ",
                "Below should be four identical lines:                                           ",
                "                                                                                ",
                "A B C D E F G H I                                                               ",
                "A B C D E F G H I                                                               ",
                "A B C D E F G H I                                                               ",
                "A B C D E F G H I                                                               ",
                "                                                                                ",
                "Push <RETURN>                                                                   ",
                "                                                                                ",
            ]);

            vttest("1-6", [
                "Test of leading zeros in ESC sequences.                                         ",
                'Two lines below you should see the sentence "This is a correct sentence".       ',
                "                                                                                ",
                "This is a correct sentence                                                      ",
                "                                                                                ",
                "                                                                                ",
                "                                                                                ",
                "                                                                                ",
                "                                                                                ",
                "                                                                                ",
                "                                                                                ",
                "                                                                                ",
                "                                                                                ",
                "                                                                                ",
                "                                                                                ",
                "                                                                                ",
                "                                                                                ",
                "                                                                                ",
                "                                                                                ",
                "Push <RETURN>                                                                   ",
                "                                                                                ",
            ]);

            vttest("2-1", [
                "********************************************************************************",
                "********************************************************************************",
                "********************************************************************************",
                "                                                                                ",
                "This should be three identical lines of *'s completely filling                  ",
                "the top of the screen without any empty lines between.                          ",
                "(Test of WRAP AROUND mode setting.)                                             ",
                "Push <RETURN>                                                                   ",
                "                                                                                ",
            ]);

            vttest("2-2", [
                "      *     *     *     *     *     *     *     *     *     *     *     *     * ",
                "      *     *     *     *     *     *     *     *     *     *     *     *     * ",
                "                                                                                ",
                "Test of TAB setting/resetting. These two lines                                  ",
                "should look the same. Push <RETURN>                                             ",
                "                                                                                ",
            ]);

            vttest("2-15", [
                "AAAAA                                                                           ",
                "AAAAA                                                                           ",
                "AAAAA                                                                           ",
                "AAAAA                                                                           ",
                "                                                                                ",
                "                                                                                ",
                "                                                                                ",
                "           normal      bold        underscored blinking    reversed             ",
                "                                                                                ",
                "stars:     **********  **********  **********  **********  **********           ",
                "                                                                                ",
                "line:      ──────────  ──────────  ──────────  ──────────  ──────────           ",
                "                                                                                ",
                "x'es:      xxxxxxxxxx  xxxxxxxxxx  xxxxxxxxxx  xxxxxxxxxx  xxxxxxxxxx           ",
                "                                                                                ",
                "diamonds:  ◆◆◆◆◆◆◆◆◆◆  ◆◆◆◆◆◆◆◆◆◆  ◆◆◆◆◆◆◆◆◆◆  ◆◆◆◆◆◆◆◆◆◆  ◆◆◆◆◆◆◆◆◆◆           ",
                "                                                                                ",
                "                                                                                ",
                "                                                                                ",
                "                                                                                ",
                "Test of the SAVE/RESTORE CURSOR feature. There should                           ",
                "be ten characters of each flavour, and a rectangle                              ",
                "of 5 x 4 A's filling the top left of the screen.                                ",
                "Push <RETURN>                                                                   ",
                "                                                                                ",
            ]);
        });
    });
});
