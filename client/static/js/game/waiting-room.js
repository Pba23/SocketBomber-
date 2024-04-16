import router from "../lib/index.js"
import models from "./models/models.js";
import { ws } from "../utils/socket.js";

const { createElement, appendChildren } = router;

class WaitingRoom extends router.Component {
    constructor(props, stateManager) {
        super(props);
        this.router = props.router;
        this.stateManager = stateManager;

        if (!this.stateManager.state.id) {
            this.router.navigate('/');
        }
    }

    componentDidMount() {
        ws.onMessage(this.onMessage.bind(this));
    }

    componentWillUnmount() {
        ws.onMessage(null);
    }

    onMessage(data) {
        if (data.error) {
            alert(data.error);
            this.router.navigate('/');
        }

        const resp = new models.Response().fromJSON(data);

        if (data.type === 'join') {
            this.setState({ team: { ...this.state.team, players: resp.team.players } });
        }

        if (data.type === 'playing') {
            this.setState({ team: { ...this.state.team, state: 'playing', map: resp.team.map } });
            this.stateManager.setState({ ...this.state });
            this.router.navigate('/game');
        }
    }

    update() {
        // for all state changes this method will be called
    }


    countdown(duration) {
        const endTime = new Date().getTime() + (duration * 1000);

        function updateTime() {
            const now = new Date().getTime();
            const distance = endTime - now;

            if (distance < 0) {
                document.getElementById('countdown').innerHTML = '';
            } else {
                // const days = Math.floor(distance / (1000 * 60 * 60 * 24));
                // const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                // const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                // const seconds = Math.floor((distance % (1000 * 60)) / 1000);
                const seconds = Math.floor(distance / 1000);

                document.getElementById('countdown').innerHTML = `Game starts in ${seconds}`;

                requestAnimationFrame(updateTime);
            }
        }

        updateTime();
    }


    render() {

        // const playerList = this.state.team && this.state.team.players ? this.state.team.players.map(player => {
        //     if (player.id !== this.state.player.id) {
        //         return createElement('li', { class: 'player' }, [
        //             createElement('img', { class: 'player-avatar', src: player.avatar }),
        //             createElement('span', { class: 'player-name' }, player.nickname),
        //         ]);
        //     }
        // }
        // ) : [];

        return createElement('div', { class: 'waiting-room' }, [
            createElement('div', { class: 'team' }, [
                createElement('h1', { class: 'team-name' }, this.state.team ? this.state.team.name : ''),
            ]),
            createElement('div', { class: 'header' }, [
                createElement('div', { class: 'player' }, [
                    createElement('img', { class: 'player-avatar', src: this.state.player ? this.state.player.avatar : '' }),
                ]),
                createElement('span', { class: 'players-header' }, [
                    createElement('h2', { class: 'player-name' }, `Nickname: ${this.state.player ? this.state.player.nickname : ''}`),
                    createElement('div', { class: 'waiting' }, [
                        createElement('h3', { class: 'players-header-title' }, 'waiting for players'),
                        createElement('i', { class: 'bx bx-loader bx-spin' })
                    ])
                ]),
            ]),
            createElement('div', { class: 'players' }, [
                // createElement('ul', { class: 'list' }, playerList)   ,
            ]),
            createElement('div', { id: 'countdown', class: 'countdown' }, '')
        ]);
    }
}

export default WaitingRoom;