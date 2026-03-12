let uidCount = 0;

export function uid(prefix = "loom") {
  uidCount += 1;
  return `${prefix}-${uidCount}`;
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function debounce(fn, wait = 0) {
  let timeoutId = null;

  return (...args) => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => fn(...args), wait);
  };
}
