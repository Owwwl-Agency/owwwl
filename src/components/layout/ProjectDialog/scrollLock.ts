const SCROLL_KEYS = new Set(["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "]);
const INTERACTIVE = "a, button, input, textarea, select, [contenteditable]";

/**
 * Native scrolling chains to the page whenever the dialog content cannot scroll any further, so
 * wheel, touch and key events that would do that are cancelled: the page underneath stays put.
 */
export function lockDialogScroll(dialog: HTMLElement, scroller: HTMLElement) {
  let touchY = 0;

  const canScroll = (target: EventTarget | null, delta: number) => {
    if (!(target instanceof Node) || !scroller.contains(target)) return false;
    const max = scroller.scrollHeight - scroller.clientHeight;
    return delta < 0 ? scroller.scrollTop > 0 : scroller.scrollTop < max - 1;
  };

  const onWheel = (event: WheelEvent) => {
    if (!canScroll(event.target, event.deltaY)) event.preventDefault();
  };

  const onTouchStart = (event: TouchEvent) => {
    touchY = event.touches[0].clientY;
  };

  const onTouchMove = (event: TouchEvent) => {
    const y = event.touches[0].clientY;
    const delta = touchY - y;
    touchY = y;
    if (event.cancelable && !canScroll(event.target, delta)) event.preventDefault();
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (!SCROLL_KEYS.has(event.key)) return;
    if (event.target instanceof Element && event.target.closest(INTERACTIVE)) return;
    if (scroller.scrollHeight <= scroller.clientHeight) event.preventDefault();
  };

  const options = { passive: false };
  dialog.addEventListener("wheel", onWheel, options);
  dialog.addEventListener("touchstart", onTouchStart, { passive: true });
  dialog.addEventListener("touchmove", onTouchMove, options);
  dialog.addEventListener("keydown", onKeyDown);

  return () => {
    dialog.removeEventListener("wheel", onWheel);
    dialog.removeEventListener("touchstart", onTouchStart);
    dialog.removeEventListener("touchmove", onTouchMove);
    dialog.removeEventListener("keydown", onKeyDown);
  };
}
