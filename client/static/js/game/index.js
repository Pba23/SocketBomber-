import router from "../lib/index.js"
import models from "./models/models.js";
const { createElement, } = router;

// import WebSocket from 'ws';

class Home extends router.Component {
    constructor(props, stateManager) {
        super(props, stateManager);

        localStorage.removeItem('game');
        const game = JSON.parse(localStorage.getItem('game'));

        const resp = new models.Response()
        resp.fromJSON(game || {});


        this.state = resp.object()
    }

    redirectTo = (path) => {
        this.props.router.navigate(path);
    }

    setState(newState) {
        this.state = newState;
        localStorage.setItem('game', JSON.stringify(newState));
        // this.render();
    }

    joinRoom = () => {
        document.getElementById('newPlayerInput').setAttribute('disabled', 'disabled');
        document.getElementById('join').setAttribute('disabled', 'disabled');
        fetch('/join', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ nickname: this.state.player.nickname })
        })
            .then(response => response.json())
            .then(data => {
                const game = new models.Response();
                game.fromJSON(data);
                this.setState(game.object());
                if (this.state.player.id && this.state.team.id) {
                    this.redirectTo('/waiting-room');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                document.getElementById('newPlayerInput').removeAttribute('disabled');
                document.getElementById('join').removeAttribute('disabled');
            });
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
                createElement('h1', { class: 'title' }, 'Welcome to Bomb City'),
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