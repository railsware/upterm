var Base = (function () {
    function Base(invocation) {
        this.invocation = invocation;
    }
    Base.prototype.shouldDecorateRunningPrograms = function () {
        return false;
    };
    return Base;
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Base;
