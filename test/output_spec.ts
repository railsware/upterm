import "mocha";
import {expect} from "chai";
import {Output} from "../src/Output";
import {TerminalLikeDevice} from "../src/Interfaces";
import {readFileSync} from "fs";

class DummyTerminal implements TerminalLikeDevice {
    output: Output = new Output(this, {columns: 90, rows: 40});
    written = "";
    write = (input: string) => this.written += input;
}

type CSIFinalCharacter = "A" | "B" | "C" | "D" | "E" | "F" | "R" | "m" | "n";

const esc = `\x1b`;
const csi = (params: number[], final: CSIFinalCharacter) => {
    return `${esc}[${params.join(";")}${final}`;
};

const sgr = (params: number[]) => {
    return csi(params, "m");
};

const strip = (string: string) => string.slice(1, -1);

describe("ANSI parser", () => {
    let terminal: DummyTerminal;

    beforeEach(() => {
        terminal = new DummyTerminal();
    });

    it("wraps long strings", async() => {
        terminal.output.dimensions = {columns: 5, rows: 5};

        const expectedOutput = strip(`
01234
56789
`);
        terminal.output.write("0123456789");

        expect(terminal.output.toString()).to.eql(expectedOutput);
    });

    describe("movements", () => {
        it("can move down", async() => {
            terminal.output.write(`first${csi([1], "B")}second`);

            expect(terminal.output.toString()).to.eql(strip(`
first
     second
`));
        });

        it("stays at the same line after writing last column character", async() => {
            terminal.output.dimensions = {columns: 10, rows: 5};
            terminal.output.write(`${esc}[1;10H*${esc}[5D*`);

            expect(terminal.output.toString()).to.eql("    *    *");
            expect(terminal.output.toString()).to.eql("    *    *");
        });
    });

    it("can parse an ASCII string", async() => {
        terminal.output.write("something");

        expect(terminal.output.toString()).to.eql("something");
    });

    describe("true color", () => {
        it("sets the correct foreground color", async() => {
            terminal.output.write(`${sgr([38, 2, 255, 100, 0])}A${sgr([0])}`);

            expect(terminal.output.toString()).to.eql("A");
            const firstChar = terminal.output.at({rowIndex: 0, columnIndex: 0});
            expect(firstChar.attributes.color).to.eql([255, 100, 0]);
        });
    });

    describe("CSI", () => {
        describe("Device Status Report (DSR)", () => {
            describe("Report Cursor Position (CPR)", () => {
                it("report cursor position", async() => {
                    terminal.output.write(`some text${csi([6], "n")}`);

                    expect(terminal.output.toString()).to.eql("some text");
                    expect(terminal.written).to.eql(`${csi([1, 10], "R")}`);
                });
            });
        });
    });

    describe("vttest", () => {
        function vttest(fileName: string, output: string) {
            const input = readFileSync(`${__dirname}/test_files/vttest/${fileName}`).toString();

            return it(fileName, () => {

                const expectedOutput = strip(output);

                terminal.output.write(input);
                const actualOutput = terminal.output.toString();

                if (expectedOutput !== actualOutput) {
                    console.log("Expected output:");
                    console.log(expectedOutput);

                    console.log("Actual output:");
                    console.log(actualOutput);

                    expect(expectedOutput).to.eq(actualOutput);
                }
            });
        }

        describe("cursor movements", () => {
            vttest("1-1", `
********************************************************************************
*++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++*
*+                                                                            +*
*+                                                                            +*
*+                                                                            +*
*+                                                                            +*
*+                                                                            +*
*+                                                                            +*
*+        EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE        +*
*+        E                                                          E        +*
*+        E The screen should be cleared,  and have an unbroken bor- E        +*
*+        E der of *'s and +'s around the edge,   and exactly in the E        +*
*+        E middle  there should be a frame of E's around this  text E        +*
*+        E with  one (1) free position around it.    Push <RETURN>  E        +*
*+        E                                                          E        +*
*+        EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE        +*
*+                                                                            +*
*+                                                                            +*
*+                                                                            +*
*+                                                                            +*
*+                                                                            +*
*+                                                                            +*
*++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++*
********************************************************************************
`);

            vttest("1-2", `
************************************************************************************************************************************
*++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++*
*+                                                                                                                                +*
*+                                                                                                                                +*
*+                                                                                                                                +*
*+                                                                                                                                +*
*+                                                                                                                                +*
*+                                                                                                                                +*
*+                                  EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE                                  +*
*+                                  E                                                          E                                  +*
*+                                  E The screen should be cleared,  and have an unbroken bor- E                                  +*
*+                                  E der of *'s and +'s around the edge,   and exactly in the E                                  +*
*+                                  E middle  there should be a frame of E's around this  text E                                  +*
*+                                  E with  one (1) free position around it.    Push <RETURN>  E                                  +*
*+                                  E                                                          E                                  +*
*+                                  EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE                                  +*
*+                                                                                                                                +*
*+                                                                                                                                +*
*+                                                                                                                                +*
*+                                                                                                                                +*
*+                                                                                                                                +*
*+                                                                                                                                +*
*++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++*
************************************************************************************************************************************
`);

            vttest("1-3", `
Test of autowrap, mixing control and print characters.
The left/right margins should have letters in order:
I                                                                              i
J                                                                              j
K                                                                              k
L                                                                              l
M                                                                              m
N                                                                              n
O                                                                              o
P                                                                              p
Q                                                                              q
R                                                                              r
S                                                                              s
T                                                                              t
U                                                                              u
V                                                                              v
W                                                                              w
X                                                                              x
Y                                                                              y
Z                                                                              z

Push <RETURN>
`);

            vttest("1-4", `
Test of autowrap, mixing control and print characters.
The left/right margins should have letters in order:
I                                                                                                                                  i
J                                                                                                                                  j
K                                                                                                                                  k
L                                                                                                                                  l
M                                                                                                                                  m
N                                                                                                                                  n
O                                                                                                                                  o
P                                                                                                                                  p
Q                                                                                                                                  q
R                                                                                                                                  r
S                                                                                                                                  s
T                                                                                                                                  t
U                                                                                                                                  u
V                                                                                                                                  v
W                                                                                                                                  w
X                                                                                                                                  x
Y                                                                                                                                  y
Z                                                                                                                                  z

Push <RETURN>
`);

            vttest("1-5", `
Test of cursor-control characters inside ESC sequences.
Below should be four identical lines:

A B C D E F G H I
A B C D E F G H I
A B C D E F G H I
A B C D E F G H I

Push <RETURN>
`);

            vttest("1-6", `
Test of leading zeros in ESC sequences.
Two lines below you should see the sentence "This is a correct sentence".

This is a correct sentence















Push <RETURN>
`);
        });
    });
});
