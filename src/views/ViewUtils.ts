export function stopBubblingUp(event: Event) {
    event.stopPropagation();
    event.preventDefault();

    return event;
}


export function scrollToBottom() {
    $('html body').animate({ scrollTop: $(document).height() }, 0);
}
