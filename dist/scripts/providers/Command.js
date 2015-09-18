var _ = require('lodash');
var filter = require('fuzzaldrin').filter;
var Command = (function () {
    function Command() {
        this.suggestions = [];
    }
    Command.prototype.getSuggestions = function (prompt) {
        var _this = this;
        return new Promise(function (resolve) {
            try {
                var input = prompt.toParsableString();
                input.onParsingError = function (err, hash) {
                    var filtered = _(hash.expected).filter(function (value) { return _.include(value, hash.token); })
                        .map(function (value) { return /^'(.*)'$/.exec(value)[1]; })
                        .value();
                    _this.suggestions = _.map(filtered, function (value) {
                        return {
                            value: value,
                            score: 10,
                            synopsis: '',
                            description: '',
                            type: value.startsWith('-') ? 'option' : 'command'
                        };
                    });
                };
                input.parse();
                resolve([]);
            }
            catch (exception) {
                resolve(filter(_this.suggestions, prompt.getLastArgument(), { key: 'value', maxResults: 30 }));
            }
        });
    };
    return Command;
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Command;
