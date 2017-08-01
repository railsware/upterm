import "mocha";
import {expect} from "chai";
import {commonPrefix, fuzzyMatch, normalizeProcessInput} from "../../src/utils/Common";

interface SimulatedKeyboardEvent {
    ctrlKey?: boolean;
    altKey?: boolean;
    shiftKey?: boolean;
    keyCode: number;
    key: string;
}

function simulateKeyboardEvent(event: SimulatedKeyboardEvent) {
    return event as KeyboardEvent;
}

describe("common utils", () => {
    describe("commonPrefix", () => {
        it("returns the whole string for the same strings", () => {
            expect(commonPrefix("abc", "abc")).to.eql("abc");
        });
    });

    describe("fuzzyMatch", () => {
        it("matches beginning of string", () => {
            expect(fuzzyMatch("com", "commit")).to.eql(true);
        });

        it("matches beginning of token", () => {
            expect(fuzzyMatch("nam", "file_name")).to.eql(true);
        });

        it("matches exact substring", () => {
            expect(fuzzyMatch("2-15", "cat 2-15")).to.eql(true);
        });
    });

    describe("normalizeProcessInput", () => {
        it("handles Ctrl+[", () => {
            const event = simulateKeyboardEvent({ctrlKey: true, keyCode: 219, key: "["});
            const escape = String.fromCharCode(27);

            expect(normalizeProcessInput(event, false)).to.eql(escape);
        });

        it("handles Ctrl+J", () => {
            const event = simulateKeyboardEvent({ctrlKey: true, keyCode: 219, key: "["});
            const escape = String.fromCharCode(27);

            expect(normalizeProcessInput(event, false)).to.eql(escape);
        });
    });
});
