//dom/createElement.js

function createElement(tagName, attributes = {}, children = [], condition = true) {
    if (!condition) {
        return document.createDocumentFragment();
    }

    const element = document.createElement(tagName);

    // Set attributes and event listeners
    Object.keys(attributes).forEach(key => {
        if (key.startsWith('on') && typeof attributes[key] === 'function') {
            // It's an event listener
            const eventType = key.substring(2).toLowerCase();
            element.addEventListener(eventType, attributes[key]);
        } else {
            // It's a regular attribute
            element.setAttribute(key, attributes[key]);
            if (element.tagName === 'INPUT' && key === 'checked' && !attributes[key]) {
                // Special case for input elements
                element.removeAttribute('checked');
            }

            if (element.tagName === "BUTTON" && key === 'disabled' && attributes[key]) {
                // Special case for button elements
                element.removeAttribute('disabled');
            }
            if (element.tagName === "AUDIO" && key === "loop" && !attributes[key]) {
                // Special case for audio elements
                element.removeAttribute("loop");
            }

        }
    });

    // Ensure children is always an array
    const safeChildren = Array.isArray(children) ? children : [children];

    // Recursively append children
    const appendChildren = (parent, children) => {
        children.forEach(child => {
            if (typeof child === 'string') {
                parent.appendChild(document.createTextNode(child));
            } else if (Array.isArray(child)) {
                // If child is an array, recursively append its elements
                appendChildren(parent, child);
            } else if (child instanceof Node) {
                parent.appendChild(child);
            } else if (child === null || child === undefined) {
                // Optionally handle null or undefined children
                // For example, by ignoring them or appending a placeholder
                // This part is up to your requirements
            } else {
                console.warn('Unsupported child type:', child);
            }
        });
    };

    // Append children to the element
    appendChildren(element, safeChildren);

    return element;
}


export { createElement };

