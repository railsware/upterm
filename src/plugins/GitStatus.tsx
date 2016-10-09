import * as React from "react";
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

const gitStagedFileStyles = {
  paddingLeft: "70px",
  color: colors.green,
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

interface StagedFileProps {
  path: string;
  gitReset: (path: string) => Promise<void>;
}

interface StagedFileState {
  status: Status;
}

class StagedFile extends React.Component<StagedFileProps, StagedFileState> {
  constructor(props: StagedFileProps) {
    super(props);

    this.state = {status: Status.NotStarted};
  }

  render() {
    return <div>
      <span style={gitStagedFileStyles}>modified: {this.props.path}</span>
      <span
       style={buttonStyles}
       onClick={async() => {
         this.setState({status: Status.InProgress});
         await this.props.gitReset(this.props.path);
       }}
     >{this.state.status === Status.NotStarted ? "Reset" : "Resetting..."}</span>
   </div>
  }
}

class UntrackedFile extends React.Component<{path: string}, {}> {
  constructor(props: {path: string}) {
    super(props);
  }

  render() {
    return <div>
      <span style={gitFileStyles}>{this.props.path}</span>
    </div>
  }
}

class OtherFile extends React.Component<{path: string}, {}> {
  constructor(props: {path: string}) {
    super(props);
  }

  render() {
    return <div>
      <span style={gitFileStyles}>state unknown: {this.props.path}</span>
    </div>
  }
}

interface GitStatus {
  modified: FileStatus[];
  staged: FileStatus[];
  untracked: FileStatus[];
  other: FileStatus[];
}

interface GitStatusProps {
  currentBranch: Branch | undefined;
  gitStatus: FileStatus[][];
  presentWorkingDirectory: string;
}

interface GitStatusState {
  currentBranch: Branch | undefined;
  gitStatus: FileStatus[][];
}

const groupStatusesByType = (statuses: FileStatus[]): FileStatus[][] => {
  const result: FileStatus[][] = [] as FileStatus[][];
  statuses.forEach(status => {
    if (status.code in result) {
      result[status.code].push(status);
    } else {
      result[status.code] = [status];
    }
  });
  return result;
}

class GitStatusComponent extends React.Component<GitStatusProps, GitStatusState> {
  constructor(props: GitStatusProps) {
    super(props);

    this.state = {
      currentBranch: props.currentBranch,
      gitStatus: props.gitStatus,
    }
  }

  async reload() {
    const gitStatus = groupStatusesByType(await status(this.props.presentWorkingDirectory as any));
    const gitBranches: Branch[] = await branches(this.props.presentWorkingDirectory as any);
    const currentBranch = gitBranches.find(branch => branch.isCurrent());
    this.setState({
      currentBranch,
      gitStatus,
    });
  }

  render(): any {
    const branchText = this.state.currentBranch ? `On branch ${this.state.currentBranch.toString()}` : "Not on a branch";

    const indexComponent = <div>
      <div>Changes to be committed:</div>
      <div style={gitStatusStyle}>{this.state.gitStatus[StatusCode.StagedAdded].map((file, index) => <StagedFile
        path={file.value}
        gitReset={async (path) => {
          await executeCommand("git", ["reset", path], this.props.presentWorkingDirectory);
          this.reload();
        }}
        key={file.value}
      />)}</div>
    </div>;

    const workingDirectoryComponent = <div>
      <div>Changes not staged for commit:</div>
      <div style={gitStatusStyle}>{this.state.gitStatus[StatusCode.UnstagedModified].map((file, index) => <ModifiedFile
        path={file.value}
        gitAdd={async (path) => {
          await executeCommand("git", ["add", path], this.props.presentWorkingDirectory);
          this.reload();
        }}
        key={file.value}
      />)}</div>
    </div>;

    const untrackedFilesComponent = <div>
      <div>Untracked files:</div>
      <div style={gitStatusStyle}>{this.state.gitStatus[StatusCode.Untracked].map(file => <UntrackedFile path={file.value} />)}</div>
    </div>

    const unknownFilesComponent = <div>
      <div>Unknown state:</div>
      <div style={gitStatusStyle}>{this.state.gitStatus[StatusCode.Invalid].map(file => <OtherFile path={file.value} />)}</div>
    </div>

    return <div style={{ padding: "10px" }}>
      <div>{branchText}</div>
      {indexComponent}
      {workingDirectoryComponent}
      {untrackedFilesComponent}
      {unknownFilesComponent}
    </div>
  }
}

PluginManager.registerCommandInterceptorPlugin({
  intercept: async({
     command,
     presentWorkingDirectory,
   }): Promise<React.ReactElement<any>> => {
    const gitBranches: Branch[] = await branches(presentWorkingDirectory as any);
    const currentBranch = gitBranches.find(branch => branch.isCurrent());
    return <GitStatusComponent
      currentBranch={currentBranch}
      gitStatus={groupStatusesByType(await status(presentWorkingDirectory as any))}
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
