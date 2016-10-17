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

interface GitStatusProps {
  currentBranch: Branch | undefined;
  gitStatus: FileStatus[];
  presentWorkingDirectory: string;
}

interface GitStatusState {
  currentBranch: Branch | undefined;
  gitStatus: FileStatus[];
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
    const gitStatus = await status(this.props.presentWorkingDirectory as any);
    const gitBranches: Branch[] = await branches(this.props.presentWorkingDirectory as any);
    const currentBranch = gitBranches.find(branch => branch.isCurrent());
    this.setState({
      currentBranch,
      gitStatus,
    });
  }

  render(): any {
    const branchText = this.state.currentBranch ? `On branch ${this.state.currentBranch.toString()}` : "Not on a branch";
    const stagedFilesDescriptions: GitStatusFileProps[] = [];
    const unstagedFilesDescriptions: GitStatusFileProps[] = [];
    const untrackedFileDescriptions: GitStatusFileProps[] = [];
    const unknownFileDescriptions: GitStatusFileProps[] = [];

    this.state.gitStatus.forEach((file: FileStatus) => {
      switch (file.code) {
        case "Unmodified":
          // Don't show
          break;
        case "UnstagedModified":
          unstagedFilesDescriptions.push({
            path: file.value,
            state: "modified",
            buttons: [{
              buttonText: "Add",
              action: async () => {
                await executeCommand("git", ["add", file.value], this.props.presentWorkingDirectory);
                this.reload();
              }
            }],
          });
          break;
        case "UnstagedDeleted":
          unstagedFilesDescriptions.push({
            path: file.value,
            state: "deleted",
            buttons: [{
              buttonText: "Add",
              action: async () => {
                await executeCommand("git", ["add", file.value], this.props.presentWorkingDirectory);
                this.reload();
              }
            }]
          });
          break;
        case "StagedModified":
          stagedFilesDescriptions.push({
            path: file.value,
            state: "modified",
            buttons: [{
              buttonText: "Reset",
              action: async() => {
                await executeCommand("git", ["reset", file.value], this.props.presentWorkingDirectory);
                this.reload();
              }
            }]
          });



        case "StagedAdded":
          stagedFilesDescriptions.push({
            path: file.value,
            state: "added",
            buttons: [{
              buttonText: "Reset",
              action: async() => {
                await executeCommand("git", ["reset", file.value], this.props.presentWorkingDirectory);
                this.reload();
              }
            }],
          });


        case "Untracked":
          untrackedFileDescriptions.push({
            path: file.value,
            state: "",
            buttons: [{
              buttonText: "Add",
              action: async() => {
                await executeCommand("git", ["add", file.value], this.props.presentWorkingDirectory);
                this.reload();
              }
            }],
          });
          break;


        case "Invalid":
          unknownFileDescriptions.push({
            path: file.value,
            state: "unknown state",
            buttons: [],
          });
          break;
      }
    });

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
      gitStatus={gitStatus}
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
