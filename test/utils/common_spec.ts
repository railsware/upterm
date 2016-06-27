import "mocha";
import {expect} from "chai";
import {commonPrefix, stat} from "../../src/utils/Common";
import * as mockFs from "mock-fs";


describe("common utils", () => {
    describe("commonPrefix", () => {
        it("returns the whole string for the same strings", async() => {
            expect(commonPrefix("abc", "abc")).to.eql("abc");
        });
    });

    describe("stat", () => {
        it("returns stats even if the file is a borken symlink", async() => {
            mockFs({
                '/broken-symlink': mockFs.symlink({
                    path: 'non-existing-file'
                })
            });
            return stat(<FullPath>'/broken-symlink')
                .then((stats) => {
                    expect(stats).to.exist;
                });
        });
    });
});
