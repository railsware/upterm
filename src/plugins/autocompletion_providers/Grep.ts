import {PluginManager} from "../../PluginManager";
import {
    longFlag, longAndShortFlag, mapSuggestions, anyFilesSuggestionsProvider,
    Suggestion, styles, anyFilesSuggestions, directoriesSuggestions, provide,
} from "../autocompletion_utils/Common";
import combine from "../autocompletion_utils/Combine";
import {io, mapObject} from "../../utils/Common";

// Grep option suggestions based on linux  man file:
// http://linux.die.net/man/1/grep
const baseOptions = combine(mapObject(
    {
        // Generic Program Information
        "version": {
            short: "V",
            description: `Print the version number of grep to standard error.`,
        },
        // Matcher Selection
        "basic-regexp": {
            short: "G",
            description: `Interpret PATTERN as a basic regular expression. This is the default.`,
        },
        "perl-regexp": {
            short: "P",
            description: `Interpret PATTERN as a Perl regular expression.`,
        },
        // Matching Control
        "regexp": {
            short: "e",
            description: `Print the byte offset within the input file before each line of output`,
        },
        "file=": {
            short: "",
            description: `Obtain  patterns  from  FILE, one per line`,
        },
        "ignore-case": {
            short: "i",
            description: `Ignore case distinctions in both the PATTERN and the input files`,
        },
        "invert-match": {
            short: "v",
            description: `Invert the sense of matching, to select non-matching lines`,
        },
        "word-regexp": {
            short: "w",
            description: `Select only those  lines  containing  matches  that  form  whole words`,
        },
        "line-regexp": {
            short: "x",
            description: `Select only those matches that exactly match the whole line`,
        },
        // General Output Control
        "count": {
            short: "c",
            description: `Suppress normal output; instead print a count of matching lines for each input
                file. With the -v, --invert-match option (see below), count non-matching lines.`,
        },
        "color=": {
            short: "",
            description: `Surround the matching string with the marker find in GREP_COLOR environment variable`,
        },
        "files-without-match": {
            short: "L",
            description: `Suppress normal output; instead print the name of each input file from which no
            output would normally have been printed. The scanning will stop on the first match`,
        },
        "files-with-match": {
            short: "l",
            description: `Suppress normal output; instead print the name of each input file from which output
                would normally have been printed. The scanning will stop on the first match.`,
        },
        "max-count": {
            short: "m",
            description: `Stop reading a file after NUM matching lines. If the input is standard input from a
                regular file, and NUM matching lines are output, grep ensures that the standard input is positioned
                to just after the last matching line before exiting, regardless of the presence of trailing context
                lines.`,
        },
        "only-matching": {
            short: "o",
            description: `Print only the matched (non-empty) parts of a matching line, with each such part on a
                separate output line`,
        },
        "quiet": {
            short: "q",
            description: `Quiet; do not write anything to standard output. Exit immediately with zero status if
                any match is found, even if an error was detected.`,
        },
        "silent": {
            short: "",
            description: `Quiet; do not write anything to standard output. Exit immediately with zero status if
                any match is found, even if an error was detected.`,
        },
        "no-messages": {
            short: "s",
            description: `Suppress error messages about nonexistent or unreadable files`,
        },
        // Output Line Prefix Control
        "byte-offset": {
            short: "b",
            description: `Print the byte offset within the input file before each line of output.`,
        },
        "with-filename": {
            short: "H",
            description: `Quiet; do not write anything to standard output. Exit immediately with zero status
                if any match is found, even if an error was detected.`,
        },
        "no-filename": {
            short: "h",
            description: `Suppress the prefixing of file names on output. This is the default when there is
                only one file (or only standard input) to search.`,
        },
        "label=": {
            short: "",
            description: `Display input actually coming from standard input as input coming from file LABEL.`,
        },
        "line-number": {
            short: "n",
            description: `Prefix each line of output with the 1-based line number within its input file.`,
        },
        "initial-tab": {
            short: "T",
            description: `Make sure that the first character of actual line content lies on a tab stop, so
                that the alignment of tabs looks normal.`,
        },
        "unix-byte-offsets": {
            short: "u",
            description: `Report Unix-style byte offsets. This  switch causes grep to report byte offsets
                as if the file were Unix-style text file, i.e. with CR characters stripped off`,
        },
        "null": {
            short: "Z",
            description: `Output a zero byte (the ASCII NUL character) instead of the character that normally
                follows a file name`,
        },
        // Context Line Control
        "after-context": {
            short: "A",
            description: `Print NUM lines of trailing context after matching lines. Places a line containing a
                group separator (--) between contiguous groups of matches.`,
        },
        "before-context": {
            short: "B",
            description: `Print NUM lines of leading context before matching lines. Places a line containing
                a group separator (--) between contiguous groups of matches.`,
        },
        "context": {
            short: "C",
            description: `Print NUM lines of output context. Places a line containing a group separator (--)
                between contiguous groups of matches.`,
        },
        // File and Directory Selection
        "text": {
            short: "a",
            description: `Process a binary file as if it were text, equivalent to --binary-files=text`,
        },
        "binary-files=": {
            short: "r",
            description: `Read all files under each directory, recursively; this is equivalent to the
                -d recurse option`,
        },
        "devices=": {
            short: "D",
            description: `If an input file is a device, FIFO or socket, use ACTION to process  it`,
        },
        "directories=": {
            short: "d",
            description: `If an input file is a directory, use ACTION to process it. By default, ACTION is
                read, which means that directories are read just as if they were ordinary files.`,
        },
        "exclude=": {
            short: "",
            description: `Recurse in directories skip file matching PATTERN.`,
        },
        "exclude-from=": {
            short: "",
            description: `Skip files whose base name matches any of the file-name globs read from FILE (using
                wildcard matching as described under --exclude).`,
        },
        "exclude-dir=": {
            short: "",
            description: `Exclude directories matching the pattern DIR from recursive searches.`,
        },
        "include=": {
            short: "",
            description: `Search only files whose base name matches GLOB (using wildcard matching as described
                under --exclude).`,
        },
        "recursive": {
            short: "r",
            description: `Read all files under each directory, recursively; this is equivalent to the -d
                recurse option.`,
        },
        "line-buffered": {
            short: "",
            description: `Use line buffering on output. This can cause a performance penalty.`,
        },
        "binary": {
            short: "U",
            description: `Treat the file(s) as binary`,
        },
        "null-data": {
            short: "z",
            description: `Treat the input as a set of lines, each terminated by a zero byte (the ASCII NUL
                character) instead of a newline.`,
        },
    },
    (option, info) => {
        if (info.short) {
            return mapSuggestions(longAndShortFlag(option, info.short),
                                  suggestion => suggestion.withDescription(info.description));
        } else {
            return mapSuggestions(longFlag(option),
                                  suggestion => suggestion.withDescription(info.description));
        }
    },
));

const extendedRegexOption = combine([
    mapSuggestions(longAndShortFlag("extended-regexp", "E"), suggestion => suggestion.withDescription(`
        Interpret <pattern> (defined using --regexp=<pattern> as an extended regular expression`)),
]);

const fixedStringsOption = combine([
    mapSuggestions(longAndShortFlag("fixed-strings", "F"), suggestion => suggestion.withDescription(`
        Interpret <pattern> (defined using --regexp=<pattern>) as a list of fixed strings, separated
        by new-lines lines, any of which is to be matched`)),
]);

const binaryFilesValues = [
    {
        flag: "binary-files",
        displayValue: "binary",
        description: `(default) Outputs either a one-line message saying that a binary file matches or
            no message if there is no match`,
    },
    {
        flag: "binary-files",
        displayValue: "without-match",
        description: `Assumes that a binary file does not match.`,
    },
    {
        flag: "binary-files",
        displayValue: "text",
        description: `Processes a binary file as if it were text.`,
    }];

const devicesValues = [
    {
        flag: "devices",
        displayValue: "read",
        description: `(default) Devices are read just as if they were ordinary files`,
    },
    {
        flag: "devices",
        displayValue: "skip",
        description: `Devices are silently skipped`,
    }];

const colorValues = [
    {
        flag: "color",
        displayValue: "never",
        description: `Never highlight the matching pattern`,
    },
    {
        flag: "color",
        displayValue: "always",
        description: `Always highlight the matching pattern`,
    },
    {
        flag: "color",
        displayValue: "auto",
        description: `Auto highlight the matching pattern`,
    }];

const directoriesValues = [
    {
        flag: "directories",
        displayValue: "read",
        description: `(Default) Directories are read just as if they were ordinary files.`,
    },
    {
        flag: "directories",
        displayValue: "skip",
        description: `Directories are silently skipped.`,
    },
    {
        flag: "directories",
        displayValue: "recurse",
        description: `grep reads all files under each directory, recursively;
            this is equivalent to the -r option.`,
    }];

const fixedValueSuggestions = provide(async context => {
    const token = context.argument.value;
    let optionValues: any[] = [];

    if (token.startsWith("--binary-files=")) {
        optionValues = binaryFilesValues;
    } else if (token.startsWith("--devices=")) {
        optionValues = devicesValues;
    } else if (token.startsWith("--color=")) {
        optionValues = colorValues;
    } else if (token.startsWith("--directories=")) {
        optionValues = directoriesValues;
    } else {
        return [];
    }
    return optionValues.map(item =>
        new Suggestion({value: "--" + item.flag + "=" + item.displayValue, displayValue: item.displayValue,
                        description: item.description, style: styles.optionValue}));
});

const fileValueSuggestions = provide(async context => {
    const tokenValue = "--file=";
    const token = context.argument.value;

    if (token.startsWith(tokenValue)) {
        const workingDirectory = context.environment.pwd;
        const optionValue = token.slice(tokenValue.length);
        const fileSuggestions = await anyFilesSuggestions(optionValue, workingDirectory);
        return fileSuggestions.map(item =>
                new Suggestion({value: tokenValue + item.value, displayValue: item.displayValue,
                    style: io.directoryExists(workingDirectory + item.value) ? styles.directory : styles.optionValue}));
    } else {
        return [];
    }
});

const excludeFromSuggestions = provide(async context => {
    const tokenValue = "--exclude-from=";
    const token = context.argument.value;

    if (token.startsWith(tokenValue)) {
        const workingDirectory = context.environment.pwd;
        const optionValue = token.slice(tokenValue.length);
        const fileSuggestions = await anyFilesSuggestions(optionValue, workingDirectory);
        return fileSuggestions.map(item =>
                new Suggestion({value: tokenValue + item.value, displayValue: item.displayValue,
                    style: io.directoryExists(workingDirectory + item.value) ? styles.directory : styles.optionValue}));
    } else {
        return [];
    }
});

const excludeDirSuggestions = provide(async context => {
    const tokenValue = "--exclude-dir=";
    const token = context.argument.value;

    if (token.startsWith(tokenValue)) {
        const workingDirectory = context.environment.pwd;
        const optionValue = token.slice(tokenValue.length);
        const directorySuggestions = await directoriesSuggestions(optionValue, workingDirectory);
        return directorySuggestions.map(item =>
                new Suggestion({value: tokenValue + item.value, displayValue: item.displayValue,
                    style: styles.directory}));
    } else {
        return [];
    }
});

const commonOptions = combine([baseOptions, fixedValueSuggestions, fileValueSuggestions,
    anyFilesSuggestionsProvider, excludeFromSuggestions, excludeDirSuggestions]);

const grepOptions = combine([commonOptions, fixedStringsOption, extendedRegexOption]);

const eGrepOptions = combine([commonOptions, extendedRegexOption]);

const fGrepOptions = combine([commonOptions, fixedStringsOption]);

PluginManager.registerAutocompletionProvider("grep", combine([grepOptions]));

PluginManager.registerAutocompletionProvider("egrep", combine([eGrepOptions]));

PluginManager.registerAutocompletionProvider("fgrep", combine([fGrepOptions]));
