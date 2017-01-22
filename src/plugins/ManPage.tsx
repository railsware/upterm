import * as React from "react";
import {PluginManager} from "../PluginManager";
import {executeCommand} from "../PTY";
import {shell} from "electron";
import {v4} from "uuid";

type Props = {
    man: string,
};

type State = {
    html: undefined | string,
    uniqueId: string,
};

const postprocesManHTML = (element: HTMLElement, uniqueId: string) => {
    Array.prototype.slice.call(element.getElementsByTagName("a")).forEach((link: any) => {
        // Apply color to links so they aren't blue on blue
        link.style.color = "rgb(149, 162, 255)";
        const href = link.getAttribute("href");
        if (href && !href.startsWith("#")) {
            // Make links to external websites open in the system's
            // Web browser
            link.onclick = (event: any) => {
                event.preventDefault();
                shell.openExternal(link.href);
            };
        } else if (href) {
            // Modify element ID's to not conflict with other man pages
            // That might be displayed from previous commands
            link.setAttribute("href", `#${uniqueId}${href.slice(1)}`);

            // The default scroll behaviour puts the section title underneath the
            // "propmt header" so we need to override it :(
            // TODO: make the prompt header be non-fixed, so this isn't an issue
            link.onclick = (event: any) => {
                event.preventDefault();
                const sibling: any = document.getElementsByName(link.getAttribute("href").slice(1))[0].previousElementSibling;
                sibling.scrollIntoView();
            };
        } else if (link.hasAttribute("name")) {
            // Modify <a> names to have the correct target for our modifies # links
            link.setAttribute("name", `${uniqueId}${link.getAttribute("name")}`);
        }
    });

    // Remove font colors added by groff as we want to control the color ourselves
    Array.prototype.slice.call(element.getElementsByTagName("font")).forEach((font: any) => {
        font.removeAttribute("color");
    });

    // Remove <hr /> tags if they are the first or last in the document
    const [firstHR, lastHR] = element.getElementsByTagName("hr");
    if (firstHR && firstHR.previousElementSibling.tagName === "TITLE" && (firstHR.previousElementSibling as any).innerText === "") {
        firstHR.remove();
    }
    if (lastHR && !lastHR.nextElementSibling) {
        lastHR.remove();
    }
};

class HTMLManPageComponent extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            html: undefined,
            uniqueId: v4(),
        };

        executeCommand("man", ["-w", props.man], "", {
            maxBuffer: 1024 * 1024 * 4, // 5mb
        })
        .then(path => executeCommand("groff", ["-mandoc", "-Thtml", path], "", {
            maxBuffer: 1024 * 1024 * 4, // 5mb
        }))
        .then(html => this.setState({ html } as State))
        .catch(() => this.setState({ html: `Failed to load HTML man page for ${props.man}` } as State));
    }

    render() {
        if (this.state.html) {
            return <div
                className="manPage"
                style={{
                    fontFamily: "serif",
                    fontSize: "1.3em",
                    padding: "20px",
                }}
                dangerouslySetInnerHTML={{ __html: this.state.html }}
                ref={e => {
                    if (e) {
                        postprocesManHTML(e, this.state.uniqueId);
                    }
                }}
            />;
        }
        return <div>loading HTML man page...</div>;
    }
}

PluginManager.registerCommandInterceptorPlugin({
    intercept: async({ command }): Promise<React.ReactElement<any>> => {
        return <HTMLManPageComponent man={command[1]} />;
    },

    isApplicable: ({ command }): boolean => {
        // Matches man page with a single arg that isn't a flag.
        return command.length === 2 && command[0] === "man" && !(command[1].startsWith("-"));
    },
});
