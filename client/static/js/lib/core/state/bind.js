// src/core/state/bind.js
export default function bind(element, property, stateManager) {
    // Initial sync from state to UI
    if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA' || element.tagName === 'SELECT') {
        element.value = stateManager.state[property];
    } else {
        element.textContent = stateManager.state[property];
    }

    // Update state on UI change
    element.addEventListener('input', (e) => {
        stateManager.setState({ [property]: e.target.value });
    });

    // Subscribe element to state changes
    stateManager.addListener(property, (newValue) => {
        if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA' || element.tagName === 'SELECT') {
            if (element.value !== newValue) {
                element.value = newValue;
            }
        } else {
            if (element.textContent !== newValue) {
                element.textContent = newValue;
            }
        }
    });
}


