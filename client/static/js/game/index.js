import router from "../lib/index.js"
import models from "./models/models.js";
import ws from './websocket.js';
const { createElement, } = router;

// import WebSocket from 'ws';

class Home extends router.Component {
    constructor(props, stateManager) {
        super(props, stateManager);

        this.ws = ws
        // localStorage.removeItem('game');
        // const game = JSON.parse(localStorage.getItem('game'));

        // resp.fromJSON(game || {});


        const resp = new models.Response()
        this.state = resp.object()
    }

    redirectTo = (path) => {
        window.location.pathname = path;
    }

    setState(newState) {
        this.state = newState;
        localStorage.setItem('game', JSON.stringify(newState));
        // this.render();
    }

    joinRoom = () => {
        document.getElementById('newPlayerInput').setAttribute('disabled', 'disabled');
        document.getElementById('join').setAttribute('disabled', 'disabled');

        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ type: 'join', nickname: this.state.player.nickname }));
        } else {
            console.error('WebSocket connection not initialized.');
        }

        // fetch('/join', {
        //     method: 'POST',
        //     headers: {
        //         'Content-Type': 'application/json'
        //     },
        //     body: JSON.stringify({ nickname: this.state.player.nickname })
        // })
        //     .then(response => {
        //         if (!response.ok) {
        //             throw new Error('Network response was not ok');
        //         }
        //         return response.json();
        //     })
        //     .then(data => {
        //         console.log(data)
        //         const game = new models.Response();
        //         game.fromJSON({player: data});
        //         this.setState(game.object())

        //     })
        //     .catch(error => {
        //         console.error('Error:', error);
        //         document.getElementById('newPlayerInput').removeAttribute('disabled');
        //         document.getElementById('join').removeAttribute('disabled');
        //     });
    }

    handleInputChange = (event) => {
        this.setState({ player: { nickname: event.target.value } });
    }

    render() {
        if (this.state.player.id && this.state.team.id) {
            this.redirectTo('/waiting-room');
        }

        return (
            createElement('div', { class: 'game' }, [
                createElement('h1', { class: 'title' }, 'Welcome to Bomberman Tournament'),
                createElement('div', { class: 'box' }, [
                    createElement('input', {
                        class: 'new-nickname',
                        type: 'text',
                        id: 'newPlayerInput',
                        placeholder: 'Choose a nickname',
                        value: this.state.player.nickname,
                        oninput: this.handleInputChange,
                    }),
                    createElement('button', { onclick: this.joinRoom, id: "join" }, 'Join Room')
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