import * as React from "react";
import {PluginManager} from "../PluginManager";
import {isEqual} from "lodash";
import {
  status,
  FileStatus,
  branches,
  Branch,
  repoRoot,
  isGitDirectory,
  GitDirectoryPath,
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

interface GitStatusProps {
  currentBranch: Branch | undefined;
  gitStatus: FileStatus[];
  repoRoot: string;
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
  absolutePath: string;
  path: string;
  state: string;
  buttons: GitStatusFileButton[];
}

const GitStatusFile: React.StatelessComponent<GitStatusFileProps> = ({
  absolutePath,
  path,
  state,
  buttons,
}) => {
  const separator = state.length > 0 ? ": " : "";
  return <div>
    <span style={{paddingLeft: "70px"}}>
      {state}
      {separator}
      <Link absolutePath={absolutePath}>{path}</Link>
    </span>
    {buttons.map(({buttonText, action}, index) => <span
      style={buttonStyles}
      onClick={action}
      key={index.toString()}
    >
      {buttonText}
    </span>)}
  </div>;
};

interface GitStatusSectionProps {
  sectionType: string;
  files: GitStatusFileProps[];
  color: string;
};

const GitStatusSection: React.StatelessComponent<GitStatusSectionProps> = ({
  sectionType,
  files,
  color,
}) => {
  if (files.length === 0) {
    return <span style={{ display: "none" }}></span>;
  }
  return <div>
    <div>{sectionType}</div>
    <div style={gitStatusStyle(color)}>{
      files.map((file, i) => <GitStatusFile key={i.toString()} {...file} />)
    }</div>
  </div>;
};

class GitStatusComponent extends React.Component<GitStatusProps, GitStatusState> {
  constructor(props: GitStatusProps) {
    super(props);

    this.state = {
      currentBranch: props.currentBranch,
      gitStatus: props.gitStatus,
    };
  }

  async reload() {
    const gitStatus = await status(this.props.repoRoot as any);
    const gitBranches: Branch[] = await branches({
      directory: this.props.repoRoot as GitDirectoryPath,
      remotes: false,
      tags: false,
    });
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
      await executeCommand("git", ["add", path], this.props.repoRoot);
      this.reload();
    };

    const resetFile = (path: string) => async () => {
      await executeCommand("git", ["reset", path], this.props.repoRoot);
      this.reload();
    };

    this.state.gitStatus.forEach((file: FileStatus) => {
      const absolutePath = join(this.props.repoRoot, file.value);
      switch (file.code) {
        case "Unmodified":
          // Don"t show
          break;
        case "UnstagedModified":
          unstagedFilesDescriptions.push({
            absolutePath: absolutePath,
            path: file.value,
            state: "modified",
            buttons: [{
              buttonText: "Add",
              action: addFile(file.value),
            }],
          });
          break;
        case "UnstagedDeleted":
          unstagedFilesDescriptions.push({
            absolutePath: absolutePath,
            path: file.value,
            state: "deleted",
            buttons: [{
              buttonText: "Add",
              action: addFile(file.value),
            }],
          });
          break;
        case "StagedModified":
          stagedFilesDescriptions.push({
            absolutePath: absolutePath,
            path: file.value,
            state: "modified",
            buttons: [{
              buttonText: "Reset",
              action: resetFile(file.value),
            }],
          });
          break;
        case "StagedModifiedUnstagedModified":
          stagedFilesDescriptions.push({
            absolutePath: absolutePath,
            path: file.value,
            state: "modified",
            buttons: [{
              buttonText: "Reset",
              action: resetFile(file.value),
            }],
          });
          unstagedFilesDescriptions.push({
            absolutePath: absolutePath,
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
            absolutePath: absolutePath,
            path: file.value,
            state: "modified",
            buttons: [{
              buttonText: "Reset",
              action: resetFile(file.value),
            }],
          });
          unstagedFilesDescriptions.push({
            absolutePath: absolutePath,
            path: file.value,
            state: "deleted",
            buttons: [],
          });
          break;
        case "StagedAdded":
          stagedFilesDescriptions.push({
            absolutePath: absolutePath,
            path: file.value,
            state: "added",
            buttons: [{
              buttonText: "Reset",
              action: resetFile(file.value),
            }],
          });
          break;
        case "StagedAddedUnstagedModified":
          stagedFilesDescriptions.push({
            absolutePath: absolutePath,
            path: file.value,
            state: "added",
            buttons: [{
              buttonText: "Reset",
              action: resetFile(file.value),
            }],
          });
          unstagedFilesDescriptions.push({
            absolutePath: absolutePath,
            path: file.value,
            state: "modified",
            buttons: [{
              buttonText: "Add",
              action: addFile(file.value),
            }],
          });
          break;
        case "StagedAddedUnstagedDeleted":
          stagedFilesDescriptions.push({
            absolutePath: absolutePath,
            path: file.value,
            state: "added",
            buttons: [{
              buttonText: "Reset",
              action: resetFile(file.value),
            }],
          });
          unstagedFilesDescriptions.push({
            absolutePath: absolutePath,
            path: file.value,
            state: "deleted",
            buttons: [{
              buttonText: "Add",
              action: addFile(file.value),
            }],
          });
          break;
        case "StagedDeleted":
          stagedFilesDescriptions.push({
            absolutePath: absolutePath,
            path: file.value,
            state: "deleted",
            buttons: [],
          });
          break;
        case "StagedDeletedUnstagedModified":
          stagedFilesDescriptions.push({
            absolutePath: absolutePath,
            path: file.value,
            state: "deleted",
            buttons: [],
          });
          unstagedFilesDescriptions.push({
            absolutePath: absolutePath,
            path: file.value,
            state: "modified",
            buttons: [{
              buttonText: "Add",
              action: addFile(file.value),
            }],
          });
          break;
        case "StagedRenamed":
          stagedFilesDescriptions.push({
            absolutePath: absolutePath,
            path: file.value,
            state: "renamed",
            buttons: [],
          });
          break;
        case "StagedRenamedUnstagedModified":
          stagedFilesDescriptions.push({
            absolutePath: absolutePath,
            path: file.value,
            state: "renamed",
            buttons: [],
          });
          unstagedFilesDescriptions.push({
            absolutePath: absolutePath,
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
            absolutePath: absolutePath,
            path: file.value,
            state: "renamed",
            buttons: [],
          });
          unstagedFilesDescriptions.push({
            absolutePath: absolutePath,
            path: file.value,
            state: "deleted",
            buttons: [],
          });
          break;
        case "StagedCopied":
          stagedFilesDescriptions.push({
            absolutePath: absolutePath,
            path: file.value,
            state: "copied",
            buttons: [],
          });
          break;
        case "StagedCopiedUnstagedModified":
          stagedFilesDescriptions.push({
            absolutePath: absolutePath,
            path: file.value,
            state: "copied",
            buttons: [],
          });
          unstagedFilesDescriptions.push({
            absolutePath: absolutePath,
            path: file.value,
            state: "modified",
            buttons: [{
              buttonText: "Add",
              action: addFile(file.value),
            }],
          });
          break;
        case "StagedCopiedUnstagedDeleted":
          stagedFilesDescriptions.push({
            absolutePath: absolutePath,
            path: file.value,
            state: "copied",
            buttons: [],
          });
          unstagedFilesDescriptions.push({
            absolutePath: absolutePath,
            path: file.value,
            state: "deleted",
            buttons: [],
          });
          break;
        case "UnmergedBothDeleted":
          unmergedFileDescriptions.push({
            absolutePath: absolutePath,
            path: file.value,
            state: "both deleted",
            buttons: [],
          });
          break;
        case "UnmergedAddedByUs":
          unmergedFileDescriptions.push({
            absolutePath: absolutePath,
            path: file.value,
            state: "added by us",
            buttons: [],
          });
          break;
        case "UnmergedDeletedByThem":
          unmergedFileDescriptions.push({
            absolutePath: absolutePath,
            path: file.value,
            state: "deleted by them",
            buttons: [],
          });
          break;
        case "UnmergedAddedByThem":
          unmergedFileDescriptions.push({
            absolutePath: absolutePath,
            path: file.value,
            state: "added by them",
            buttons: [],
          });
          break;
        case "UnmergedDeletedByUs":
          unmergedFileDescriptions.push({
            absolutePath: absolutePath,
            path: file.value,
            state: "deleted by us",
            buttons: [],
          });
          break;
        case "UnmergedBothAdded":
          unmergedFileDescriptions.push({
            absolutePath: absolutePath,
            path: file.value,
            state: "both added",
            buttons: [],
          });
          break;
        case "UnmergedBothModified":
          unmergedFileDescriptions.push({
            absolutePath: absolutePath,
            path: file.value,
            state: "both modified",
            buttons: [],
          });
          break;
        case "Untracked":
          untrackedFileDescriptions.push({
            absolutePath: absolutePath,
            path: file.value,
            state: "",
            buttons: [{
              buttonText: "Add",
              action: addFile(file.value),
            }],
          });
          break;
        case "Ignored":
          // Git status doesn't show ignored items...
          break;
        default:
        case "Invalid":
          unknownFileDescriptions.push({
            absolutePath: absolutePath,
            path: file.value,
            state: "unknown state",
            buttons: [],
          });
          break;
      }
    });

    return <div style={{ padding: "10px" }}>
      <div>{branchText}</div>
      {this.state.gitStatus.length === 0 ? <div>Nothing to commit, working tree clean.</div> : undefined}
      <GitStatusSection
        sectionType="Changes to be committed:"
        files={stagedFilesDescriptions}
        color={colors.green}
      />
      <GitStatusSection
        sectionType="Changes not staged for commit:"
        files={unstagedFilesDescriptions}
        color={colors.red}
      />
      <GitStatusSection
        sectionType="Unmerged paths:"
        files={unmergedFileDescriptions}
        color={colors.red}
      />
      <GitStatusSection
        sectionType="Untracked files:"
        files={untrackedFileDescriptions}
        color={colors.red}
      />
      <GitStatusSection
        sectionType="Unknown state:"
        files={unknownFileDescriptions}
        color={colors.red}
      />
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
      const currentBranch = gitBranches.find(branch => branch.isCurrent());
      const gitStatus = await status(presentWorkingDirectory as any);
      const root = await repoRoot(presentWorkingDirectory);
      return <GitStatusComponent
        currentBranch={currentBranch}
        gitStatus={gitStatus}
        repoRoot={root}
      />;
    } else {
      return <div style={{ padding: "10px" }}>fatal: Not a git repository (or any of the parent directories): .git</div>;
    }
  },

  isApplicable: ({ command }): boolean => {
    return isEqual(command, ["git", "status"]);
  },
});
