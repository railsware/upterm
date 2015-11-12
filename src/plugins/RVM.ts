import * as React from 'react';
import Terminal from "../Terminal";
import PluginManager from "../PluginManager";

const bbPath = '/Users/me/.rvm/gems/ruby-2.1.2@brightbytes/bin:/Users/me/.rvm/gems/ruby-2.1.2@global/bin:/Users/me/.rvm/rubies/ruby-2.1.2/bin:/Users/me/.rvm/bin';

PluginManager.registerEnvironmentObserver({
    currentWorkingDirectoryWillChange: (terminal: Terminal) => {
        if (terminal.currentDirectory === '/Users/me/dev/brightbytes/') {
            process.env.PATH = process.env.PATH.replace(bbPath, '');
            process.env.GEM_HOME = '';
            process.env.GEM_PATH = ''
        }
    },
    currentWorkingDirectoryDidChange: (terminal: Terminal) => {
        if (terminal.currentDirectory === '/Users/me/dev/brightbytes/') {
            process.env.PATH = bbPath + process.env.PATH;
            process.env.GEM_HOME = '/Users/me/.rvm/gems/ruby-2.1.2@brightbytes';
            process.env.GEM_PATH = '/Users/me/.rvm/gems/ruby-2.1.2@brightbytes:/Users/me/.rvm/gems/ruby-2.1.2@global'
        }
    },
});
