import * as ws from "ws";
import * as http from "http";
import * as url from "url";
import * as net from "net";
import * as express from "express";
import * as fs from "fs";
import * as rpc from "vscode-ws-jsonrpc";
import {xhr, XHRResponse, getErrorStatusDescription} from "request-light";
import Uri from "vscode-uri";
import {MessageReader, MessageWriter} from "vscode-jsonrpc";
import {IConnection, TextDocuments, createConnection} from "vscode-languageserver";
import {
    TextDocument, Diagnostic, CompletionList, CompletionItem, Hover,
    SymbolInformation, DocumentSymbolParams, TextEdit,
} from "vscode-languageserver-types";
import {TextDocumentPositionParams, DocumentRangeFormattingParams} from "vscode-base-languageclient/lib/protocol";
import {getLanguageService, LanguageService, JSONDocument} from "vscode-json-languageservice";

import { listen, MessageConnection } from "vscode-ws-jsonrpc";
import {
    BaseLanguageClient, CloseAction, ErrorAction,
    createMonacoServices, createConnection as createClientConnection,
} from "monaco-languageclient";
import {SessionID} from "../shell/Session";
import {getSuggestions} from "../Autocompletion";
import {services} from "../services/index";
import {scan} from "../shell/Scanner";
import {CompleteCommand} from "../shell/Parser";
const ReconnectingWebSocket = require("reconnecting-websocket");

export function start(reader: MessageReader, writer: MessageWriter): ShellLanguageServer {
    const connection = createConnection(reader, writer);
    const server = new ShellLanguageServer(connection);
    server.start();
    return server;
}

export class ShellLanguageServer {

    protected workspaceRoot: Uri | undefined;

    protected readonly documents = new TextDocuments();

    protected readonly languageService: LanguageService = getLanguageService({
        schemaRequestService: this.resovleSchema.bind(this),
    });

    protected readonly pendingValidationRequests = new Map<string, number>();

    constructor(
        protected readonly connection: IConnection,
    ) {
        this.documents.listen(this.connection);
        this.documents.onDidChangeContent(change =>
            this.validate(change.document),
        );
        this.documents.onDidClose(event => {
            this.cleanPendingValidation(event.document);
            this.cleanDiagnostics(event.document);
        });

        this.connection.onInitialize(params => {
            if (params.rootPath) {
                this.workspaceRoot = Uri.file(params.rootPath);
            } else if (params.rootUri) {
                this.workspaceRoot = Uri.parse(params.rootUri);
            }
            this.connection.console.log("The server is initialized.");
            return {
                capabilities: {
                    textDocumentSync: this.documents.syncKind,
                    completionProvider: {
                        resolveProvider: true,
                        triggerCharacters: ['"', ":"],
                    },
                    hoverProvider: true,
                    documentSymbolProvider: true,
                    documentRangeFormattingProvider: true,
                },
            };
        });
        this.connection.onCompletion(params =>
            this.completion(params),
        );
        this.connection.onCompletionResolve(item =>
            this.resolveCompletion(item),
        );
        this.connection.onHover(params =>
            this.hover(params),
        );
        this.connection.onDocumentSymbol(params =>
            this.findDocumentSymbols(params),
        );
        this.connection.onDocumentRangeFormatting(params =>
            this.format(params),
        );
    }

    start() {
        this.connection.listen();
    }

    protected format(params: DocumentRangeFormattingParams): TextEdit[] {
        const document = this.documents.get(params.textDocument.uri);
        return this.languageService.format(document, params.range, params.options);
    }

    protected findDocumentSymbols(params: DocumentSymbolParams): SymbolInformation[] {
        const document = this.documents.get(params.textDocument.uri);
        const shellDocument = this.getShellDocument(document);
        return this.languageService.findDocumentSymbols(document, shellDocument);
    }

    protected hover(params: TextDocumentPositionParams): Thenable<Hover> {
        const document = this.documents.get(params.textDocument.uri);
        const shellDocument = this.getShellDocument(document);
        return this.languageService.doHover(document, params.position, shellDocument);
    }

    protected resovleSchema(url: string): Promise<string> {
        const uri = Uri.parse(url);
        if (uri.scheme === "file") {
            return new Promise<string>((resolve, reject) => {
                fs.readFile(uri.fsPath, "UTF-8", (err, result) => {
                    err ? reject("") : resolve(result.toString());
                });
            });
        }
        return xhr({url, followRedirects: 5}).then(response => {
            return response.responseText;
        },                                         (error: XHRResponse) => {
            return Promise.reject(error.responseText || getErrorStatusDescription(error.status) || error.toString());
        });
    }

    protected resolveCompletion(item: CompletionItem): Thenable<CompletionItem> {
        return this.languageService.doResolve(item);
    }

    protected async completion(params: TextDocumentPositionParams): Promise<CompletionList> {
        const sessionID: SessionID = <SessionID>Number.parseInt(params.textDocument.uri.match(/inmemory:\/\/(\d+)\.sh/)![1]);
        const session = services.sessions.get(sessionID);
        const text = this.documents.get(params.textDocument.uri).getText();
        console.log(`completion called for "${text}"`);

        const ast = new CompleteCommand(scan(text));

        const suggestions = await getSuggestions({
            currentText: text,
            currentCaretPosition: params.position.character,
            ast: ast,
            environment: session.environment,
            historicalPresentDirectoriesStack: session.historicalPresentDirectoriesStack,
            aliases: session.aliases,
        });

        return {
            isIncomplete: false,
            items: suggestions.map(suggestion => ({
                label: suggestion.value,
                detail: suggestion.description,
            })),
        };
        // const shellDocument = this.getShellDocument(document);
        // return this.languageService.doComplete(document, params.position, shellDocument);
    }

    protected validate(_document: TextDocument): void {
        // console.log("validating");
        // this.cleanPendingValidation(document);
        // this.pendingValidationRequests.set(document.uri, setTimeout(() => {
        //     this.pendingValidationRequests.delete(document.uri);
        //     this.doValidate(document);
        // }));
    }

    protected cleanPendingValidation(document: TextDocument): void {
        const request = this.pendingValidationRequests.get(document.uri);
        if (request !== undefined) {
            clearTimeout(request);
            this.pendingValidationRequests.delete(document.uri);
        }
    }

    protected doValidate(document: TextDocument): void {
        if (document.getText().length === 0) {
            this.cleanDiagnostics(document);
            return;
        }
        const shellDocument = this.getShellDocument(document);
        this.languageService.doValidation(document, shellDocument).then(diagnostics =>
            this.sendDiagnostics(document, diagnostics),
        );
    }

    protected cleanDiagnostics(document: TextDocument): void {
        this.sendDiagnostics(document, []);
    }

    protected sendDiagnostics(document: TextDocument, diagnostics: Diagnostic[]): void {
        this.connection.sendDiagnostics({
            uri: document.uri, diagnostics,
        });
    }

    protected getShellDocument(document: TextDocument): JSONDocument {
        return this.languageService.parseJSONDocument(document);
    }

}

export function launch(socket: rpc.IWebSocket) {
    const reader = new rpc.WebSocketMessageReader(socket);
    const writer = new rpc.WebSocketMessageWriter(socket);
    start(reader, writer);
}
process.on("uncaughtException", function (err: any) {
    console.error("Uncaught Exception: ", err.toString());
    if (err.stack) {
        console.error(err.stack);
    }
});

// create the express application
const app = express();
// server the static content, i.e. index.html
app.use(express.static(__dirname));
// start the server
const server = app.listen(3000, "localhost");
// create the web socket
const wss = new ws.Server({
    noServer: true,
    perMessageDeflate: false,
});

server.on("upgrade", (request: http.IncomingMessage, socket: net.Socket, head: Buffer) => {
    const pathname = request.url ? url.parse(request.url).pathname : undefined;
    if (pathname === "//sampleServer") {
        wss.handleUpgrade(request, socket, head, webSocket => {
            const socket: rpc.IWebSocket = {
                send: content => webSocket.send(content, error => {
                    if (error) {
                        throw error;
                    }
                }),
                onMessage: cb => webSocket.on("message", cb),
                onError: cb => webSocket.on("error", cb),
                onClose: cb => webSocket.on("close", cb),
                dispose: () => {
                    console.log("disposing");
                    webSocket.close();
                },
            };
            // launch the server when the web socket is opened
            if (webSocket.readyState === webSocket.OPEN) {
                launch(socket);
            } else {
                webSocket.on("open", () => launch(socket));
            }
        });
    }
});

/**
 * Client.
 */

// create the web socket
const serverUrl = "ws://localhost:3000//sampleServer";
const webSocket = createWebSocket(serverUrl);
// listen when the web socket is opened
listen({
    webSocket,
    onConnection: connection => {
        // create and start the language client
        const languageClient = createLanguageClient(connection);
        const disposable = languageClient.start();
        connection.onClose(() => disposable.dispose());
    },
});

const monacoServices = createMonacoServices();
function createLanguageClient(connection: MessageConnection): BaseLanguageClient {
    return new BaseLanguageClient({
        name: "Sample Language Client",
        clientOptions: {
            // use a language id as a document selector
            documentSelector: ["shell"],
            // disable the default error handler
            errorHandler: {
                error: () => ErrorAction.Continue,
                closed: () => CloseAction.DoNotRestart,
            },
        },
        services: monacoServices,
        // create a language client connection from the JSON RPC connection on demand
        connectionProvider: {
            get: (errorHandler, closeHandler) => {
                return Promise.resolve(createClientConnection(connection, errorHandler, closeHandler));
            },
        },
    });
}

function createWebSocket(url: string): WebSocket {
    const socketOptions = {
        maxReconnectionDelay: 10000,
        minReconnectionDelay: 1000,
        reconnectionDelayGrowFactor: 1.3,
        connectionTimeout: 10000,
        maxRetries: Infinity,
        debug: false,
    };
    return new ReconnectingWebSocket(url, undefined, socketOptions);
}

monaco.languages.register({
    id: "shell",
});

monaco.languages.setMonarchTokensProvider("shell", {
    tokenizer: ({
        root: [
            [/^\w+/, "executable"],
            [/--?[\w=]+/, "option-name"],
            [/ \w+/, "argument"],
        ],
    }),
} as any);

monaco.editor.defineTheme("upterm-prompt-theme", {
    base: "vs-dark",
    inherit: true,
    rules: [
        { token: "executable", foreground: "1ea81e" },
        { token: "option-name", foreground: "7492ff", fontStyle: "bold" },
        { token: "argument", foreground: "ebf9f9" },
    ],
    colors: {
        "editor.foreground": "#EEE",
        "editor.background": "#292929",
        "editor.lineHighlightBackground": "#292929",
    },
} as any);
