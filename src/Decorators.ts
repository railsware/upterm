import * as _ from "lodash";

export function memoize(resolver: Function = undefined) {
    if (typeof resolver !== "function") {
        resolver = (...args: any[]) => JSON.stringify(args);
    }

    return (target: any, name: string, descriptor: TypedPropertyDescriptor<any>) => {
        descriptor.value = _.memoize(descriptor.value, resolver);

        return descriptor;
    };
}

export function debounce(wait: number = 0) {
    return (target: any, name: string, descriptor: PropertyDescriptor) => {
        descriptor.value = _.debounce(descriptor.value, wait);

        return descriptor;
    };
}
