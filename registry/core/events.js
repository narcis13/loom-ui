export function on(target, type, listener, options) {
  target.addEventListener(type, listener, options);
  return () => target.removeEventListener(type, listener, options);
}

export function once(target, type, listener, options) {
  return on(target, type, listener, { ...options, once: true });
}

export function delegate(target, type, selector, listener, options) {
  return on(
    target,
    type,
    (event) => {
      const match = event.target instanceof Element ? event.target.closest(selector) : null;
      if (!match) {
        return;
      }
      listener(event, match);
    },
    options,
  );
}

export function onOutsideClick(target, boundary, listener, options) {
  return on(
    target,
    "click",
    (event) => {
      if (!(event.target instanceof Node)) {
        return;
      }
      if (!boundary.contains(event.target)) {
        listener(event);
      }
    },
    options,
  );
}
