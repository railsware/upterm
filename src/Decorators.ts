import * as _ from "lodash";

export function memoize(resolver: Function | undefined = undefined) {
    if (typeof resolver !== "function") {
        resolver = (...args: any[]) => JSON.stringify(args);
    }

    return (target: any, name: string, descriptor: TypedPropertyDescriptor<any>) => {
        descriptor.value = _.memoize(descriptor.value, resolver);

        return descriptor;
    };
}

export const memoizeAccessor = <T>(target: Object, name: string | symbol, descriptor: TypedPropertyDescriptor<T>) => {
    const memoizedPropertyName = `__memoized_${name}`;
    const originalGetter = descriptor.get;

    descriptor.get = function (this: any) {
        if (!this[memoizedPropertyName]) {
            this[memoizedPropertyName] = originalGetter!.call(this);
        }

        return this[memoizedPropertyName];
    };

    return descriptor;
};

export function debounce(wait: number = 0) {
    return (target: any, name: string, descriptor: PropertyDescriptor) => {
        descriptor.value = _.debounce(descriptor.value, wait);

        return descriptor;
    };
}
