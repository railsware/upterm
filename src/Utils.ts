import * as fs from 'fs';
import * as Path from 'path';
import * as i from './Interfaces';
import * as _ from 'lodash';

export default class Utils {
    public static paths: Array<string> = process.env.PATH.split(Path.delimiter);
    public static executables: Array<string> = [];

    static log(...args: any[]): void {
        this.delegate('log', args);
    }

    static info(...args: any[]): void {
        this.delegate('info', args);
    }

    static debug(...args: any[]): void {
        this.delegate('debug', args);
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
        return Utils.filesIn(directory).then(files =>
            Promise.all(files.map(fileName =>
                new Promise((resolve, reject) =>
                    fs.stat(Path.join(directory, fileName), (error: NodeJS.ErrnoException, stat: fs.Stats) => {
                        if (error) {
                            reject(error);
                        }

                        resolve({name: fileName, stat: stat});
                    })
                )
            ))
        );
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

    static isDirectory(directoryName: string): Promise<boolean> {
        return new Promise((resolve) => {
            Utils.ifExists(directoryName, () => {
                fs.stat(directoryName, (error: NodeJS.ErrnoException, pathStat: fs.Stats) => {
                    resolve(pathStat.isDirectory());
                });
            }, () => resolve(false));
        });
    }

    static normalizeDir(path: string): string {
        return Path.normalize(path + Path.sep);
    }

    static dirName(path: string): string {
        return this.normalizeDir(path.endsWith(Path.sep) ? path : Path.dirname(path))
    }

    static baseName(path: string): string {
        if (path.split(Path.sep).length === 1) {
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

    static getExecutablesInPaths(): Promise<string[]> {
        return new Promise((resolve) => {
            if (this.executables.length) {
                resolve(this.executables);
            } else {
                return this.filterWithPromising(this.paths, this.isDirectory).then(paths =>
                        Promise.all(paths.map(this.filesIn)).then((allFiles: string[][]) => resolve(_.uniq(allFiles.reduce((acc, files) => acc.concat(files)))))
                )
            }
        });
    }

    private static delegate(name: string, args: Array<any>): void {
        if ((typeof window !== 'undefined') && (<any>window)['DEBUG']) {
            (<any>console)[name](...args);
        }
    }

    static filterWithPromising<T>(values: T[], filter: (T) => Promise<boolean>): Promise<T[]> {
        return new Promise((resolve) => {
            Promise
                .all(values.map(value => new Promise((rs) => filter(value).then(rs, () => rs(false)))))
                .then(filterResults => resolve(_(values).zip(filterResults).filter(z => z[1]).map(z => z[0]).value()));
        });
    }
}
