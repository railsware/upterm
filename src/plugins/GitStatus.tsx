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

type StatusMap = {[key:string]: FileStatus[]};

interface GitStatusProps {
  currentBranch: Branch | undefined;
  gitStatus: StatusMap;
  presentWorkingDirectory: string;
}

interface GitStatusState {
  currentBranch: Branch | undefined;
  gitStatus: StatusMap;
}

const groupStatusesByType = (statuses: FileStatus[]): StatusMap => {
  const result: StatusMap = {}
  statuses.forEach(status => {
    if (status.code in result) {
      result[status.code].push(status);
    } else {
      result[status.code] = [status];
    }
  });
  return result;
}

interface GitStatusFileButton {
  buttonText: string;
  action: () => Promise<{}>;
}

interface GitStatusFileProps {
  path: string;
  state: string;
  buttons: GitStatusFileButton[];
}

const GitStatusFile: React.StatelessComponent<GitStatusFileProps> = ({
  path,
  state,
  buttons,
}) => {
  return <div>
    <span style={{paddingLeft: '70px'}}>{state}: {path}</span>
    {buttons.map(({buttonText, action}, index) => <span
      style={buttonStyles}
      onClick={action}
    >
      {buttonText}
    </span>)}
  </div>;
};

interface GitStatusSectionProps {
  sectionType: string,
  files: GitStatusFileProps[],
}

const GitStatusSection: React.StatelessComponent<GitStatusSectionProps> = ({
  sectionType,
  files
}) => {
  if (files.length === 0) {
    return <span style={{ display: "none" }}></span>;
  }
  return <div>
    <div>{sectionType}</div>
    <div style={gitStatusStyle}>{
      files.map((file, i) => <GitStatusFile key={i.toString()} {...file} />)
    }</div>
  </div>;
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

    const stagedFilesDescriptions = (this.state.gitStatus["StagedAdded"] || []).map((file: FileStatus) => ({
      path: file.value,
      state: "added",
      buttons: [],
    }));

    const unstagedFilesDescriptions = (this.state.gitStatus["UnstagedModified"] || []).map((file: FileStatus) => ({
      path: file.value,
      state: "modified",
      buttons: [{
        buttonText: "Add",
        action: async () => {
          await executeCommand("git", ["add", file.value], this.props.presentWorkingDirectory);
          this.reload();
        }
      }],
    }));

    const untrackedFileDescriptions = (this.state.gitStatus["Untracked"] || []).map((file: FileStatus) => ({
      path:file.value,
      state: "",
      buttons: [],
    }));

    const unknownFileDescriptions = (this.state.gitStatus["Invalid"] || []).map((file: FileStatus) => ({
      path: file.value,
      state: "unknown state",
      buttons: [],
    }));

    return <div style={{ padding: "10px" }}>
      <div>{branchText}</div>
      <GitStatusSection
        sectionType="Changes to be committed:"
        files={stagedFilesDescriptions}
      />
      <GitStatusSection
        sectionType="Changes not staged for commit:"
        files={unstagedFilesDescriptions}
      />
      <GitStatusSection
        sectionType="Untracked files:"
        files={untrackedFileDescriptions}
      />
      <GitStatusSection
        sectionType="Unknown state:"
        files={unknownFileDescriptions}
      />
    </div>;
    /*

      <div>{this.state.gitStatus[StatusCode.StagedAdded].map((file, index) => <StagedFile
        gitReset={async (path) => {
          await executeCommand("git", ["reset", path], this.props.presentWorkingDirectory);
          this.reload();
        }}
      />)}</div>

      <div>{this.state.gitStatus[StatusCode.UnstagedModified].map((file, index) => <ModifiedFile
        gitAdd={}
      />)}</div>
    */
  }
}

PluginManager.registerCommandInterceptorPlugin({
  intercept: async({
     command,
     presentWorkingDirectory,
   }): Promise<React.ReactElement<any>> => {
    const gitBranches: Branch[] = await branches(presentWorkingDirectory as any);
    const currentBranch = gitBranches.find(branch => branch.isCurrent());
    const gitStatus = await status(presentWorkingDirectory as any);
    return <GitStatusComponent
      currentBranch={currentBranch}
      gitStatus={groupStatusesByType(gitStatus)}
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
