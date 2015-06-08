import fs = require('fs');

class Utils {
    static log(...args: any[]): void {
        this.delegate('log', args);
    }

    static error(...args: any[]): void {
        this.delegate('error', args);
    }

    static filesIn(directory: string, callback: (files: string[]) => any): void {
        Utils.ifExists(directory, () => {
            fs.stat(directory, (error: NodeJS.ErrnoException, pathStat: fs.Stats) => {
                if (!pathStat.isDirectory()) {
                    return;
                }

                fs.readdir(directory, (error: NodeJS.ErrnoException, files: Array<string>) => {
                    if (error) {
                        return;
                    }

                    callback(files);
                })
            });
        });
    }

    static ifExists(fileName: string, callback: Function, elseCallback?: Function) {
        fs.exists(fileName, (pathExists: boolean) => {
            if (pathExists) {
                callback();
            } else if (elseCallback) {
                elseCallback()
            }
        });
    }

    private static delegate(name: string, args: Array<any>): void {
        if ((<any>window)['DEBUG']) {
            (<any>console)[name](...args);
        }
    }
}

export = Utils;
