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
  const separator = state.length > 0 ? ": " : "";
  return <div>
    <span style={{paddingLeft: '70px'}}>{state}{separator}{path}</span>
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
    const unmergedFileDescriptions: GitStatusFileProps[] = [];
    const unknownFileDescriptions: GitStatusFileProps[] = [];

    const addFile = (path: string) => async () => {
      await executeCommand("git", ["add", path], this.props.presentWorkingDirectory);
      this.reload();
    }

    const resetFile = (path: string) => async () => {
      await executeCommand("git", ["reset", path], this.props.presentWorkingDirectory);
      this.reload();
    }

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
              action: addFile(file.value)
            }],
          });
          break;
        case "UnstagedDeleted":
          unstagedFilesDescriptions.push({
            path: file.value,
            state: "deleted",
            buttons: [{
              buttonText: "Add",
              action: addFile(file.value),
            }]
          });
          break;
        case "StagedModified":
          stagedFilesDescriptions.push({
            path: file.value,
            state: "modified",
            buttons: [{
              buttonText: "Reset",
              action: resetFile(file.value),
            }]
          });
          break;
        case "StagedModifiedUnstagedModified":
          stagedFilesDescriptions.push({
            path: file.value,
            state: "modified",
            buttons: [{
              buttonText: "Reset",
              action: resetFile(file.value),
            }],
          });
          unstagedFilesDescriptions.push({
            path: file.value,
            state: "modified",
            buttons: [{
              buttonText: "Add",
              action: addFile(file.value),
            }],
          });
          break;
        case "StagedModifiedUnstagedDeleted":
          stagedFilesDescriptions.push({
            path: file.value,
            state: "modified",
            buttons: [{
              buttonText: "Reset",
              action: resetFile(file.value),
            }],
          });
          unstagedFilesDescriptions.push({
            path: file.value,
            state: "deleted",
            buttons: [],
          });
          break;
        case "StagedAdded":
          stagedFilesDescriptions.push({
            path: file.value,
            state: "added",
            buttons: [{
              buttonText: "Reset",
              action: resetFile(file.value),
            }],
          });
        case "StagedAddedUnstagedModified":
          stagedFilesDescriptions.push({
            path: file.value,
            state: "added",
            buttons: [{
              buttonText: "Reset",
              action: resetFile(file.value),
            }]
          });
          unstagedFilesDescriptions.push({
            path: file.value,
            state: 'modified',
            buttons: [{
              buttonText: "Add",
              action: addFile(file.value),
            }],
          });
          break;
        case "StagedAddedUnstagedDeleted":
          stagedFilesDescriptions.push({
            path: file.value,
            state: "added",
            buttons: [{
              buttonText: "Reset",
              action: resetFile(file.value),
            }]
          });
        case "StagedDeleted":
          stagedFilesDescriptions.push({
            path: file.value,
            state: "deleted",
            buttons: [],
          });
          break;
        case "StagedDeletedUnstagedModified":
          stagedFilesDescriptions.push({
            path: file.value,
            state: "deleted",
            buttons: [],
          });
          unstagedFilesDescriptions.push({
            path: file.value,
            state: "modified",
            buttons: [{
              buttonText: "Add",
              action: addFile(file.value),
            }]
          });
          break;
        case "StagedRenamed":
          stagedFilesDescriptions.push({
            path: file.value,
            state: "renamed",
            buttons: [],
          });
          break;
        case "StagedRenamedUnstagedModified":
          stagedFilesDescriptions.push({
            path: file.value,
            state: "renamed",
            buttons: [],
          });
          unstagedFilesDescriptions.push({
            path: file.value,
            state: "modified",
            buttons: [{
              buttonText: "Add",
              action: addFile(file.value),
            }],
          });
          break;
        case "StagedRenamedUnstagedDeleted":
          stagedFilesDescriptions.push({
            path: file.value,
            state: "renamed",
            buttons: [],
          });
          unstagedFilesDescriptions.push({
            path: file.value,
            state: "deleted",
            buttons: [],
          });
          break;
        case "StagedCopied":
          stagedFilesDescriptions.push({
            path: file.value,
            state: "copied",
            buttons: [],
          });
          break;
        case "StagedCopiedUnstagedModified":
          stagedFilesDescriptions.push({
            path: file.value,
            state: "copied",
            buttons: [],
          });
          unstagedFilesDescriptions.push({
            path: file.value,
            state: "modified",
            buttons: [{
              buttonText: "Add",
              action: addFile(file.value),
            }]
          });
          break;
        case "StagedCopiedUnstagedDeleted":
          stagedFilesDescriptions.push({
            path: file.value,
            state: "copied",
            buttons: [],
          });
          unstagedFilesDescriptions.push({
            path: file.value,
            state: "deleted",
            buttons: [],
          });
          break;
        case "UnmergedBothDeleted":
          unmergedFileDescriptions.push({
            path: file.value,
            state: "both deleted",
            buttons: [],
          });
          break;
        case "UnmergedAddedByUs":
          unmergedFileDescriptions.push({
            path: file.value,
            state: "added by us",
            buttons: [],
          });
          break;
        case "UnmergedDeletedByThem":
          unmergedFileDescriptions.push({
            path: file.value,
            state: "deleted by them",
            buttons: [],
          });
          break;
        case "UnmergedAddedByThem":
          unmergedFileDescriptions.push({
            path: file.value,
            state: "added by them",
            buttons: [],
          });
          break;
        case "UnmergedDeletedByUs":
          unmergedFileDescriptions.push({
            path: file.value,
            state: "deleted by us",
            buttons: [],
          });
          break;
        case "UnmergedBothAdded":
          unmergedFileDescriptions.push({
            path: file.value,
            state: "both added",
            buttons: [],
          });
          break;
        case "UnmergedBothModified":
          unmergedFileDescriptions.push({
            path: file.value,
            state: "both modified",
            buttons: [],
          });
          break;
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
        case "Ignored":
          // Git status doesn't show ignored items...
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
        sectionType="Unmerged paths:"
        files={unmergedFileDescriptions}
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
