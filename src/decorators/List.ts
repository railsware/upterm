/// <reference path="../references.ts" />

module BlackScreen {
    export module Decorators {
        export var list: Array<{new (invocation: Invocation): Base}> = [Decorators.Json];
    }
}
