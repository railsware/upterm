import * as fs from 'fs';
import * as _ from 'lodash';
import Job from './Job';
import Aliases from './Aliases';
import History from './History';
import Utils from './Utils';
import Serializer from "./Serializer";
import EmitterWithUniqueID from "./EmitterWithUniqueID";
import PluginManager from "./PluginManager";
var remote = require('remote');
var app = remote.require('app');

export default class Terminal extends EmitterWithUniqueID {
    jobs: Array<Job> = [];
    history: typeof History;
    private _currentDirectory: string;
    private stateFileName = `${Utils.homeDirectory}/.black-screen-state`;
    // The value of the dictionary is the default value used if there is no serialized data.
    private serializableProperties: _.Dictionary<any> = {
        currentDirectory: `String:${Utils.homeDirectory}`,
        history: `History:[]`
    };

    constructor(private _dimensions: Dimensions) {
        super();

        // TODO: We want to deserialize properties only for the first instance
        // TODO: of Terminal for the application.
        this.deserialize();
        this.history = History;

        this.on('job', this.serialize.bind(this));

        this.clearJobs();
    }

    createJob(): void {
        var job = new Job(this);

        job.once('end', () => {
            if (app.dock) {
                app.dock.bounce('informational');
            }
            this.createJob();
        });

        this.jobs = this.jobs.concat(job);
        this.emit('job');
    }

    get dimensions(): Dimensions {
        return this._dimensions;
    }

    set dimensions(value: Dimensions) {
        this._dimensions = value;
        this.jobs.forEach(job => job.winch());
    }

    clearJobs(): void {
        this.jobs = [];
        this.createJob();
    }

    get currentDirectory(): string {
        return this._currentDirectory;
    }

    set currentDirectory(value: string) {
        let normalizedDirectory =  Utils.normalizeDir(value);
        if (normalizedDirectory === this._currentDirectory) {
            return;
        }

        this._currentDirectory = normalizedDirectory;

        PluginManager.environmentObservers.forEach(observer =>
            observer.currentWorkingDirectoryDidChange(this, normalizedDirectory)
        );
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
