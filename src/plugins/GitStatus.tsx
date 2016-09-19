import * as React from "react";
import {PluginManager} from "../PluginManager";
import {isEqual} from "lodash";
import {status, FileStatus, isGitDirectory, StatusCode, branches, Branch} from "../utils/Git";
import {colors} from "../views/css/colors";

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

const ModifiedFile:React.StatelessComponent<{path: string}> = ({ path }) => {
  return <div>
    <span style={gitFileStyles}>modified: {path}</span><span
      style={buttonStyles}
      onClick={() => console.log(path)}
    >Add</span>
  </div>
}

PluginManager.registerCommandInterceptorPlugin({
  intercept: async({
     command,
     presentWorkingDirectory,
   }): Promise<React.ReactElement<any>> => {
    const gitStatus: FileStatus[] = await status(presentWorkingDirectory as any);
    const gitBranches: Branch[] = await branches(presentWorkingDirectory as any);
    const currentBranch = gitBranches.find(branch => branch.isCurrent());
    const branchText = currentBranch ? `On branch ${currentBranch.toString()}` : "Not on a branch";

    const unstagedChanges = gitStatus.filter(file => file.code === StatusCode.Modified);
    return <div style={{ padding: "10px" }}>
      <div>{branchText}</div>
      <div style={gitStatusStyle}>{unstagedChanges.map(file => <ModifiedFile path={file.value} />)}</div>
    </div>
  },

  isApplicable: ({
     command,
     presentWorkingDirectory,
   }): boolean => {
    return isEqual(command, ["git", "status"]);
  },
});
