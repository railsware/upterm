import Session from "../Session";
import PluginManager from "../PluginManager";

/* tslint:disable:max-line-length */
const bbPath = "/Users/me/.rvm/gems/ruby-2.1.2@brightbytes/bin:/Users/me/.rvm/gems/ruby-2.1.2@global/bin:/Users/me/.rvm/rubies/ruby-2.1.2/bin:/Users/me/.rvm/bin";

PluginManager.registerEnvironmentObserver({
    currentWorkingDirectoryWillChange: (session: Session) => {
        if (session.directory === "/Users/me/dev/brightbytes/") {
            session.environment.set("PATH", session.environment.path.replace(bbPath, ""));
            session.environment.set("GEM_HOME", "");
            session.environment.set("GEM_PATH", "");
        }
    },
    currentWorkingDirectoryDidChange: (session: Session) => {
        if (session.directory === "/Users/me/dev/brightbytes/") {
            session.environment.set("PATH", bbPath + session.environment.path);
            session.environment.set("GEM_HOME", "/Users/me/.rvm/gems/ruby-2.1.2@brightbytes");
            session.environment.set("GEM_PATH", "/Users/me/.rvm/gems/ruby-2.1.2@brightbytes:/Users/me/.rvm/gems/ruby-2.1.2@global");
        }
    },
});
