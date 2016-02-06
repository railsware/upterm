/* tslint:disable:no-unused-variable */
import * as React from "react";
import Terminal from "../Terminal";

export interface TabProps {
    isActive: boolean;
    activate: () => void;
    position: number;
}

export const TabComponent = ({ isActive, activate, position }: TabProps) =>
    <li className={`tab ${isActive ? "active" : "inactive"}`} onClick={activate}>
        <span className="commandSign">⌘</span>
        <span className="position">{position}</span>
    </li>;

export class Tab {
    public terminals: Terminal[] = [];
    private activeTerminalIndex: number;

    constructor() {
        this.addTerminal();
    }

    addTerminal(): void {
        this.terminals.push(new Terminal(this.contentDimensions));
        this.activeTerminalIndex = this.terminals.length - 1;
    }

    removeActiveTerminal(): void {
        _.pullAt(this.terminals, this.activeTerminalIndex);
        this.activeTerminalIndex = this.terminals.length - 1;

    }

    activeTerminal(): Terminal {
        return this.terminals[this.activeTerminalIndex];
    }

    activateTerminal(terminal: Terminal): void {
        this.activeTerminalIndex = this.terminals.indexOf(terminal);
    }

    activatePreviousTerminal(): boolean {
        const isFirst = this.activeTerminalIndex === 0;
        if (!isFirst) {
            this.activateTerminal(this.terminals[this.activeTerminalIndex - 1]);
        }

        return isFirst;
    }

    activateNextTerminal(): boolean {
        const isLast = this.activeTerminalIndex !== this.terminals.length - 1;
        if (isLast) {
            this.activateTerminal(this.terminals[this.activeTerminalIndex + 1]);
        }

        return isLast;
    }

    updateAllTerminalsDimensions(): void {
        for (const terminal of this.terminals) {
            terminal.dimensions = this.contentDimensions;
        }
    }

    private get contentDimensions(): Dimensions {
        return {
            columns: Math.floor(this.contentSize.width / this.charSize.width),
            rows: Math.floor(this.contentSize.height / this.charSize.height),
        };
    }

    private get contentSize(): Size {
        const titleBarHeight = 24; // Make sure it's the same as $title-bar-height SCSS variable.
        return {
            width: window.innerWidth,
            height: window.innerHeight - titleBarHeight,
        };
    }

    private get charSize(): Size {
        const letter = document.getElementById("sizes-calculation");

        return {
            width: letter.clientWidth + 0.5,
            height: letter.clientHeight,
        };
    };
}
