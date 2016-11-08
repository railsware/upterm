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

const gitStatusStyle = (color: string) => ({
  lineHeight: "18px",
  color: color,
});

const buttonStyles = {
  borderColor: colors.blue,
  borderStyle: "solid",
  borderRadius: "4px",
  borderWidth: "1px",
  padding: "2px",
  color: colors.blue,
  WebkitUserSelect: "none",
  fontSize: "10px",
  margin: "4px",
  cursor: "pointer",
};

interface GitBranchProps {
  branches: Branch[];
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
      return <GitBranchComponent branches={gitBranches} />;
    } else {
      return <div style={{ padding: "10px" }}>fatal: Not a git repository (or any of the parent directories): .git</div>
    }
  },

  isApplicable: ({ command }): boolean => {
    return isEqual(command, ["git", "branch"]);
  },
});
