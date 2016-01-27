import Job from "../../Job";
import * as _ from "lodash";
import PluginManager from "../../PluginManager";
import {ShortOption} from "./Suggestions";

const options = _.map(
    {
        b: {
            short: "Batch mode operation",
            long: "Starts  top  in  ’Batch  mode’,  which could be useful for sending\
               output from top to other programs or to a file.  In this mode, top\
               will  not  accept input and runs until the iterations limit you’ve\
               set with the ’-n’ command-line option or until killed.",
        },

        c: {
            short: "Command line/Program name toggle",
            long: "Starts top with the last remembered ’c’ state reversed.  Thus,  if\
                top was displaying command lines, now that field will show program\
                names, and visa  versa.   See  the  ’c’  interactive  command  for\
                additional information.",
        },

        d: {
            short: "Delay time interval as: -d ss.tt (seconds.tenths)",
            long: "Specifies  the  delay  between  screen  updates, and overrides the\
                corresponding value in one’s personal configuration  file  or  the\
                startup  default.   Later  this can be changed with the ’d’ or ’s’\
                interactive commands.\
\
                Fractional seconds are honored,  but  a  negative  number  is  not\
                allowed.   In  all  cases, however, such changes are prohibited if\
                top is running in ’Secure mode’, except for root (unless  the  ’s’\
                command-line  option  was  used).   For  additional information on\
                ’Secure mode’ see topic 5a. SYSTEM Configuration File.",
        },

        h: {
            short: "Help",
            long: "Show library version and the usage prompt, then quit.",
        },

        H: {
            short: "Threads toggle",
            long: "Starts top with the last remembered ’H’ state reversed.  When this\
                toggle   is   On,   all  individual  threads  will  be  displayed.\
                Otherwise, top displays a summation of all threads in a process.",
        },

        i: {
            short: "Idle Processes toggle", long: "Starts top with the last remembered ’i’ state reversed.  When this\
                toggle  is  Off,  tasks  that  are  idled  or  zombied will not be\
                displayed.",
        },

        n: {
            short: "Number of iterations limit as: -n number",
            long: "Specifies the maximum number of iterations, or frames, top  should\
                produce before ending.",
        },

        u: {
            short: "Monitor by user as:  -u somebody",
            long: "Monitor only processes with an effective UID or user name matching\
                that given.",
        },

        U: {
            short: "Monitor by user as:  -U somebody",
            long: "Monitor only processes with a  UID  or  user  name  matching  that\
                given.   This matches real, effective, saved, and filesystem UIDs.",
        },

        p: {
            short: "Monitor PIDs as:  -pN1 -pN2 ...  or  -pN1, N2 [,...]",
            long: "Monitor only processes with specified process  IDs.   This  option\
                can  be given up to 20 times, or you can provide a comma delimited\
                list  with  up  to  20  pids.   Co-mingling  both  approaches   is\
                permitted.\
\
                This is a command-line option only.  And should you wish to return\
                to normal operation, it is not necessary to quit and  and  restart\
                top  --  just issue the ’=’ interactive command.",
        },

        s: {
            short: "Secure mode operation",
            long: "Starts  top  with secure mode forced, even for root.  This mode is\
                far better controlled through the system configuration  file  (see\
                topic 5. FILES).",
        },

        S: {
            short: "Cumulative time mode toggle",
            long: "Starts  top  with  the  last  remembered ’S’ state reversed.  When\
                ’Cumulative mode’ is On, each process is listed with the cpu  time\
                that  it and its dead children have used.  See the ’S’ interactive\
                command for additional information regarding this mode.",
        },

        v: {
            short: "Version",
            long: "Show library version and the usage prompt, then quit.",
        },
    },
    (descriptions, option) => new ShortOption(option, descriptions.short).withDescription(descriptions.long)
);


PluginManager.registerAutocompletionProvider({
    forCommand: "top",
    getSuggestions: async (job: Job) => {
        const prompt = job.prompt;

        if (prompt.arguments.length) {
            return options;
        }

        return [];
    },
});
