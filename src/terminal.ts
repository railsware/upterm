/// <reference path="references.ts" />

var AnsiParser: AnsiParserConstructor = require('node-ansiparser');

module BlackScreen {
    export class Terminal {
        shell: Shell;
        document: any;
        parser: any;

        constructor(document: HTMLElement) {
            this.shell = new Shell();
            this.document = document;

            this.shell.on('data', this.processANSI.bind(this)).on('end', function () {
                Terminal.appendToOutput(this.shell.buffer.toString());
                this.shell.buffer = new Buffer(this.shell.dimensions);
                this.createPrompt();
            }.bind(this));

            this.createPrompt();
            this.parser = new AnsiParser({
                inst_p: (text: string) => {
                    for (var i = 0; i != text.length; ++i) {
                        this.shell.buffer.write(new Char(text.charAt(i)));
                    }
                    console.log('print', text);
                },
                inst_o: function (s: any) {
                    console.error('osc', s);
                },
                inst_x: (flag: any) => {
                    console.log('execute', flag.charCodeAt(0));

                    //if (flag.charCodeAt(0) == 13) {
                    //    Terminal.appendToOutput('\r');
                    //} else
                    if (flag.charCodeAt(0) == 10) {
                        this.shell.buffer.write(new Char('\n'));
                    } else if (flag.charCodeAt(0) == 9) {
                        this.shell.buffer.write(new Char('\t'));
                    } else {
                        console.error('execute', flag.charCodeAt(0));
                    }
                },
                inst_c: function (collected: any, params: any, flag: any) {
                    console.error('csi', collected, params, flag);
                },
                inst_e: function (collected: any, flag: any) {
                    console.error('esc', collected, flag);
                }
            });

        }

        createPrompt() {
            Terminal.currentInput().removeClass('currentInput');
            Terminal.currentOutput().removeClass('currentOutput');

            var newInput = this.document.createElement("input");
            newInput.type = "text";
            $(newInput).addClass('currentInput');
            this.document.getElementById('board').appendChild(newInput);
            newInput.focus();
            this.addKeysHandler();

            var container = this.document.createElement("pre");
            container.className += 'currentOutput';

            this.document.getElementById('board').appendChild(container);
            $('html, body').animate({scrollTop: $(document).height()}, 'slow');
        }

        addKeysHandler() {
            Terminal.currentInput().keydown(function (e: JQueryKeyEventObject) {
                if (e.which === 13) {
                    this.shell.execute(Terminal.currentInput().val());
                    return false;
                }

                // Ctrl+P, ↑.
                if ((e.ctrlKey && e.keyCode === 80) || e.keyCode === 38) {
                    Terminal.currentInput().val(this.shell.history.previous());

                    return false;
                }

                // Ctrl+N, ↓.
                if ((e.ctrlKey && e.keyCode === 78) || e.keyCode === 40) {
                    Terminal.currentInput().val(this.shell.history.next());

                    return false;
                }
            }.bind(this));
        }

        processANSI(data: string) {
            this.parser.parse(data);
        }

        static appendToOutput(text: string) {
            Terminal.currentOutput()[0].innerHTML += text;
        }

        static currentInput() {
            return $('.currentInput');
        }

        static currentOutput() {
            return $('.currentOutput');
        }

        resize(dimensions: Dimensions) {
            this.shell.resize(dimensions);
        }
    }
}

module.exports = BlackScreen.Terminal;
