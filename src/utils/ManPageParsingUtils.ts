import {styles, Suggestion} from "../plugins/autocompletion_utils/Common";

export const combineManPageLines = (lines: string[]) => lines
    .map(line => line.trim())
    .reduce(
        (memo, next) => {
            if (next.endsWith("-")) {
                return memo.concat(next.slice(0, -1));
            } else {
                return memo.concat(next, " ");
            }
        },
        "",
    )
    .trim();

// Man pages have backspace literals, so "apply" them, and remove excess whitespace.
export const preprocessManPage = (contents: string) => contents.replace(/.\x08/g, "").trim();

export const extractManPageSections = (contents: string) => {
    const lines = contents.split("\n");

    let currentSection = "";
    let sections: { [section: string]: string[] } = {};
    lines.forEach((line: string) => {
        if (line.startsWith(" ") || line === "") {
            sections[currentSection].push(line);
        } else {
            currentSection = line;
            if (!sections[currentSection]) {
                sections[currentSection] = [];
            }
        }
    });

    return sections;
};

const isShortFlagWithoutArgument = (manPageLine: string) => /^ *-(\w) *(.*)$/.test(manPageLine);

export const extractManPageSectionParagraphs = (contents: string[]) => {
    let filteredContents: string[] | undefined = undefined;
    const firstFlag = contents.find(isShortFlagWithoutArgument);
    if (firstFlag) {
        const flagMatch = firstFlag.match(/^( *-\w *)/);
        const flagIndentation = " ".repeat(((flagMatch || [""])[0]).length);
        filteredContents = contents.filter((line, index, array) => {
            if (index === 0 || index === array.length - 1) {
                return true;
            }
            if (
                line === "" &&
                array[index - 1].startsWith(flagIndentation) &&
                array[index + 1].startsWith(flagIndentation)
            ) {
                return false;
            }
            return true;
        });
    }

    return (filteredContents ? filteredContents : contents)
    .reduce(
        (memo, next) => {
            if (next === "") {
                memo.push([]);
            } else {
                memo[memo.length - 1].push(next);
            }
            return memo;
        },
        <string[][]>[[]],
    )
    .filter(lines => lines.length > 0);
};

export const suggestionFromFlagParagraph = (paragraph: string[]): Suggestion | undefined => {
    const shortFlagWithArgument = paragraph[0].match(/^ *-(\w) (\w*)$/);
    const shortFlagWithoutArgument = paragraph[0].match(/^ *-(\w) *(.*)$/);
    if (shortFlagWithArgument) {
        const flag = shortFlagWithArgument[1];
        const detail = combineManPageLines(paragraph.slice(1));

        return {
            label: `-${flag}`,
            style: styles.option,
            detail: detail,
            space: true,
        };
    } else if (shortFlagWithoutArgument) {
        const flag = shortFlagWithoutArgument[1];
        const detail = combineManPageLines([shortFlagWithoutArgument[2], ...paragraph.slice(1)]);

        return {
            label: `-${flag}`,
            style: styles.option,
            detail: detail,
        };
    } else {
        return undefined;
    }
};
