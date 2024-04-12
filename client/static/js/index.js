import router from "./lib/index.js";
import engine from "./game/index.js"


const stateManager = new router.StateManager();
const routes = {
    '/': engine.Home,
    '/waiting-room': engine .WaitingRoom,
    '/game': engine.Game
}

router.addListener(document, "DOMContentLoaded", () => {
    new router.Router(stateManager, routes);
});