import events = require('events');
import Autocompletion = require('./Autocompletion');
import Buffer = require('./Buffer');
import Aliases = require('./Aliases');
import History = require('./History');
import _ = require('lodash');
import i = require('./Interfaces');
import ParsableString = require('./ParsableString');

class Prompt extends events.EventEmitter {
    buffer: Buffer;
    // TODO: change the type.
    history: any;
    private autocompletion = new Autocompletion();
    private commandParts: string[];

    constructor(private directory: string) {
        super();

        this.buffer = new Buffer();
        this.buffer.on('data', () => { this.commandParts = this.expandCommand(this.buffer.toString()); });
        this.history = History;
    }

    execute(): void {
        this.history.append(this.buffer.toString());
        this.emit('send');
    }

    getCommandName(): string {
        return this.getCommand()[0];

    }

    getArguments(): string[] {
        return this.getCommand().slice(1);
    }

    getCommand(): string[] {
        return this.commandParts;
    }

    getSuggestions(): Promise<i.Suggestion[]> {
        return this.autocompletion.getSuggestions(this.directory, this.toParsableString())
    }

    replaceCurrentLexeme(suggestion: i.Suggestion): void {
        var lexemes = this.toParsableString().getLexemes();
        lexemes[lexemes.length - 1] = suggestion.value;

        this.buffer.setTo(lexemes.join(' '));
    }

    private toParsableString(): ParsableString {
        return new ParsableString(this.buffer.toString());
    }

    private static splitCommand(command: string) : string[] {
        // Split by comma, but not inside quotes.
        // http://stackoverflow.com/questions/16261635/javascript-split-string-by-space-but-ignore-space-in-quotes-notice-not-to-spli
        return <string[]>command.match(/(?:[^\s']+|'[^']*')+/g) || [];
    }

    private expandCommand(command: string): Array<string> {
        const args = Prompt.splitCommand(command);

        const commandName = args.shift();
        const alias: string = Aliases.find(commandName);

        if (alias) {
            const aliasArgs = Prompt.splitCommand(alias);
            const isRecursive = aliasArgs[0] == commandName;

            if (isRecursive) {
                return aliasArgs.concat(args)
            } else {
                return this.expandCommand(alias).concat(args);
            }
        } else {
            return args.concat(commandName);
        }
    }
}

export = Prompt;
