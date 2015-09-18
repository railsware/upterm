var _ = require('lodash');
var History_1 = require('../History');
var score = require('fuzzaldrin').score;
var History = (function () {
    function History() {
    }
    History.prototype.getSuggestions = function (prompt) {
        return new Promise(function (resolve) {
            var lastArgument = prompt.getLastArgument();
            var all = _.map(History_1.default.stack, function (entry) {
                return {
                    value: entry,
                    score: 0.1 * score(entry, lastArgument),
                    synopsis: '',
                    description: '',
                    type: 'history'
                };
            });
            resolve(_(all).sortBy('score').reverse().take(10).value());
        });
    };
    return History;
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = History;
