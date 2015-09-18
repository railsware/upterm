var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var fs = require('fs');
var _ = require('lodash');
var events = require('events');
var Invocation_1 = require('./Invocation');
var History_1 = require('./History');
var Utils_1 = require('./Utils');
var Serializer_1 = require("./Serializer");
var remote = require('remote');
var app = remote.require('app');
var Terminal = (function (_super) {
    __extends(Terminal, _super);
    function Terminal(dimensions) {
        _super.call(this);
        this.dimensions = dimensions;
        this.invocations = [];
        this.stateFileName = Utils_1.default.homeDirectory + "/.black-screen-state";
        this.serializableProperties = {
            currentDirectory: "String:" + Utils_1.default.homeDirectory,
            history: "History:[]"
        };
        this.deserialize();
        this.history = new History_1.default();
        this.on('invocation', this.serialize.bind(this));
        this.clearInvocations();
    }
    Terminal.prototype.createInvocation = function () {
        var _this = this;
        var invocation = new Invocation_1.default(this.currentDirectory, this.dimensions, this.history);
        invocation
            .once('clear', function (_) { return _this.clearInvocations(); })
            .once('end', function (_) {
            if (app.dock) {
                app.dock.bounce('informational');
            }
            _this.createInvocation();
        })
            .once('working-directory-changed', function (newWorkingDirectory) { return _this.setCurrentDirectory(newWorkingDirectory); });
        this.invocations = this.invocations.concat(invocation);
        this.emit('invocation');
    };
    Terminal.prototype.setDimensions = function (dimensions) {
        this.dimensions = dimensions;
        this.invocations.forEach(function (invocation) { return invocation.setDimensions(dimensions); });
    };
    Terminal.prototype.clearInvocations = function () {
        this.invocations = [];
        this.createInvocation();
    };
    Terminal.prototype.setCurrentDirectory = function (value) {
        remote.getCurrentWindow().setRepresentedFilename(value);
        this.currentDirectory = Utils_1.default.normalizeDir(value);
        app.addRecentDocument(value);
        this.watchGitBranch(value);
    };
    Terminal.prototype.watchGitBranch = function (directory) {
        var _this = this;
        if (this.gitBranchWatcher) {
            this.gitBranchWatcher.close();
        }
        var gitDirectory = directory + "/.git";
        Utils_1.default.ifExists(gitDirectory, function () {
            _this.setGitBranch(gitDirectory);
            _this.gitBranchWatcher = fs.watch(gitDirectory, function (type, fileName) {
                if (fileName === 'HEAD') {
                    _this.setGitBranch(gitDirectory);
                }
            });
        }, function () { return _this.emit('vcs-data', { isRepository: false }); });
    };
    Terminal.prototype.setGitBranch = function (gitDirectory) {
        var _this = this;
        fs.readFile(gitDirectory + "/HEAD", function (error, buffer) {
            var data = {
                isRepository: true,
                branch: /ref: refs\/heads\/(.*)/.exec(buffer.toString())[1],
                status: 'clean'
            };
            _this.emit('vcs-data', data);
        });
    };
    Terminal.prototype.serialize = function () {
        var _this = this;
        var values = {};
        _.each(this.serializableProperties, function (value, key) {
            return values[key] = Serializer_1.default.serialize(_this[key]);
        });
        fs.writeFile(this.stateFileName, JSON.stringify(values), function (error) {
            if (error)
                debugger;
        });
    };
    Terminal.prototype.deserialize = function () {
        var _this = this;
        try {
            var state = JSON.parse(fs.readFileSync(this.stateFileName).toString());
        }
        catch (error) {
            state = this.serializableProperties;
        }
        _.each(state, function (value, key) {
            var setterName = "set" + _.capitalize(key);
            var that = _this;
            var deserializedValue = Serializer_1.default.deserialize(value);
            if (that[setterName]) {
                that[setterName](deserializedValue);
            }
            else {
                that[key] = deserializedValue;
            }
        });
    };
    return Terminal;
})(events.EventEmitter);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Terminal;
