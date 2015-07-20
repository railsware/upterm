import _ = require("lodash");

export function memoize(resolver = (...args: any[]) => args) {
    return (target: any, name: string, descriptor: PropertyDescriptor) => {
        descriptor.value = _.memoize(descriptor.value, resolver);

        return descriptor;
    }
}
