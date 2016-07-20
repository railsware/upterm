import {AutocompletionProvider} from "../../Interfaces";
import {PluginManager} from "../../PluginManager";
import {Suggestion, combine, directoriesSuggestionsProvider, styles} from "./Common";
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

    // Split the description section (which contains the flags) into paragraphs
    /* tslint:disable:no-string-literal */
    let manDescriptionParagraphs = manSections["DESCRIPTION"].reduce(
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

    // Extract the paragraphs that describe flags, and parse out the flag data
    let flagDescriptions = manDescriptionParagraphs.filter(lines => lines.length > 0);
    const optionsProvider: AutocompletionProvider = async() => {
        return flagDescriptions.map(descriptions => {
            let shortFlagWithArgument = descriptions[0].match(/^ *-(\w) (\w*)$/);
            let shortFlagWithoutArgument = descriptions[0].match(/^ *-(\w) *(.*)$/);
            if (shortFlagWithArgument) {
                const flag = shortFlagWithArgument[1];
                const argument = shortFlagWithArgument[2];
                const description = combineManPageLines(descriptions.slice(1));

                return new Suggestion({
                    value: `-${flag}`,
                    style: styles.option,
                    description,
                    displayValue: `-${flag} ${argument}`,
                });
            } else if (shortFlagWithoutArgument) {
                const flag = shortFlagWithoutArgument[1];
                const description = combineManPageLines([shortFlagWithoutArgument[2], ...descriptions.slice(1)]);

                return new Suggestion({
                    value: `-${flag}`,
                    style: styles.option,
                    description,
                });
            }
        }).filter(suggestion => suggestion);
    };
    const allOptions = [optionsProvider, directoriesSuggestionsProvider];
    PluginManager.registerAutocompletionProvider("mkdir", combine(allOptions));
});
