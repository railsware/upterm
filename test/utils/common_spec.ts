import "mocha";
import {expect} from "chai";
import {commonPrefix, fuzzyMatch} from "../../src/utils/Common";


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
    });
});
