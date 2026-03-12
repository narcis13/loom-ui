const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

export function getFocusableElements(root) {
  return Array.from(root.querySelectorAll(FOCUSABLE)).filter((element) => !element.hidden);
}

export function trapFocus(container) {
  function handleKeydown(event) {
    if (event.key !== "Tab") {
      return;
    }

    const focusables = getFocusableElements(container);
    if (focusables.length === 0) {
      event.preventDefault();
      return;
    }

    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  container.addEventListener("keydown", handleKeydown);
  const [first] = getFocusableElements(container);
  first?.focus();

  return () => releaseFocus(container, handleKeydown);
}

export function releaseFocus(container, handler) {
  container.removeEventListener("keydown", handler);
}
