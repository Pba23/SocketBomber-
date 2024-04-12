class StateManager {
    /**
     * Creates an instance of the StateManager.
     * @param {Object} initialState The initial state object.
     */
    constructor(initialState = {}) {
        this.state = initialState; // The current state
        this.listeners = new Map(); // Map of property listeners
        this.bindings = []; // Array to store bindings for re-rendering
    }

    /**
     * Updates the state and notifies listeners of changed properties.
     * @param {Object} newState A partial state object with updates.
     */
    setState(newState) {
        let shouldRender = false;

        for (const key in newState) {
            if (this.state[key] !== newState[key]) {
                this.state[key] = newState[key]; // Update the state
                shouldRender = true; // Flag to indicate a re-render is needed
                this.notifyListeners(key); // Notify listeners of the change
            }
        }

        if (shouldRender) {
            this.bindings.forEach(binding => {
                binding.render(); // Re-render bound components or elements
            });
        }
    }

    /**
     * Adds a listener for changes to a specific property.
     * @param {String} property The property name to listen for.
     * @param {Function} listener The callback to execute on property changes.
     */
    addListener(property, listener) {
        if (!this.listeners.has(property)) {
            this.listeners.set(property, new Set()); // Initialize a new set of listeners for the property
        }
        this.listeners.get(property).add(listener); // Add the listener to the set
    }

    /**
     * Notifies all listeners about a change to a specific property.
     * @param {String} property The property name that changed.
     */
    notifyListeners(property) {
        if (this.listeners.has(property)) {
            for (const listener of this.listeners.get(property)) {
                listener(this.state[property]); // Execute each listener with the new property value
            }
        }
    }

    /**
     * Removes a listener for a specific property.
     * @param {String} property The property name to remove the listener for.
     * @param {Function} listener The listener function to remove.
     */
    removeListener(property, listener) {
        if (this.listeners.has(property)) {
            const listeners = this.listeners.get(property);
            listeners.delete(listener); // Remove the listener from the set

            if (listeners.size === 0) {
                this.listeners.delete(property); // Clean up the property from the map if no listeners remain
            }
        }
    }
}

export default StateManager;

