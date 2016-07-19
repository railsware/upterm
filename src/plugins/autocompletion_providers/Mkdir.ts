import {PluginManager} from "../../PluginManager";
import {shortFlag, mapSuggestions, combine, directoriesSuggestionsProvider} from "./Common";
import {mapObject} from "../../utils/Common";
import {exec} from "child_process";

const combineManPageLines = (lines: string[]) => lines
    .map(line => line.trim())
    .reduce(
        (memo, next) => {
            if (next.endsWith("-")) {
                return memo.concat(next.slice(0, -1));
            } else {
                return memo.concat(next, " ");
            }
        },
        ""
    );

exec("man mkdir", {}, (error: any, stdout: string, stderr: string) => {
    // "Apply" backspace literals
    const manContents = stdout.replace(/.\x08/g, "");
    // Split into lines, skipping starting and ending newlines
    const manLines = manContents.trim().split("\n");
    // Sepearate sections
    let currentSection = "";
    let manSections: { [section: string]: string[] } = {};
    manLines.forEach(line => {
        if (line.startsWith(" ") || line === "") {
            manSections[currentSection].push(line);
        } else {
            currentSection = line;
            if (!manSections[currentSection]) {
                manSections[currentSection] = [];
            }
        }
    });

    /* tslint:disable:no-string-literal */
    let manDescriptionSections = manSections["DESCRIPTION"].reduce(
    /* tslint:enable:no-string-literal */
        (memo, next) => {
            if (next === "") {
                memo.push([]);
            } else {
                memo[memo.length - 1].push(next);
            }
            return memo;
        },
        <string[][]>[[]]
    );

    let flagDescriptions = manDescriptionSections.filter(lines => lines.length > 0);
    let flagMap: { [flag: string]: string } = {};
    flagDescriptions.forEach(description => {
        let shortFlagWithArgument = description[0].match(/^ *-(\w \w*)$/);
        let shortFlagWithoutArgument = description[0].match(/^ *-(\w) *(.*)$/);
        if (shortFlagWithArgument) {
            flagMap[shortFlagWithArgument[1]] = combineManPageLines(description.slice(1));
        } else if (shortFlagWithoutArgument) {
            flagMap[shortFlagWithoutArgument[1]] = combineManPageLines([shortFlagWithoutArgument[2], ...description.slice(1)]);
        }
    });
    const optionsProvider = mapObject(flagMap, (option, descriptions) => mapSuggestions(shortFlag(option), suggestion => suggestion.withDescription(descriptions)));
    PluginManager.registerAutocompletionProvider("mkdir", combine([...optionsProvider, directoriesSuggestionsProvider]));
});
