import router from "../lib/index.js"
import models from "./models/models.js";

const { createElement, appendChildren } = router;

class WaitingRoom extends router.Component {
    request = {
        type: '',
        teamId: '',
        playerId: '',
    }

    constructor(props, stateManager) {
        super(props, stateManager);
        this.state = {
            firstRender: true,
        }
        const game = JSON.parse(localStorage.getItem('game')) || {};

        const resp = new models.Response()
        resp.fromJSON(game);

        this.setState(resp.object());

        if (this.state.team && this.state.team.state === 'waiting' && this.state.player) {
            // Initialisez le WebSocket ici, après que l'état ait été mis à jour
            this.init();
        } else if (this.state.team && this.state.team.state === 'playing') {
            this.redirectTo('/game');
        } else if (!this.state.team.id || !this.state.player.id) {
            this.removeState();
            this.redirectTo('/');
        }
    }

    init() {
        if (!this.state.team || !this.state.player) {
            console.log('Team is not defined yet');
            return;
        }
        const ws = new WebSocket(`ws://${window.location.host}/waitingroom`);
        ws.onopen = () => {
            ws.send(JSON.stringify({ type: 'join', teamId: this.state.team.id, playerid: this.state.player.id }));
            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                if (data.error) {
                    this.removeState();
                    this.redirectTo('/');
                    return;
                }
                const resp = new models.Response();
                resp.fromJSON(data);
                if (resp.player.id === this.state.player.id && resp.team.id === this.state.team.id) {
                    this.setState(resp.object());
                    const ul = document.querySelector('.players ul')
                    ul.innerHTML = '';
                    resp.team.players.forEach(player => {
                        if (player.id !== this.state.player.id) {
                            const li = createElement('li', { class: 'player' }, [
                                createElement('img', { class: 'player-avatar', src: player.avatar }),
                                createElement('span', { class: 'player-name' }, player.nickname),
                            ]);
                            ul.appendChild(li);
                        }
                    });
                }
                if (resp.team.state === 'ready') {
                }
                if (resp.team.state === 'playing') {
                    this.countdown(10)
                    this.redirectTo('/game');
                }
            }
        }
    }

    redirectTo = (path) => {
        window.location.href = path;
    }

    setState(newState, callback) {
        this.state = { ...this.state, ...newState }
        localStorage.setItem('game', JSON.stringify(this.state));
        callback && callback();
    }

    removeState() {
        localStorage.removeItem('game');
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

        const playerList = this.state.team && this.state.team.players ? this.state.team.players.map(player => {
            if (player.id !== this.state.player.id) {
                return createElement('li', { class: 'player' }, [
                    createElement('img', { class: 'player-avatar', src: player.avatar }),
                    createElement('span', { class: 'player-name' }, player.nickname),
                ]);
            }
        }
        ) : [];

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
                createElement('ul', { class: 'list' }, playerList),
            ]),
            createElement('div', { id: 'countdown', class: 'countdown' }, '')
        ]);
    }
}

export default WaitingRoom;