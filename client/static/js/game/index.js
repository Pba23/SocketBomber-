import router from "../lib/index.js"
import { ws } from "../utils/socket.js";
import models from "./models/models.js";
const { createElement, } = router;

class Home extends router.Component {
    constructor(props, stateManager) {
        super(props);
        this.router = props.router;
        this.stateManager = stateManager;

        this.state = {
            avatar: "",
            bomb: null,
            id: "",
            life: 0,
            message: null,
            new_position: { x: 0, y: 0 },
            nickname: "",
            position: { x: 0, y: 0 },
            power: "",
            team: { id: "", name: "", map: [], players: [] },
        };
    }

    componentDidMount() {
        ws.onMessage(this.onMessage.bind(this));
    }

    componentWillUnmount() {
        ws.onMessage(null);
    }

    joinRoom(element) {
        const input = document.getElementById('newPlayerInput')
        input.setAttribute('disabled', 'disabled');
        document.getElementById('join').setAttribute('disabled', 'disabled');


        const nickname = input.value.trim();
        if (!nickname) {
            alert('Please enter a nickname');
            input.removeAttribute('disabled');
            document.getElementById('join').removeAttribute('disabled');
            return;
        }

        this.setState({ nickname });
        ws.send({ type: 'join', nickname });
    }

    onMessage(data) {
        if (data.error) {
            let inputElement = document.querySelector('input'); // replace 'input' with the correct selector for your input element
            let joinElement = document.getElementById('join');
            console.log(inputElement, joinElement);

            if (inputElement && inputElement.hasAttribute('disabled')) {
                inputElement.removeAttribute('disabled');
            }

            if (joinElement && joinElement.hasAttribute('disabled')) {
                joinElement.removeAttribute('disabled');
            }
            alert(data.error)
            return
        }

        const game = new models.Response();
        game.fromJSON(data);
        this.setState({ ...game.toObject() });
        this.stateManager.setState({ ...game.toObject()});
        
        if (this.state.team.id && this.state.id) {
            this.router.navigate('/waiting-room');
        }
    }

   

    render() {
        return (
            createElement('div', { class: 'game' }, [
                createElement('h1', { class: 'title' }, 'Welcome to Bomberman Tournament'),
                createElement('div', { class: 'box' }, [
                    createElement('input', {
                        class: 'new-nickname',
                        type: 'text',
                        id: 'newPlayerInput',
                        placeholder: 'Choose a nickname',
                        value: '',
                    }),
                    createElement('button', { onclick: (element) => { this.joinRoom(element) }, id: "join" }, 'Join Room')
                ])
            ])
        );
    }
}

import WaitingRoom from "./waiting-room.js";
import Game from "./game.js";

export default {
    Home,
    WaitingRoom,
    Game
};