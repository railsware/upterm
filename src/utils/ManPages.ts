import {execFile} from "child-process-promise";
import {contextIndependent, unique, Suggestion} from "../plugins/completion_utils/Common";
import {
    preprocessManPage,
    extractManPageSections,
    extractManPageSectionParagraphs,
    suggestionFromFlagParagraph,
} from "./ManPageParsingUtils";

// Note: this is still pretty experimental. If you want to do man page parsing
// for a new command, expect to have to make some changes here.

// TODO: Fix -l option for locate
// TODO: Handle nested options. Unblocks:
// dd

const manPageToOptions = async (command: string, section="DESCRIPTION"): Promise<Suggestion[]> => {
    // use execFile to prevent a command like "; echo test" from running the "echo test"
    const {stdout, stderr} =  await execFile("man", [command], {});
    if (stderr) {
        throw `Error in retrieving man page: ${command}`;
    }
    // "Apply" backspace literals
    const manContents = preprocessManPage(stdout);

    const manSections = extractManPageSections(manContents);

    // Make sure section is in manSections
    if (!(section in manSections)) {
        throw `Error in retrieving section "${section}" from man page: ${command}`;
    }

    // Split the description section (which contains the flags) into paragraphs
    /* tslint:disable:no-string-literal */
    const manDescriptionParagraphs: string[][] = extractManPageSectionParagraphs(manSections[section]);
    /* tslint:enable:no-string-literal */

    // Extract the paragraphs that describe flags, and parse out the flag data
    return manDescriptionParagraphs.map(suggestionFromFlagParagraph).filter((s: Suggestion | undefined) => s !== undefined) as Suggestion[];
};

export const manPageOptions = (command: string, section="DESCRIPTION") => unique(contextIndependent(() => manPageToOptions(command, section)));
