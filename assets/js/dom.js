/** Minimal element builder. Text goes in as text, never as markup. */
export function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);

  for (const [key, value] of Object.entries(props)) {
    if (value == null || value === false) continue;
    if (key === 'class') node.className = value;
    else if (key === 'text') node.textContent = value;
    else if (key === 'dataset') Object.assign(node.dataset, value);
    else if (key.startsWith('on')) node.addEventListener(key.slice(2).toLowerCase(), value);
    else node.setAttribute(key, value === true ? '' : String(value));
  }

  for (const child of Array.isArray(children) ? children : [children]) {
    if (child == null || child === false) continue;
    node.append(child.nodeType ? child : document.createTextNode(String(child)));
  }
  return node;
}

/** Replaces a node's contents. */
export function fill(node, children) {
  node.replaceChildren(...(Array.isArray(children) ? children : [children]).filter(Boolean));
  return node;
}

/** Plays the entrance transitions once the node is laid out. */
export function animateIn(node) {
  requestAnimationFrame(() => requestAnimationFrame(() => node.classList.add('is-in')));
}
