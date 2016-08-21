import {executeCommandWithShellConfig} from "../PTY";
import {intersection} from "lodash";

// http://linuxcommand.org/man_pages/ps1.html

export interface User {
    ruserid: string;
    ruser: string;
    euserid: string;
    euser: string;
}

export interface Group {
    rgroupid: string;
    rgroup: string;
    egroupid: string;
    egroup: string;
}

export interface Terminal {
    name: string;
    ruser: string;
}

export interface Process {
    pid: string;
    time: string;
    ruser: string;
    cmd: string;
}

export interface Session {
    sid: string;
    ruser: string;
    rgroup: string;
}

const ignoreUsers: string[] = ["nobody"];

const ignoreGroups: string[] = ["nobody"];

const resultSet = (result: string[]) => {
        const numColumns = result[0].trim().replace(/ +(?= )/g, "").split(" ").length;
        return result.splice(1)
                     .map(i => i.trim().replace(/ +(?= )/g, "").split(" ", numColumns));
    };

export const users =
    async(): Promise<User[]> => {
        const pInfo: string[][] =
                resultSet(await executeCommandWithShellConfig("ps -eo ruid,ruser,euid,euser"));
        return pInfo.map(p => <User> {ruserid: p[0], ruser: p[1], euserid: p[2], euser: p[3]})
                    .filter(p => intersection(ignoreUsers, [p.ruser, p.euser]).length === 0);
    };

export const groups =
    async(): Promise<Group[]> => {
    const pInfo: string[][] =
            resultSet(await executeCommandWithShellConfig("ps -eo rgid,rgroup,egid,egroup"));
    return pInfo.map(p => <Group> {rgroupid: p[0], rgroup: p[1], egroupid: p[2], egroup: p[3]})
                .filter(p => intersection(ignoreGroups, [p.rgroup, p.egroup]).length === 0);
    };

export const terminals =
    async(): Promise<Terminal[]> => {
        const pInfo: string[][] =
                resultSet(await executeCommandWithShellConfig("ps -eo tty,ruser"));
        return pInfo.filter(p => p[0] !== "?")
                    .map(p => <Terminal> {name: p[0], ruser: p[1]});
    };

export const processes =
    async(): Promise<Process[]> => {
        const pInfo: string[][] =
                resultSet(await executeCommandWithShellConfig("ps -eo pid,time,ruser,cmd"));
        return pInfo.map(p => <Process> {pid: p[0], time: p[1], ruser: p[2], cmd: p[3]});
    };

export const sessions =
    async(): Promise<Session[]> => {
    const pInfo: string[][] =
            resultSet(await executeCommandWithShellConfig("ps -eo sid,ruser,rgroup"));
    return pInfo.map(p => <Session> {sid: p[0], rgroup: p[1]});
};

