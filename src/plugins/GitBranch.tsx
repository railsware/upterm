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
import {colors, background} from "../views/css/colors";
import {executeCommand} from "../PTY";
import Link from "../utils/Link";
import {join} from "path";
import Button from "./autocompletion_utils/Button";
import {failurize} from "../views/css/functions";

const errorMessageStyles = {
  whiteSpace: "pre",
  padding: "10px",
  background: failurize(background),
};

interface GitBranchProps {
  branches: Branch[];
  repoRoot: GitDirectoryPath;
};

interface GitBranchState {
  failReason: string | undefined;
  branches: Branch[];
};

class GitBranchComponent extends React.Component<GitBranchProps, GitBranchState> {
  constructor(props: GitBranchProps) {
    super(props);

    this.state = {
      failReason: undefined,
      branches: props.branches,
    };
  }

  async reload() {
    const newBranches: Branch[] = await branches({
      directory: this.props.repoRoot,
      remotes: false,
      tags: false,
    });
    this.setState({
      branches: newBranches,
      failReason: undefined,
    });
  }

  render(): any {
    return <div>
      {this.state.failReason ? <div style={errorMessageStyles}>{this.state.failReason}</div> : null}
      <div style={{ padding: "10px" }}>
        {this.state.branches.map((branch, index) =>
          <div key={index.toString()} style={branch.isCurrent() ? {color: colors.green} : {}}>
            <span style={{whiteSpace: "pre"}}>{branch.isCurrent() ? "* " : "  "}{branch.toString()}</span>
            <Button onClick={async () => {
              try {
                await executeCommand("git", ["checkout", branch.toString()], this.props.repoRoot)
                this.reload();
              } catch (e) {
                this.setState({ failReason: e.message } as GitBranchState);
              }
            }}>Checkout</Button>
          </div>
        )}
      </div>
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
        repoRoot={await repoRoot(presentWorkingDirectory as GitDirectoryPath)}
      />;
    } else {
      return <div style={{ padding: "10px" }}>fatal: Not a git repository (or any of the parent directories): .git</div>
    }
  },

  isApplicable: ({ command }): boolean => {
    return isEqual(command, ["git", "branch"]);
  },
});
