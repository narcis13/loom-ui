export function $(selector, root = document) {
  return root.querySelector(selector);
}

export function $$(selector, root = document) {
  return Array.from(root.querySelectorAll(selector));
}

export function closest(element, selector) {
  return element?.closest(selector) ?? null;
}

export function create(tagName, attributes = {}, children = []) {
  const element = document.createElement(tagName);

  for (const [name, value] of Object.entries(attributes)) {
    if (value == null) {
      continue;
    }
    element.setAttribute(name, String(value));
  }

  for (const child of children) {
    element.append(child);
  }

  return element;
}
