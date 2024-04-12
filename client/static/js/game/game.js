import router from "../lib/index.js"
import models from "./models/models.js";
const { createElement, } = router;

class Chat extends router.Component {
    render() {
        return createElement('div', { class: 'game-chat' }, [
            createElement('div', { class: 'chat-box' }, [
                createElement('div', { class: 'players' }, [
                    createElement('div', { class: 'header' }, [
                        createElement('div', { class: 'title' }, `Joueurs`),
                    ]),
                    createElement('div', { class: 'content' }, [
                        createElement('div', { class: 'players-list' },
                            // this.state.players.map(player => {
                            //     return createElement('div', { class: 'player' }, [
                            //         createElement('img', { src: player.avatar, alt: player.nickname }),
                            //         createElement('div', { class: 'player-name' }, player.nickname),
                            //         createElement('div', { class: 'player-status' }, player.status),
                            //         createElement('div', { class: 'player-life' },
                            //             [true, true, false].map((life, index) => {
                            //                 return createElement('i', { class: `bx bxs-bomb ${life ? 'full' : 'empty'}` }, '');
                            //             })
                            //         ),
                            //     ]);
                            // })
                        )
                    ]),
                ]),
                createElement('div', { class: 'chat' }, [
                    createElement('div', { class: 'header' }, [
                        createElement('div', { class: 'title' }, `Chat`),
                    ]),
                    createElement('div', { class: 'content' }, [
                        createElement('div', { class: 'messages' }, [
                            createElement('div', { class: 'message' }, [
                                createElement('div', { class: 'message-author' }, 'Author'),
                                createElement('div', { class: 'message-content' }, 'Message content'),
                            ]),
                        ]),
                    ]),
                    createElement('div', { class: 'footer' }, [
                        createElement('input', { class: 'new-message', type: 'text', placeholder: 'Type a message...' }),
                        createElement('button', { class: 'send' }, 'Send')
                    ]),

                ]),
            ]),
        ]);
    }
}

class Map extends router.Component {
    constructor(props, stateManager) {
        super(props, stateManager);
        this.state = {
            map: props?.state?.team?.map || new models.Team().object().map,
            player: props?.state?.player || new models.Player().object(),
        }

        for (let i = 0; i < 15; i++) {
            this.state.map[i] = [];
            for (let j = 0; j < 15; j++) {
                this.state.map[i][j] = 'empty';
            }
        }
    }
    render() {
        const mapSize = 550; // Taille de la carte en pixels
        const cellSize = mapSize/this.state.map.length; // Taille de chaque cellule
    
        return createElement('div', { class: 'game-map' }, [
            createElement('div', { class: 'map-box' }, [
                createElement('div', { class: 'map' }, [
                    createElement('div', {
                        class: 'map-grid',
                        style: `grid-template-columns: repeat(${this.state.map[0].length}, ${cellSize}px);
                                grid-template-rows: repeat(${this.state.map.length}, ${cellSize}px);
                                grid-gap: 1px;`, // Ajoutez cette ligne pour définir l'espace entre les cellules
                    }, [
                        this.state.map.map((row, rowIndex) => {
                            return row.map((cell, cellIndex) => {
                                return createElement('div', {
                                    class: `map-cell ${rowIndex}${cellIndex}`,
                                   
                                }, `${rowIndex}${cellIndex}`);
                            })
                        })
                    ]),
                ])
            ]),
        ]);
    }
}


class Game extends router.Component {
    constructor(props, stateManager) {
        super(props, stateManager);

        // const game = JSON.parse(localStorage.getItem('game'));

        // const resp = new models.Response()
        // resp.fromJSON(game || {});


        // this.state = resp.object()
    }

    // init() {
    //     // if (!this.state.team || !this.state.player) {
    //     //     console.log('Team is not defined yet');
    //     //     return;
    //     // }
    //     const ws = new WebSocket(`ws://${window.location.host}/gamesocket`);
    //     ws.onopen = () => {
    //         ws.send(JSON.stringify({ type: 'join', teamId: this.state.team.id, playerid: this.state.player.id }));
    //         ws.onmessage = (event) => {
    //             const data = JSON.parse(event.data);
    //             if (data.error) {
    //                 this.removeState();
    //                 this.redirectTo('/');
    //                 return;
    //             }
    //             const resp = new models.Response();
    //             resp.fromJSON(data);
    //             if (resp.player.id === this.state.player.id && resp.team.id === this.state.team.id) {
    //                 if (!this.state.firstRender) {
    //                     this.setState(resp.object());
    //                     this.setState({ firstRender: true });
    //                     this.redirectTo('/waiting-room');
    //                 } else {
    //                     this.setState(resp.object());
    //                     this.setState({ firstRender: false });
    //                 }
    //             }
    //             if (resp.team.state === 'playing') {
    //                 this.redirectTo('/game');
    //             }
    //         }
    //     }
    // }

    render() {
        return createElement('div', { class: 'container' }, [
            new Map(this, this.stateManager).render(),
            new Chat(this, this.stateManager).render(),
        ]);
    }
}



export default Game;

