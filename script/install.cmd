@IF EXIST "%~dp0\node.exe" (
  "%~dp0\node.exe"  "%~dp0\install" %*
) ELSE (
  node  "%~dp0\install" %*
)