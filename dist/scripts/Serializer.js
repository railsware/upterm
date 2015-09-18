var _ = require('lodash');
var History_1 = require('./History');
var Serializer = (function () {
    function Serializer() {
    }
    Serializer.serialize = function (serializable) {
        if (typeof serializable.serialize === 'function') {
            return serializable.serialize();
        }
        else if (typeof serializable === 'string') {
            return "String:" + serializable;
        }
        else {
            console.error("Don't know how to serialize " + serializable);
        }
    };
    Serializer.deserialize = function (serialized) {
        if (_.startsWith(serialized, 'String:')) {
            return serialized.slice("String:".length);
        }
        else if (_.startsWith(serialized, 'History:')) {
            return History_1.default.deserialize(serialized.slice("History:".length));
        }
        else {
            console.error("Don't know how to deserialize " + serialized);
        }
    };
    return Serializer;
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Serializer;
