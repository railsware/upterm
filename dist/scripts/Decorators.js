var _ = require("lodash");
function memoize(resolver) {
    if (resolver === void 0) { resolver = null; }
    if (typeof resolver !== "function") {
        resolver = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i - 0] = arguments[_i];
            }
            return JSON.stringify(args);
        };
    }
    return function (target, name, descriptor) {
        descriptor.value = _.memoize(descriptor.value, resolver);
        return descriptor;
    };
}
exports.memoize = memoize;
