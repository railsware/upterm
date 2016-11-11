import * as React from "react";
import {PluginManager} from "../PluginManager";
import {isEqual} from "lodash";
import {
  status,
  FileStatus,
  branches,
  Branch,
  repoRoot,
  GitDirectoryPath,
  isGitDirectory,
} from "../utils/Git";
import {colors} from "../views/css/colors";
import {executeCommand} from "../PTY";
import Link from "../utils/Link";
import {join} from "path";
import Button from "./autocompletion_utils/Button";


interface GitBranchProps {
  branches: Branch[];
  repoRoot: string;
}

class GitBranchComponent extends React.Component<GitBranchProps, {}> {
  constructor(props: GitBranchProps) {
    super(props);
  }

  render(): any {
    return <div style={{ padding: "10px" }}>
      {this.props.branches.map((branch, index) =>
        <div key={index.toString()} style={branch.isCurrent() ? {color: colors.green} : {}}>
          <span style={{whiteSpace: "pre"}}>{branch.isCurrent() ? "* " : "  "}{branch.toString()}</span>
          <Button onClick={() => {
            executeCommand("git", ["checkout", branch.toString()], this.props.repoRoot)
          }}>Checkout</Button>
        </div>
      )}
    </div>;
  }
}

PluginManager.registerCommandInterceptorPlugin({
  intercept: async({ presentWorkingDirectory }): Promise<React.ReactElement<any>> => {
    if (await isGitDirectory(presentWorkingDirectory)) {
      const gitBranches: Branch[] = await branches({
        directory: presentWorkingDirectory as GitDirectoryPath,
        remotes: false,
        tags: false,
      });
      return <GitBranchComponent
        branches={gitBranches}
        repoRoot={await repoRoot(presentWorkingDirectory)}
      />;
    } else {
      return <div style={{ padding: "10px" }}>fatal: Not a git repository (or any of the parent directories): .git</div>
    }
  },

  isApplicable: ({ command }): boolean => {
    return isEqual(command, ["git", "branch"]);
  },
});
