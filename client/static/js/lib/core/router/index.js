class Router {
    /**
     * Creates an instance of the Router.
     * @param {StateManager} stateManager The StateManager instance (not used in this updated version, but kept for potential future use).
     * @param {Object} routes A mapping of pathnames to component classes.
     */
    constructor(stateManager, routes) {
        this.stateManager = stateManager; // Keep for potential state management integration
        this.routes = routes; // Updated to map paths to component classes
        this.currentComponent = null; // Track the currently mounted component
        this.initialize();
    }

    initialize() {
        window.addEventListener('popstate', () => this.handleNavigation(window.location.pathname));
        this.navigate(window.location.pathname, false); // Load current route component without pushing state
    }

    navigate(path, updateHistory = true) {
        if (updateHistory) {
            window.history.pushState({}, '', path);
        }
        this.handleNavigation(path);
    }

    handleNavigation(path) {
        const Component = this.routes[path];
        if (Component) {
            // Unmount the current component if one is mounted
            if (this.currentComponent && this.currentComponent.unmount) {
                this.currentComponent.unmount();
            }

            // Instantiate and mount the new component
            const container = document.querySelector('#app');
            if (!container) {
                console.error('App container not found');
                return;
            }

            this.currentComponent = new Component({router: this}, this.stateManager);
            this.currentComponent.mount(container);
        } else {
            console.error(`No component defined for ${path}`);
            // Optionally handle 404 not found or redirect to a default route
        }
    }
}

export default Router;

