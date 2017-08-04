import "mocha";
import {expect} from "chai";
import {ApplicationComponent} from "../src/views/ApplicationComponent";
import * as React from "react";
import {shallow} from "enzyme";

describe.skip("Tab", () => {
    it("can close sessions and have the remaining sessions get focused", done => {
        const application: ApplicationComponent = shallow(<ApplicationComponent />).instance() as ApplicationComponent;
        application.otherSession();
        application.otherSession();
        application.closeFocusedSession();
        let sessionCount = 0;
        let lastSession: any;
        application.state.tabs[0].sessionIDs.forEach(id => {
            sessionCount++;
            lastSession = id;
        });
        expect(sessionCount).to.eql(1);
        expect(application.focusedSession.id).to.eql(lastSession.session.id);
        done();
    });
});
