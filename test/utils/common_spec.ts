import {expect} from "chai";
import {commonPrefix} from "../../src/utils/Common";

describe("common utils", () => {
    describe("commonPrefix", () => {
        it("returns the whole string for the same strings", async() => {
            expect(commonPrefix("abc", "abc")).to.eql("abs");
        });
    });
});
