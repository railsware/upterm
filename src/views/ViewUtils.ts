import * as _ from 'lodash';

export function stopBubblingUp(event: Event): Event {
    event.stopPropagation();
    event.preventDefault();

    return event;
}

export function scrollToBottom(): void {
    $('html body').animate({ scrollTop: $(document).height() }, 0);
}

export var keys = {
    goUp: (event: KeyboardEvent) => (event.ctrlKey && event.keyCode === 80) || event.keyCode === 38,
    goDown: (event: KeyboardEvent) => (event.ctrlKey && event.keyCode === 78) || event.keyCode === 40,
    enter: (event: KeyboardEvent) => event.keyCode === 13,
    tab: (event: KeyboardEvent) => event.keyCode === 9,
    deleteWord: (event: KeyboardEvent) => event.ctrlKey && event.keyCode === 87,
    interrupt: (event: KeyboardEvent) => event.ctrlKey && event.keyCode === 67
};

