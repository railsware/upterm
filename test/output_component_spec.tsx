import "mocha";
import {expect} from "chai";
import {RowComponent} from "../src/views/OutputComponent";
import * as React from "react";
import {shallow} from "enzyme";
import {List} from "immutable";
import {Status} from "../src/Enums";
import {defaultAttributes} from "../src/Char";

describe("RowComponent", () => {
    it("renders text row", () => {
        const props = {
            row: List([
                {value: "A", attributes: defaultAttributes},
                {value: "B", attributes: defaultAttributes},
                {value: "C", attributes: defaultAttributes},
            ]),
            hasCursor: true,
            cursorColumnIndex: 0,
            status: Status.InProgress,
        };

        const wrapper = shallow(<RowComponent {...props}/>);
        expect(wrapper.children()).to.have.length(2);

        const newProps = {...props, cursorColumnIndex: 1};
        wrapper.setProps(newProps);
        expect(wrapper.children()).to.have.length(3);
    });
});
