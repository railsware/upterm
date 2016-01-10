export function stopBubblingUp(event: Event): Event {
    event.stopPropagation();
    event.preventDefault();

    return event;
}

export function scrollToBottom(): void {
    let terminal = $(".terminal.active");
    terminal.scrollTop(terminal[0].scrollHeight);
}

export const keys = {
    goUp: (event: KeyboardEvent) => (event.ctrlKey && event.keyCode === 80) || event.keyCode === 38,
    goDown: (event: KeyboardEvent) => (event.ctrlKey && event.keyCode === 78) || event.keyCode === 40,
    enter: (event: KeyboardEvent) => event.keyCode === 13,
    tab: (event: KeyboardEvent) => event.keyCode === 9,
    deleteWord: (event: KeyboardEvent) => event.ctrlKey && event.keyCode === 87,
    interrupt: (event: KeyboardEvent) => event.ctrlKey && event.keyCode === 67,
};

