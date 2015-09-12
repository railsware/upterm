import * as _ from "lodash";

export function memoize(resolver: Function = null) {
    if (typeof resolver != "function") {
        resolver = (...args: any[]) => JSON.stringify(args);
    }

    return (target: any, name: string, descriptor: PropertyDescriptor) => {
        descriptor.value = _.memoize(descriptor.value, resolver);

        return descriptor;
    }
}
