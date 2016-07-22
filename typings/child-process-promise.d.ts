declare module "child-process-promise" {
  function execFile(file: string, args: string[], options: {}): Promise<{stdout: string, stderr: string}>
}
