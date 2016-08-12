import {Suggestion, styles} from "../plugins/autocompletion_utils/Common";

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
        ""
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

export const extractManPageSectionParagraphs = (contents: string[]) => {
    return contents
    .reduce(
        (memo, next) => {
            if (next === "") {
                memo.push([]);
            } else {
                memo[memo.length - 1].push(next);
            }
            return memo;
        },
        <string[][]>[[]]
    )
    .filter(lines => lines.length > 0);
};

export const suggestionFromFlagParagraph = (paragraph: string[]): Suggestion | undefined => {
    const shortFlagWithArgument = paragraph[0].match(/^ *-(\w) (\w*)$/);
    const shortFlagWithoutArgument = paragraph[0].match(/^ *-(\w) *(.*)$/);
    if (shortFlagWithArgument) {
        const flag = shortFlagWithArgument[1];
        const argument = shortFlagWithArgument[2];
        const description = combineManPageLines(paragraph.slice(1));

        return new Suggestion({
            value: `-${flag}`,
            style: styles.option,
            description,
            displayValue: `-${flag} ${argument}`,
            space: true,
        });
    } else if (shortFlagWithoutArgument) {
        const flag = shortFlagWithoutArgument[1];
        const description = combineManPageLines([shortFlagWithoutArgument[2], ...paragraph.slice(1)]);

        return new Suggestion({
            value: `-${flag}`,
            style: styles.option,
            description,
        });
    } else {
        return undefined;
    }
};
