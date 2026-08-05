export function element(tag, attributes = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attributes)) {
    if (key === 'className') node.className = value; else if (key === 'text') node.textContent = value; else if (key.startsWith('on') && typeof value === 'function') node.addEventListener(key.slice(2).toLowerCase(), value); else if (value !== false && value != null) node.setAttribute(key, value === true ? '' : String(value));
  }
  for (const child of Array.isArray(children) ? children : [children]) if (child != null) node.append(child.nodeType ? child : document.createTextNode(String(child)));
  return node;
}
export function clear(node) { while (node.firstChild) node.firstChild.remove(); }
export function option(value, label) { return element('option', { value, text: label }); }
