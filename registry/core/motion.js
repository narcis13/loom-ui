export function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function waitForTransition(element) {
  if (prefersReducedMotion()) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    let settled = false;

    function done() {
      if (settled) {
        return;
      }
      settled = true;
      element.removeEventListener("transitionend", done);
      resolve();
    }

    element.addEventListener("transitionend", done, { once: true });
    window.setTimeout(done, 350);
  });
}
