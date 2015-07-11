import fs = require('fs');
import path = require('path');
import i = require('./Interfaces');

class Utils {
    static log(...args: any[]): void {
        this.delegate('log', args);
    }

    static error(...args: any[]): void {
        this.delegate('error', args);
    }

    static filesIn(directory: string): Promise<string[]> {
        return new Promise((resolve, reject) => {
            Utils.ifExists(directory, () => {
                fs.stat(directory, (error: NodeJS.ErrnoException, pathStat: fs.Stats) => {
                    if (!pathStat.isDirectory()) {
                        reject(`${directory} is not a directory.`);
                    }

                    fs.readdir(directory, (error: NodeJS.ErrnoException, files: Array<string>) => {
                        if (error) {
                            reject(error);
                        }

                        resolve(files);
                    })
                });
            });
        });
    }

    static stats(directory: string): Promise<i.FileInfo[]> {
        return Utils.filesIn(directory).then((files) => {
            return Promise.all(files.map((fileName) => {
                return new Promise((resolve, reject) => {
                    fs.stat(path.join(directory, fileName), (error: NodeJS.ErrnoException, stat: fs.Stats) => {
                        if (error) {
                            reject(error);
                        }

                        resolve({name: fileName, stat: stat});
                    })
                })
            }));
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
