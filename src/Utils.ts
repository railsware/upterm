import fs = require('fs');
import Path = require('path');
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
                    fs.stat(Path.join(directory, fileName), (error: NodeJS.ErrnoException, stat: fs.Stats) => {
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

    static normalizeDir(path: string): string {
        return Path.normalize(path + Path.sep);
    }

    static dirName(path: string): string {
        return this.normalizeDir(path.endsWith(Path.sep) ? path : Path.dirname(path))
    }

    static baseName(path: string): string {
        if (path.split(Path.sep).length == 1) {
            return path;
        } else {
            return path.substring(this.dirName(path).length);
        }
    }

    static humanFileSize(bytes: number, si: boolean): string {
        var thresh = si ? 1000 : 1024;
        if(Math.abs(bytes) < thresh) {
            return bytes + 'B';
        }
        var units = si
            ? ['kB','MB','GB','TB','PB','EB','ZB','YB']
            : ['KiB','MiB','GiB','TiB','PiB','EiB','ZiB','YiB'];
        var u = -1;
        do {
            bytes /= thresh;
            ++u;
        } while(Math.abs(bytes) >= thresh && u < units.length - 1);
        return bytes.toFixed(1)+''+units[u];
    }

    private static delegate(name: string, args: Array<any>): void {
        if ((typeof window != 'undefined') && (<any>window)['DEBUG']) {
            (<any>console)[name](...args);
        }
    }
}

export = Utils;
