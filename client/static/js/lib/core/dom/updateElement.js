//dom/updateElement.js

import { addListener, removeListeners } from './listenerManager.js';

function updateElement(element, updates) {
    console.log("updateElement", element, updates)
    // Update text content
    if (typeof updates.text !== 'undefined') {
        element.textContent = updates.text;
    }

    // Update styles
    if (typeof updates.style !== 'undefined') {
        Object.assign(element.style, updates.style);
    }

    // Update attributes
    if (typeof updates.attributes !== 'undefined') {
        Object.keys(updates.attributes).forEach(attr => {
            element.setAttribute(attr, updates.attributes[attr]);
        });
    }

     // Update event listeners
    if (typeof updates.listeners !== 'undefined') {
        removeListeners(element);  // Remove existing listeners
        Object.keys(updates.listeners).forEach(eventType => {
            addListener(element, eventType, updates.listeners[eventType]);
        });
    }

    return element;
}

export { updateElement}

