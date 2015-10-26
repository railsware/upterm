export function stopBubblingUp(event: Event): Event {
    event.stopPropagation();
    event.preventDefault();

    return event;
}


export function scrollToBottom(): void {
    $('html body').animate({ scrollTop: $(document).height() }, 0);
}
