var pty = require('ptyw.js');
var Aliases = (function () {
    function Aliases() {
    }
    Aliases.initialize = function () {
        this.aliases = {};
        this.importAliases();
    };
    Aliases.find = function (alias) {
        return this.aliases[alias];
    };
    Aliases.importAliases = function (shellName) {
        var _this = this;
        if (shellName === void 0) { shellName = process.env.SHELL; }
        if (process.platform === 'win32')
            return;
        var shell = pty.spawn(shellName, ['-i', '-c', 'alias'], { env: process.env });
        var aliases = '';
        shell.stdout.on('data', function (text) { return aliases += text.toString(); });
        shell.on('exit', function () {
            return aliases.split('\n').forEach(function (alias) {
                var split = alias.split('=');
                var name = /(alias )?(.*)/.exec(split[0])[2];
                var value = /'?([^']*)'?/.exec(split[1])[1];
                _this.aliases[name] = value;
            });
        });
    };
    return Aliases;
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Aliases;
Aliases.initialize();
