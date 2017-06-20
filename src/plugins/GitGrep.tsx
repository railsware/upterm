import * as React from "react";
import {PluginManager} from "../PluginManager";
import {Job} from "../shell/Job";
import {Link} from "../utils/Link";
import {join} from "path";
import {colors} from "../views/css/colors";

PluginManager.registerPrettyfier({
  prettify: (job: Job): React.ReactElement<any> => {
    return <div style={{
      padding: "10px",
      lineHeight: "18px",
    }}>{job.output.toLines().map((line, index) => {
      const match = line.match(/^(.*?):(\d+):(.*)$/);
      if (match) {
        const [, path, lineNum, rest] = match;
        if (path && lineNum && rest) {
          const absolutePath = join(job.environment.pwd, path);
          return <div key={index.toString()}>
            <Link absolutePath={absolutePath}>{path}</Link>
            <span style={{color: colors.cyan}}>:</span>
            {lineNum}
            <span style={{color: colors.cyan}}>:</span>
            <span style={{whiteSpace: "pre"}}>{rest}</span>
          </div>;
        }
      }
      return <div key={index.toString()}>{line}</div>;
    })}</div>;
  },

  isApplicable: (job: Job): boolean => {
    try {
      const promptWords = job.prompt.expandedTokens.map(t => t.escapedValue);
      return promptWords.length === 3 && promptWords[0] === "git" && promptWords[1] === "grep";
    } catch (e) {
      return false;
    }
  },
});
