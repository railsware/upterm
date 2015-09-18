var _ = require('lodash');
var Aliases_1 = require('../Aliases');
var score = require('fuzzaldrin').score;
var Alias = (function () {
    function Alias() {
    }
    Alias.prototype.getSuggestions = function (prompt) {
        return new Promise(function (resolve) {
            if (prompt.getWholeCommand().length > 1) {
                return resolve([]);
            }
            var lastArgument = prompt.getLastArgument();
            var all = _.map(Aliases_1.default.aliases, function (expanded, alias) {
                return {
                    value: alias,
                    score: 2 * (score(alias, lastArgument) + (score(expanded, lastArgument) * 0.5)),
                    synopsis: expanded,
                    description: "Aliased to \u201C" + expanded + "\u201D.",
                    type: 'alias',
                };
            });
            resolve(_(all).sortBy('score').reverse().take(10).value());
        });
    };
    return Alias;
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Alias;
