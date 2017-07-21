import "mocha";
import {expect} from "chai";
import {ApplicationComponent} from "../src/views/1_ApplicationComponent";
import * as React from "react";
import {shallow} from "enzyme";

describe.skip("Tab", () => {
    it("can close panes and have the remaining panes get focused", done => {
        const application: ApplicationComponent = shallow(<ApplicationComponent />).instance() as ApplicationComponent;
        application.state.tabs[0].addPane();
        application.state.tabs[0].focusPreviousPane();
        application.state.tabs[0].closeFocusedPane();
        let paneCount = 0;
        let lastPane: any;
        application.state.tabs[0].panes.children.forEach(pane => {
            paneCount++;
            lastPane = pane;
        });
        expect(paneCount).to.eql(1);
        expect(application.state.tabs[0].focusedPane.session.id).to.eql(lastPane.session.id);
        done();
    });
});
