import router from "../lib/index.js"
import models from "./models/models.js";
const { createElement, addListener } = router;

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
            avatars: props.state?.avatars || avatars,
            mapSize: props.state?.mapSize || 550,
            cellSize: props.state?.cellSize || 0,
        }
    }
    render() {
        // const // Taille de la carte en pixels
        // const 

        return createElement('div', { class: 'game-map' }, [
            createElement('div', { class: 'map-box' }, [
                createElement('div', { class: 'map' }, [
                    this.props.mapRander(this.state.map, this.state.avatars),
                ])
            ]),
        ]);
    }
}


class Game extends router.Component {
    request = {
        type: 'join',
        teamId: '',
        playerId: '',
        position: {
            x: 0,
            y: 0
        },
        message: {
            content: ''
        }
    }
    ws = null;

    // Taille de la carte en pixels
    constructor(props, stateManager) {
        super(props, stateManager);
        const avatars = {}
       
        this.state.avatars
        this.state = {
            firstRender: true,
            avatars: avatars,
        }
        const game = JSON.parse(localStorage.getItem('game')) || {};

        const resp = new models.Response()
        resp.fromJSON(game);
        this.setState(resp.object());

        

        if (this.state.team && this.state.team.state === 'playing' && this.state.player) {
            this.init();
        } else if (!this.state.team.id || !this.state.player.id) {
            this.removeState();
            this.redirectTo('/');
        }
        this.startGameLoop();
    }

    onWebSocketMessage(event) {
        const data = JSON.parse(event.data);
        console.table(data.team?.map);
        if (data.error) {
            this.redirectTo('/');
            return;
        } else if (data.invalid) {
            console.log('Invalid move');
            return;
        }

        const resp = new models.Response();
        resp.fromJSON(data);

        const { type, team, player } = resp;

        switch (type) {
            case "updatePlayers":
                this.setState({ players: players });
                break;
            case "placeBomb":
                // Handle bomb placement
                this.setState({ bombs: [...this.state.bombs, bomb] });
                break;
            // Add cases for other message types as needed
            case "bombExploded":
                // Handle bomb explosion
                this.setState({
                    bombs: this.state.bombs.filter(
                        (b) => b.x !== bomb.x || b.y !== bomb.y
                    ),
                });
                break;
            case "playerEliminated":
                this.handlePlayerElimination(event.playerId);
                break;
            case "gameMapUpdate":
                this.setState({ team: { ...this.state.team, map: team.map } });
                break;
            case "gameWaiting":
                this.setState({ waiting: time, isWaiting: false });
                break;
            case "chatMessage":
                this.setState({ messages: [...this.state.messages, message] });
                break;
            case "waitLobby":
                this.setState({ time: time, playersCount: players });
                break;
            case "gameOver":
                alert(message);
                this.resetGame();
                this.router.navigate("/");
                break;
            default:
                console.warn("Unknown message type:", type);
        }
    }


    init() {
        if (!this.state.team || !this.state.player) {
            console.log('Team is not defined yet');
            return;
        }
        const avatars = {};
        this.state.team.players?.forEach(player => {
            avatars[player.mapId] = player.avatar;
        });
        this.setState({ avatars: avatars });
        this.request = {
            type: 'join',
            teamId: this.state.team.id,
            playerId: this.state.player.id,
        }
        this.ws = new Socket(`ws://${window.location.host}/game`, (ws) => {
            ws.onopen = () => {
                ws.send(JSON.stringify(this.request));
                const out = setTimeout(() => {
                    this.activateControls();
                    clearTimeout(out);
                }, 500);
                ws.onmessage = (event) => {
                    this.onWebSocketMessage(event);
                }
            };
        });

    }

    redirectTo = (path, clear = true) => {
        this.removeState();
        window.location.pathname = path;
    }

    setState(newState, callback) {
        this.state = { ...this.state, ...newState }
        localStorage.setItem('game', JSON.stringify(this.state));
        callback && callback();
    }

    removeState() {
        localStorage.removeItem('game');
    }

    disableControls() {
        removeListeners(window, "keydown", this.handleKeyDown);
    }

    activateControls() {
        addListener(window, "keydown", this.handleKeyDown);
    }

   

    update() {
       const gridmap = document.getElementById('map-grid')
       console.log(this.state.avatars);
       if (gridmap) {
        gridmap.innerHTML = '';
        gridmap.appendChild(this.mapRander(this.state.team.map, this.state.avatars)); 
       }
    }

    gameLoop = () => {
        this.update(); // Your existing update logic
        this.animationFrameId = requestAnimationFrame(this.gameLoop); // Loop this method
    }

    startGameLoop() {
        if (!this.animationFrameId) {
            // Prevent multiple loops from starting
            this.gameLoop(); // Start the loop
        }
    }

    mapRander(map2d, avatars) {
        const decor = {
            "0": "",
            "1": "🧱",
            "-1": "🪨",
            "2": "💣"
        }
        const mapSize = 550;
        const cellSize = mapSize / map2d.length;
        console.log(map2d, cellSize, decor, avatars);
        return createElement('div', {
            class: 'map-grid',
            id: 'map-grid',
            style: `grid-template-columns: repeat(${map2d[0].length}, ${cellSize}px);
                    grid-template-rows: repeat(${map2d.length}, ${cellSize}px);
                    grid-gap: 1px;`, // Ajoutez cette ligne pour définir l'espace entre les cellules
        }, [
            map2d.map((row, rowIndex) => {
                return row.map((cell, cellIndex) => {
                    return createElement('div', {
                        class: `map-cell ${rowIndex}${cellIndex}`,

                    }, `${cell <= 2 ? decor[cell] : avatars[cell] || ''}`);
                })
            })
        ]);
    }


    handleKeyDown = (event) => {
        const move = { x: 0, y: 0 };
        switch (event.key) {
            case "ArrowUp":
                move.x = -1;
                break;
            case "ArrowDown":
                move.x = 1;
                break;
            case "ArrowLeft":
                move.y = -1;
                break;
            case "ArrowRight":
                move.y = 1;
                break;
            case " ":
                // Handle other keys as needed
                // this.ws.send("placeBomb", {});
                break;
            default:
                return;
        }

        console.log("Sending move", move);
        let request = {
            playerId: this.state.player?.id, // Remplacer par un UUID valide
            teamId: this.state.team?.id, // Remplacer par un UUID valide
            position: {
                x: move.x,
                y: move.y
            },
            message: {
                content: ""
            },
            type: "move" // Remplacer par une valeur valide pour ReqType
        };
        // Send move to server
        this.ws?.send(request);
    };

    componentWillUnmount() {
        removeListeners(window, "keydown", this.handleKeyDown);
        // if (this.waitTimeout) {
        //     clearTimeout(this.waitTimeout);
        // }
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId); // Stop the animation loop
        }
    }

    render() {
        console.table(this.state.team.map);
        return createElement('div', { class: 'container' }, [
            new Map(this, this.stateManager).render(),
            new Chat(this, this.stateManager).render(),
        ]);
    }
}


class Socket {
    constructor(url, callback) {
        this.ws = new WebSocket(`ws://${window.location.host}/gamesocket`);

        callback(this.ws);
    }

    send(data) {
        this.ws.send(JSON.stringify(data));
    }

    onMessage(callback) {
        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            callback(data);
        }
    }
}


export default Game;

