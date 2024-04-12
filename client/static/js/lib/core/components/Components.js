export default class Component {
    constructor(props = {}, stateManager) {
        this.props = props;
        this.state = {};
        this.stateManager = stateManager; // Assuming state management is integrated
        this.element = null; // Will hold the direct reference to the DOM element
        this.subscriptions = []; // For state change listeners
        this.init(); // Custom initialization logic for subclasses
    }

    init() {
        // Initialization logic for subclasses
    }

    setState(newState) {
        const oldState = { ...this.state };
        this.state = { ...this.state, ...newState };

        // Check if the state actually changed to decide on re-rendering
        const stateChanged = Object.keys(newState).some(key => this.state[key] !== oldState[key]);
        if (stateChanged) {
            this.update();
            this.componentDidUpdate(oldState, this.state);
        }
    }

    componentDidMount() {
        // Lifecycle hook for after the component mounts
    }

    componentDidUpdate(oldState, newState) {
        // Lifecycle hook for after the component updates
    }

    componentWillUnmount() {
        // Lifecycle hook for before the component unmounts
        this.unsubscribeAll();
    }

    render() {
        // Should be implemented by subclasses to return HTML content
    }

    subscribeToState(property, callback) {
        this.stateManager.addListener(property, callback);
        this.subscriptions.push({ property, callback });
    }

    unsubscribeAll() {
        this.subscriptions.forEach(({ property, callback }) => {
            this.stateManager.removeListener(property, callback);
        });
        this.subscriptions = [];
    }

    mount(container) {
        let mountPoint = container;
        if (typeof container === 'string') {
            mountPoint = document.querySelector(container);
            if (!mountPoint) {
                console.error(`Cannot find element with selector '${container}'`);
                return;
            }
        } else if (!(container instanceof HTMLElement)) {
            console.error('The mount function requires a selector string or an HTMLElement.');
            return;
        }

        mountPoint.appendChild(this.render()); // Append the component's content to the mount point
        this.element = mountPoint; // Keep a reference to the mounted element
        this.componentDidMount(); // Call the mounted lifecycle hook
        this.bindEvents(); // Attach any required event listeners
    }

    unmount() {
        if (this.element) {
            this.componentWillUnmount(); // Lifecycle hook before unmounting
            this.element.innerHTML = ''; // Clear the component's content
        }
    }

    update() {
        if (this.element) {
            this.element.innerHTML = this.render(); // Re-render the component's content
            this.bindEvents(); // Re-attach event listeners as necessary
        }
    }

    bindEvents() {
        // Placeholder for subclasses to attach event listeners
    }
}

