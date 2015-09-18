var Executable_1 = require('./providers/Executable');
var Command_1 = require('./providers/Command');
var File_1 = require('./providers/File');
var Alias_1 = require('./providers/Alias');
var History_1 = require('./providers/History');
var _ = require('lodash');
var Autocompletion = (function () {
    function Autocompletion() {
        this.providers = [new Command_1.default(), new Alias_1.default(), new Executable_1.default(), new File_1.default(), new History_1.default()];
        this.limit = 30;
    }
    Autocompletion.prototype.getSuggestions = function (prompt) {
        var _this = this;
        return Promise.all(_.map(this.providers, function (provider) { return provider.getSuggestions(prompt); })).then(function (results) {
            return _(results)
                .flatten()
                .select(function (suggestion) { return suggestion.score > 0; })
                .sortBy(function (suggestion) { return -suggestion.score; })
                .uniq('value')
                .take(_this.limit)
                .value();
        });
    };
    return Autocompletion;
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Autocompletion;
