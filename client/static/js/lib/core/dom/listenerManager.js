// dom/listenersManager.js

let listenerIdCounter = 0;
const elementListenersMap = new Map();

function addListener(element, eventType, listener) {

        if (!element) {
        console.error('Attempted to add a listener to a non-existent element');
        return;
    }

    // Initialize element._listenerId if it doesn't exist
    if (!element._listenerId) {
        element._listenerId = ++listenerIdCounter;
    }


    // Retrieve existing listeners for the element, or initialize if none exist
    const listeners = elementListenersMap.get(element._listenerId) || {};
    
    // Check if there's already a listener array for the event type, if not, initialize it
    if (!listeners[eventType]) {
        listeners[eventType] = [];
    } else if (!Array.isArray(listeners[eventType])) {
        // If the existing listener is not an array (for backward compatibility), convert it into an array
        listeners[eventType] = [listeners[eventType]];
    }

    // Add the new listener to the array for the eventType
    listeners[eventType].push(listener);
    element.addEventListener(eventType, listener);

    // Update the map with the new or updated listeners object
    elementListenersMap.set(element._listenerId, listeners);
}

function removeListeners(element) {
    if (!element._listenerId) return;
    const listeners = elementListenersMap.get(element._listenerId);
    if (listeners) {
        Object.keys(listeners).forEach(eventType => {
            // Assuming each eventType can have multiple listeners
            const eventListeners = listeners[eventType];
            if (Array.isArray(eventListeners)) {
                eventListeners.forEach(listener => element.removeEventListener(eventType, listener));
            } else {
                // Handle the case where it's a single function directly
                element.removeEventListener(eventType, eventListeners);
            }
        });
    }
    elementListenersMap.delete(element._listenerId);
}

export { addListener, removeListeners }

