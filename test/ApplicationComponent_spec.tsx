import "mocha";
import {expect} from "chai";
import {ApplicationComponent} from "../src/views/1_ApplicationComponent";
import * as React from "react";
import {shallow} from "enzyme";

describe("ApplicationComponent", () => {
    it("can add tabs", done => {
        const application: ApplicationComponent = shallow(<ApplicationComponent />).instance() as ApplicationComponent;
        expect(application.state.tabs.length).to.eql(1);
        application.addTab();
        expect(application.state.tabs.length).to.eql(2);
        done();
    });

    it("removing the last tab, if it is focused, leaves the last (previously second last) tab focused", done => {
        const application: ApplicationComponent = shallow(<ApplicationComponent />).instance() as ApplicationComponent;
        application.addTab();
        application.addTab();
        application.focusTab(3);
        expect(application.state.focusedTabIndex).to.eql(2);
        application.closeFocusedTab();
        expect(application.state.focusedTabIndex).to.eql(1);
        done();
    });
});
