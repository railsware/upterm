/*import * as React from "react";
import {PluginManager} from "../PluginManager";
import {isEqual} from "lodash";
import {Status} from "../Enums";
import {status, FileStatus, isGitDirectory, StatusCode, branches, Branch} from "../utils/Git";
import {colors} from "../views/css/colors";
import {executeCommand} from "../PTY";

const gitFileStyles = {
  paddingLeft: "70px",
  color: colors.red,
}

const gitStatusStyle = {
  lineHeight: "18px",
}

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
}

interface ModifiedFileProps {
  path: string;
  gitAdd: (path: string) => Promise<void>;
}

interface ModifiedFileState {
  status: Status;
}

class ModifiedFile extends React.Component<ModifiedFileProps, ModifiedFileState> {
  constructor(props: ModifiedFileProps) {
    super(props);

    this.state = {status: Status.NotStarted};
  }

  render() {
    return <div>
      <span style={gitFileStyles}>modified: {this.props.path}</span>
      <span
       style={buttonStyles}
       onClick={async() => {
         this.setState({status: Status.InProgress});
         await this.props.gitAdd(this.props.path);
       }}
     >{this.state.status === Status.NotStarted ? "Add" : "Adding..."}</span>
   </div>
  }
}

interface GitStatusProps {
  currentBranch: Branch | undefined;
  unstagedChanges: FileStatus[];
  presentWorkingDirectory: string;
}

interface GitStatusState {
  currentBranch: Branch | undefined;
  unstagedChanges: FileStatus[];
}

class GitStatus extends React.Component<GitStatusProps, GitStatusState> {
  constructor(props: GitStatusProps) {
    super(props);

    this.state = {
      currentBranch: props.currentBranch,
      unstagedChanges: props.unstagedChanges,
    }
  }

  async reload() {
    const gitStatus: FileStatus[] = await status(this.props.presentWorkingDirectory as any);
    const gitBranches: Branch[] = await branches(this.props.presentWorkingDirectory as any);
    const currentBranch = gitBranches.find(branch => branch.isCurrent());
    const unstagedChanges = gitStatus.filter(file => file.code === StatusCode.Modified);
    this.setState({
      currentBranch,
      unstagedChanges,
    });
  }

  render() {
    const branchText = this.state.currentBranch ? `On branch ${this.state.currentBranch.toString()}` : "Not on a branch";
    return <div style={{ padding: "10px" }}>
      <div>{branchText}</div>
      <div style={gitStatusStyle}>{this.state.unstagedChanges.map(file => <ModifiedFile path={file.value} gitAdd={async (path) => {
          await executeCommand("git", ["add", path], this.props.presentWorkingDirectory);
          this.reload();
      }}/>)}</div>
    </div>
  }
}

PluginManager.registerCommandInterceptorPlugin({
  intercept: async({
     command,
     presentWorkingDirectory,
   }): Promise<React.ReactElement<any>> => {
    const gitStatus: FileStatus[] = await status(presentWorkingDirectory as any);
    const gitBranches: Branch[] = await branches(presentWorkingDirectory as any);
    const currentBranch = gitBranches.find(branch => branch.isCurrent());
    const unstagedChanges = gitStatus.filter(file => file.code === StatusCode.Modified);
    return <GitStatus
      currentBranch={currentBranch}
      unstagedChanges={unstagedChanges}
      presentWorkingDirectory={presentWorkingDirectory}
    />;
  },

  isApplicable: ({
     command,
     presentWorkingDirectory,
   }): boolean => {
    return isEqual(command, ["git", "status"]);
  },
});
*/
