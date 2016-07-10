import {PluginManager} from "../../PluginManager";
import {shortFlag, mapSuggestions, combine, anyFilesSuggestionsProvider} from "./Common";
import {mapObject} from "../../utils/Common";

const optionsProvider = mapObject(
    {
        "@": {
            short: "",
            long: "Display extended attribute keys and sizes in long (-l) output.",
        },

        "1": {
            short: "",
            long: "The numeric digit ``one''.)  Force output to be one entry per line.  This is the default when output is not to a terminal.",
        },

        A: {
            short: "",
            long: "List all entries except for . and ...  Always set for the superuser.",
        },

        a: {
            short: "",
            long: "Include directory entries whose names begin with a dot (.).",
        },

        B: {
            short: "",
            long: "Force printing of non-printable characters (as defined by ctype(3) and current locale settings) in file names as \\xxx, where xxx is the numeric value of the character in octal.",
        },

        b: {
            short: "",
            long: "As -B, but use C escape codes whenever possible.",
        },

        C: {
            short: "",
            long: "Force multi-column output; this is the default when output is to a terminal.",
        },

        c: {
            short: "",
            long: "Use time when file status was last changed for sorting (-t) or long printing (-l).",
        },

        d: {
            short: "",
            long: "Directories are listed as plain files (not searched recursively).",
        },

        e: {
            short: "",
            long: "Print the Access Control List (ACL) associated with the file, if present, in long (-l) output.",
        },

        F: {
            short: "",
            long: "Display a slash (`/') immediately after each pathname that is a directory, an asterisk (`*') after each that is executable, an at sign (`@') after each symbolic link, an equals sign (`=') after each socket, a percent sign (`%') after each whiteout, and a vertical bar (`|') after each that is a FIFO.",
        },

        f: {
            short: "",
            long: "Output is not sorted.  This option turns on the -a option.",
        },

        G: {
            short: "",
            long: "Enable colorized output.  This option is equivalent to defining CLICOLOR in the environment.  (See below.)",
        },

        g: {
            short: "",
            long: "This option is only available for compatibility with POSIX; it is used to display the group name in the long (-l) format output (the owner name is suppressed).",
        },

        H: {
            short: "",
            long: "Symbolic links on the command line are followed.  This option is assumed if none of the -F, -d, or -l options are specified.",
        },

        h: {
            short: "",
            long: "When used with the -l option, use unit suffixes: Byte, Kilobyte, Megabyte, Gigabyte, Terabyte and Petabyte in order to reduce the number of digits to three or less using base 2 for sizes.",
        },

        i: {
            short: "",
            long: "For each file, print the file's file serial number (inode number).",
        },

        k: {
            short: "",
            long: "If the -s option is specified, print the file size allocation in kilobytes, not blocks.  This option overrides the environment variable BLOCKSIZE.",
        },

        L: {
            short: "",
            long: "Follow all symbolic links to final target and list the file or directory the link references rather than the link itself.  This option cancels the -P option.",
        },

        l: {
            short: "",
            long: "The lowercase letter ``ell''.)  List in long format.  (See below.)  If the output is to a terminal, a total sum for all the file sizes is output on a line before the long listing.",
        },

        m: {
            short: "",
            long: "Stream output format; list files across the page, separated by commas.",
        },

        n: {
            short: "",
            long: "Display user and group IDs numerically, rather than converting to a user or group name in a long (-l) output.  This option turns on the -l option.",
        },

        O: {
            short: "",
            long: "Include the file flags in a long (-l) output.",
        },

        o: {
            short: "",
            long: "List in long format, but omit the group id.",
        },

        P: {
            short: "",
            long: "If argument is a symbolic link, list the link itself rather than the object the link references.  This option cancels the -H and -L options.",
        },

        p: {
            short: "",
            long: "Write a slash (`/') after each filename if that file is a directory.",
        },

        q: {
            short: "",
            long: "Force printing of non-graphic characters in file names as the character `?'; this is the default when output is to a terminal.",
        },

        R: {
            short: "",
            long: "Recursively list subdirectories encountered.",
        },

        r: {
            short: "",
            long: "Reverse the order of the sort to get reverse lexicographical order or the oldest entries first (or largest files last, if combined with sort by size",
        },

        S: {
            short: "",
            long: "Sort files by size",
        },

        s: {
            short: "",
            long: "Display the number of file system blocks actually used by each file, in units of 512 bytes, where partial units are rounded up to the next integer value.  If the output is to a terminal, a total sum for all the file sizes is output on a line before the listing.  The environment variable BLOCKSIZE overrides the unit size of 512 bytes.",
        },

        T: {
            short: "",
            long: "When used with the -l (lowercase letter ``ell'') option, display complete time information for the file, including month, day, hour, minute, second, and year.",
        },

        t: {
            short: "",
            long: "Sort by time modified (most recently modified first) before sorting the operands by lexicographical order.",
        },

        u: {
            short: "",
            long: "Use time of last access, instead of last modification of the file for sorting (-t) or long printing (-l).",
        },

        U: {
            short: "",
            long: "Use time of file creation, instead of last modification for sorting (-t) or long output (-l).",
        },

        v: {
            short: "",
            long: "Force unedited printing of non-graphic characters; this is the default when output is not to a terminal.",
        },

        W: {
            short: "",
            long: "Display whiteouts when scanning directories.  (-S) flag).",
        },

        w: {
            short: "",
            long: "Force raw printing of non-printable characters.  This is the default when output is not to a terminal.",
        },

        x: {
            short: "",
            long: "The same as -C, except that the multi-column output is produced with entries sorted across, rather than down, the columns.",
        },

    },
    (option, descriptions) => mapSuggestions(shortFlag(option), suggestion => suggestion.withSynopsis(descriptions.short).withDescription(descriptions.long))
);

PluginManager.registerAutocompletionProvider("ls", combine([anyFilesSuggestionsProvider, ...optionsProvider]));
