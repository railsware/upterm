import {readFileSync} from "fs";
import {Job} from "./Job";
import {History} from "./History";
import {EmitterWithUniqueID} from "../EmitterWithUniqueID";
import {PluginManager} from "../PluginManager";
import {Status} from "../Enums";
import {ApplicationComponent} from "../views/1_ApplicationComponent";
import {Environment, processEnvironment} from "./Environment";
import {
    homeDirectory, normalizeDirectory, writeFileCreatingParents,
    presentWorkingDirectoryFilePath, historyFilePath,
} from "../utils/Common";
import {remote} from "electron";
import {OrderedSet} from "../utils/OrderedSet";
import {Aliases, aliasesFromConfig} from "./Aliases";
import * as _ from "lodash";

export class Session extends EmitterWithUniqueID {
    jobs: Array<Job> = [];
    readonly environment = new Environment(processEnvironment);
    readonly aliases = new Aliases(aliasesFromConfig);
    history = History;
    historicalPresentDirectoriesStack = new OrderedSet<string>();

    constructor(private application: ApplicationComponent, private _dimensions: Dimensions) {
        super();

        // TODO: We want to deserialize properties only for the first instance
        // TODO: of Session for the application.
        this.deserialize();

        this.on("job", () => this.serialize());

        this.clearJobs();
    }

    createJob(): void {
        const job = new Job(this);

        job.once("end", () => {
            const electronWindow = remote.BrowserWindow.getAllWindows()[0];

            if (remote.app.dock && !electronWindow.isFocused()) {
                remote.app.dock.bounce("informational");
                remote.app.dock.setBadge(job.status === Status.Success ? "1" : "✕");
                /* tslint:disable:no-unused-expression */
                new Notification("Command has been completed", { body: job.prompt.value });
            }

            this.createJob();
        });

        this.jobs = this.jobs.concat(job);
        this.emit("job");
    }

    get dimensions(): Dimensions {
        return this._dimensions;
    }

    set dimensions(value: Dimensions) {
        this._dimensions = value;
        this.jobs.forEach(job => job.winch());
    }

    get currentJob(): Job {
        return _.last(this.jobs);
    }

    clearJobs(): void {
        this.jobs = [];
        this.createJob();
    }

    close(): void {
        this.application.closePane(this);
    }

    get directory(): string {
        return this.environment.pwd;
    }

    set directory(value: string) {
        let normalizedDirectory = normalizeDirectory(value);
        if (normalizedDirectory === this.directory) {
            return;
        }

        PluginManager.environmentObservers.forEach(observer =>
            observer.presentWorkingDirectoryWillChange(this, normalizedDirectory)
        );

        this.environment.pwd = normalizedDirectory;
        this.historicalPresentDirectoriesStack.prepend(normalizedDirectory);

        PluginManager.environmentObservers.forEach(observer =>
            observer.presentWorkingDirectoryDidChange(this, normalizedDirectory)
        );
    }

    private serialize() {
        writeFileCreatingParents(presentWorkingDirectoryFilePath, JSON.stringify(this.directory)).then(
            () => void 0,
            (error: any) => { if (error) throw error; }
        );

        writeFileCreatingParents(historyFilePath, this.history.serialize()).then(
            () => void 0,
            (error: any) => { if (error) throw error; }
        );
    };

    private deserialize(): void {
        this.directory = this.readSerialized(presentWorkingDirectoryFilePath, homeDirectory);
        History.deserialize(this.readSerialized(historyFilePath, []));
    }

    private readSerialized<T>(file: string, defaultValue: T): T {
        try {
            return JSON.parse(readFileSync(file).toString());
        } catch (error) {
            return defaultValue;
        }
    };
}
