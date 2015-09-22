import * as _ from "lodash";

export function memoize(resolver: Function = null) {
    if (typeof resolver !== "function") {
        // TODO: convert to an arrow function when https://github.com/babel/babel/issues/2332 is closed.
        resolver = function (...args: any[]) { return JSON.stringify(args); }
    }

    return (target: any, name: string, descriptor: PropertyDescriptor) => {
        descriptor.value = _.memoize(descriptor.value, resolver);

        return descriptor;
    }
}
