export function stopBubblingUp(event: Event) {
    event.stopPropagation();
    event.preventDefault();

    return event;
}
