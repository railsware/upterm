/// <reference path="../references.ts" />

var JSONTree = require('../decorators/json');

module BlackScreen {
    export module Decorators {
        export class Json extends Base {
            decorate(): any {
                return React.createElement(JSONTree, { data: JSON.parse(this.stringifiedOutputBuffer())});
            }

            isApplicable(): boolean {
                try {
                    JSON.parse(this.stringifiedOutputBuffer());
                    return true;
                } catch (exception) {
                    return false;
                }
            }

            private stringifiedOutputBuffer(): string {
                return this.invocation.getBuffer().toString();
            }
        }
    }
}
