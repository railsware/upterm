/// <reference path="../references.ts" />

module BlackScreen {
    export module Decorators {
        export class Base {
            constructor(protected invocation: Invocation) {
            }

            decorate(): any {
                throw new Error('This method should be implemented in a subclass');
            }
            
            isApplicable(): boolean {
                throw new Error('This method should be implemented in a subclass');
            }
        }
    }
}
