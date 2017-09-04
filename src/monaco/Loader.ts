export function requireMonaco(callback: () => void) {
    const g = (global as any);
    const nodeRequire = g.require;

    const loaderScript = document.createElement("script");
    loaderScript.type = "text/javascript";
    loaderScript.src = "../../../node_modules/monaco-editor/min/vs/loader.js";

    loaderScript.addEventListener("load", () => {
        const amdRequire = g.require;
        g.require = nodeRequire;
        // require node modules before loader.js comes in
        const path = require("path");

        function uriFromPath(_path: string) {
            let pathName = path.resolve(_path).replace(/\\/g, "/");
            if (pathName.length > 0 && pathName.charAt(0) !== "/") {
                pathName = "/" + pathName;
            }
            return encodeURI("file://" + pathName);
        }

        amdRequire.config({
            baseUrl: uriFromPath(path.join(__dirname, "../../../node_modules/monaco-editor/min")),
        });
        // workaround monaco-css not understanding the environment
        (self as any).module = undefined;
        // workaround monaco-typescript not understanding the environment
        (self as any).process.browser = true;
        amdRequire(["vs/editor/editor.main"], callback);

        // window.require(["vs/editor/editor.main"], () => require("./Main"));
    });
    document.body.appendChild(loaderScript);
}
