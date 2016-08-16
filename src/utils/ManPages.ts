import {execFile} from "child-process-promise";
import {Suggestion, contextIndependent, unique} from "../plugins/autocompletion_utils/Common";
import {
    preprocessManPage,
    extractManPageSections,
    extractManPageSectionParagraphs,
    suggestionFromFlagParagraph,
} from "./ManPageParsingUtils";

// Note: this is still pretty experimental. If you want to do man page parsing
// for a new command, expect to have to make some changes here.

// TODO: Handle option descriptions that have empty lines,
// when the spacing for flag descriptions isn't exactly 11
// characters
// Unblocks:
// df
// locate
// TODO: Handle nested options. Unblocks:
// dd

const manPageToOptions = async (command: string): Promise<Suggestion[]> => {
    // use execFile to prevent a command like "; echo test" from running the "echo test"
    const {stdout, stderr} =  await execFile("man", [command], {});
    if (stderr) {
        throw `Error in retrieving man page: ${command}`;
    }
    // "Apply" backspace literals
    const manContents = preprocessManPage(stdout);

    const manSections = extractManPageSections(manContents);

    // Split the description section (which contains the flags) into paragraphs
    /* tslint:disable:no-string-literal */
    const manDescriptionParagraphs: string[][] = extractManPageSectionParagraphs(manSections["DESCRIPTION"]);
    /* tslint:enable:no-string-literal */

    // Extract the paragraphs that describe flags, and parse out the flag data
    return manDescriptionParagraphs.map(suggestionFromFlagParagraph).filter((s: Suggestion | undefined) => s !== undefined) as Suggestion[];
};

export const manPageOptions = (command: string) => unique(contextIndependent(() => manPageToOptions(command)));
