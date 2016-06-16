import "mocha";
import {expect} from "chai";
import {OrderedSet} from "../../src/utils/OrderedSet";

describe("ordered set", () => {
    describe("prepend", () => {
        it("doesn't keep two elements with the same values", () => {
            const set = new OrderedSet<string>();

            set.prepend("foo");
            set.prepend("foo");

            expect(set.size).to.eq(1);
        });

        it("moves an element to the beginning if it already exists", () => {
            const set = new OrderedSet<string>();

            set.prepend("foo");
            set.prepend("bar");
            set.prepend("foo");

            expect(set.at(0)).to.eq("foo");
        });
    });
});
