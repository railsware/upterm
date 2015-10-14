import * as fs from 'fs';
import * as _ from 'lodash';
import * as i from './Interfaces';
import * as events from 'events';
import * as Path from 'path';
import Invocation from './Invocation';
import Aliases from './Aliases';
import History from './History';
import Utils from './Utils';
import Serializer from "./Serializer";
import PTY from "./PTY";
var remote = require('remote');
var app = remote.require('app');

export default class Terminal extends events.EventEmitter {
    invocations: Array<Invocation> = [];
    private _currentDirectory: string;
    history: History;
    gitBranchWatcher: fs.FSWatcher;
    gitLocked: boolean = false;

    private stateFileName = `${Utils.homeDirectory}/.black-screen-state`;

    // The value of the dictionary is the default value used if there is no serialized data.
    private serializableProperties: _.Dictionary<any> = {
        currentDirectory: `String:${Utils.homeDirectory}`,
        history: `History:[]`
    };

    constructor(private _dimensions: i.Dimensions) {
        super();

        // TODO: We want to deserialize properties only for the first instance
        // TODO: of Terminal for the application.
        this.deserialize();
        this.history = new History();

        this.on('invocation', this.serialize.bind(this));

        this.clearInvocations();
    }

    createInvocation(): void {
        var invocation = new Invocation(this);

        invocation
            .once('clear', _ => this.clearInvocations())
            .once('end', _ => {
                if (app.dock) {
                    app.dock.bounce('informational');
                }
                this.createInvocation();
            })
            .once('working-directory-changed', (newWorkingDirectory: string) => this.currentDirectory = newWorkingDirectory);

        this.invocations = this.invocations.concat(invocation);
        this.emit('invocation');
    }

    get dimensions(): i.Dimensions {
        return this._dimensions;
    }

    set dimensions(value: i.Dimensions) {
        this._dimensions = value;
        this.invocations.forEach(invocation => invocation.wing());
    }

    clearInvocations(): void {
        this.invocations = [];
        this.createInvocation();
    }

    get currentDirectory(): string {
        return this._currentDirectory;
    }

    set currentDirectory(value: string) {
        this._currentDirectory = Utils.normalizeDir(value);
        this.watchVCS(value);

        remote.getCurrentWindow().setRepresentedFilename(value);
        app.addRecentDocument(value);
    }

    private watchVCS(directory: string): void {
        if (this.gitBranchWatcher) {
            this.gitBranchWatcher.close();
        }
        var gitDirectory = Path.join(directory, '.git');
        const gitHeadFileName = Path.join('.git', 'HEAD');
        const gitHeadsDirectoryName = Path.join('.git', 'refs', 'heads');

        Utils.ifExists(gitDirectory, () => {
            this.updateGitData(gitDirectory);
            this.gitBranchWatcher = fs.watch(this._currentDirectory, {recursive: true},
                (type, fileName) => {
                    if (!this.gitLocked && (!fileName.startsWith('.git') || fileName == gitHeadFileName || fileName.startsWith(gitHeadsDirectoryName))) {
                        this.updateGitData(gitDirectory)
                    }
                }
            )
        }, () => this.emit('vcs-data', {isRepository: false}));
    }

    private updateGitData(gitDirectory: string) {
        this.gitLocked = true;
        fs.readFile(`${gitDirectory}/HEAD`, (error, buffer) => {
            var changes = '';
            new PTY('git', ['status', '--porcelain'], this._currentDirectory, {columns: 80, rows: 20},
                text => changes += text,
                exitCode => {
                    var status = changes.length ? 'dirty' : 'clean';

                    var data: i.VcsData = {
                        isRepository: true,
                        branch: /ref: refs\/heads\/(.*)/.exec(buffer.toString())[1],
                        status: status
                    };
                    this.emit('vcs-data', data);
                    this.gitLocked = false
                }
            );
        });
    }

    private serialize(): void {
        var values: _.Dictionary<string> = {};

        _.each(this.serializableProperties, (value: string, key: string) =>
            values[key] = Serializer.serialize((<any>this)[key])
        );

        fs.writeFile(this.stateFileName, JSON.stringify(values), (error: any) => {
            if (error) debugger;
        })
    }

    private deserialize(): void {
        try {
            var state = JSON.parse(fs.readFileSync(this.stateFileName).toString());
        } catch (error) {
            state = this.serializableProperties;
        }

        _.each(state, (value: string, key: string) => {
            var setterName = `set${_.capitalize(key)}`;
            var that = (<any>this);
            var deserializedValue = Serializer.deserialize(value);

            if (that[setterName]) {
                that[setterName](deserializedValue);
            } else {
                that[key] = deserializedValue;
            }
        });
    }
}
