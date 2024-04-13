import router from "../lib/index.js"
import models from "./models/models.js";
const { createElement, addListener, removeListeners } = router;

class Chat extends router.Component {
    constructor(props, stateManager) {
        super(props, stateManager);
        this.state = {
            messages: [], // Initialize an empty array to store chat messages
            newMessage: ""
        };
    }

    componentDidMount() {
        // Add event listener to handle incoming chat messages
        this.props.ws.onMessage(this.handleIncomingMessage);
    }

    componentWillUnmount() {
        // Clean up by removing the event listener
        this.props.ws.removeMessageListener(this.handleIncomingMessage);
    }

    handleIncomingMessage = (message) => {
        // Update state with the incoming chat message
        this.setState({ messages: [...this.state.messages, message] });
    };

    handleInputChange(event) {
        this.props.disableControls()
        this.setState({ newMessage: event.target.value });
    }

    handleSendMessage = (event) => {
        // this.props.activateControls(this.props.state.player.life > 0)
        event.preventDefault()
        const inputElement = document.querySelector('.new-message');
        const messageContent = inputElement.value.trim();

        if (messageContent !== '') {
            const chatMessage = {
                type: 'chat',
                teamId: this.props.state.team.id,
                playerId: this.props.state.player.id,
                message: {
                    content: messageContent
                }
            };

            // Send the chat message to the server via WebSocket
            this.props.ws.send(chatMessage);

            // Clear the input field after sending the message
            inputElement.value = '';
        }
    };

    render() {
        return createElement('div', { class: 'game-chat' }, [
            createElement('div', { class: 'chat-box' }, [
                createElement('div', { class: 'players' }, [
                    createElement('div', { class: 'header' }, [
                        createElement('div', { class: 'title' }, `Joueurs`),
                    ]),
                    createElement('div', { class: 'content' }, [
                        createElement('div', { class: 'players-list' },
                            this.props.state.team.players.map(player => {
                                return createElement('div', { class: 'player' }, [
                                    createElement('img', { src: player.avatar, alt: player.nickname }),
                                    createElement('div', { class: 'player-name' }, player.nickname),
                                    createElement('div', { class: 'player-status' }, player.status),
                                    createElement('div', { class: 'player-life' },
                                        [true, true, false].map((life, index) => {
                                            return createElement('i', { class: `bx bxs-bomb ${life ? 'full' : 'empty'}` }, '');
                                        })
                                    ),
                                ]);
                            })
                        )
                    ]),
                ]),
                createElement('div', { class: 'chat' }, [
                    createElement('div', { class: 'header' }, [
                        createElement('div', { class: 'title' }, `Chat`),
                        createElement('div', { class: 'content' }, [
                            createElement('div', { class: 'messages' }, [
                                this.props.state.messages.map((message, index) => (
                                    createElement('div', { key: index, class: 'message' }, [
                                        createElement('div', { class: 'message-author' }, message.Author),
                                        createElement('div', { class: 'message-content' }, message.Content),
                                    ])
                                )),
                            ]),
                        ]),
                    ]),
                    createElement('div', { class: 'footer' }, [
                        createElement('input', {
                            class: 'new-message',
                            value: this.state.newMessage,
                            onInput: this.handleInputChange.bind(this),
                            onFocus: this.props.handleChatInputFocus,
                            onBlur: () => this.props.handleChatInputBlur(this.props.state.player.life > 0),
                            type: 'text',
                            placeholder: 'Type a message...'
                        }),
                        createElement('button', { type: 'button', class: 'send', onClick: this.handleSendMessage.bind(this) }, 'Send'),
                    ]),
                ]),
            ]),
        ]);
    }
}
// createElement('div', { class: 'messages' }, [
//     createElement('div', { class: 'message' }, [
//         createElement('div', { class: 'message-author' }, 'Author'),
//         createElement('div', { class: 'message-content' }, 'Message content'),
//     ]),
// ]),
// createElement('div', { class: 'footer' }, [
//     createElement('input', { class: 'new-message', type: 'text', placeholder: 'Type a message...' }),
//     createElement('button', { class: 'send' }, 'Send')
// ]),


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
            messages: [],
            isChatInputFocused: false,
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
        // console.table(event.data);
        // return;
        const data = JSON.parse(event.data);
        if (data.error) {
            this.redirectTo('/');
            return;
        } else if (data.invalid) {
            console.log('Invalid move');
            return;
        }

        const resp = new models.Response();
        resp.fromJSON(data);

        const { type, team, player, value } = resp;

        switch (type) {
            // case "updatePlayers":
            //     this.setState({ players: players });
            //     break;
            case "placeBomb":
                // Handle bomb placement
                this.setState({ team: { ...this.state.team, bombs: team.bombs } });
                break;
            // Add cases for other message types as needed
            case "bombExploded":
                // Handle bomb explosion
                this.setState({
                    team: {
                        ...this.state.team,
                        map: team.map,
                        bombs: team.bombs
                    }
                });
                break;
            case "playerEliminated":
                this.handlePlayerElimination(player, value);
                break;
            case "gameMapUpdate":
                this.setState({
                    team: {
                        ...this.state.team,
                        map: team.map,
                        bombs: team.bombs
                    }
                });
                break;
            case 'chat':
                // Handle incoming chat messages
                const newMessage = {
                    Author: data.Message.Author, // Assuming the message contains author's information
                    Content: data.Message.Content, // Extract the message content from the data
                };
                // Update the state to include the new chat message
                this.setState({
                    messages: [
                        ...this.state.messages,
                        newMessage
                    ]

                });
                this.handleNewMessage(newMessage)
                break;
            // Add cases for other message types as needed
            // case "gameWaiting":
            //     this.setState({ waiting: time, isWaiting: false });
            //     break;
            // case "chatMessage":
            //     this.setState({ messages: [...this.state.messages, message] });
            //     break;
            case "playerDead":
                if (player.id === value) {
                    this.disableControls()

                    // Create a new modal
                    let modal = document.createElement('div');
                    modal.style.position = "fixed";
                    modal.style.zIndex = "1000";
                    modal.style.left = "0";
                    modal.style.top = "0";
                    modal.style.backgroundColor = "red";
                    modal.style.color = "white";
                    modal.style.padding = "10px";
                    modal.innerText = "You are dead! Game over for you! 🧨💥"

                    // Create a new button
                    let button = document.createElement('button');
                    button.innerText = "Replay";
                    addListener(button, "click", () => {
                        this.removeState();
                        this.redirectTo('/');
                    });
                    
                    // Append the button to the modal
                    modal.appendChild(button);

                    // Append the modal to the body
                    document.body.appendChild(modal);
                }
                break;
            // case "gameOver":
            //     alert(message);
            //     this.resetGame();
            //     this.router.navigate("/");
            //     break;
            default:
                console.warn("Unknown message type:", type);
        }
    }

    handlePlayerElimination(player, value) {

        if ((player && player.id !== undefined && value !== undefined) && player.id === value) {
            this.notifier()
        } else {
            console.log('Player eliminated:', value);
            // document.querySelector(`.player-${player.id}`).style.textDecoration = "line-through";
        }
        this.setState({
            team: {
                ...this.state.team,
                players: this.state.team.players.filter(p => {
                    if (p.id === player.id) {
                        p = player;
                    }
                    return p;
                })

            }
        });
    }

    notifier(msg = 'You have been eliminated!', duration = 2000) {
        // Create a new notification
        let notification = document.createElement('div');
        notification.innerText = msg;
        notification.style.position = "fixed";
        notification.style.zIndex = "1000";
        notification.style.left = "50%";
        notification.style.top = "50%";
        notification.style.transform = "translate(-50%, -50%)";
        notification.style.backgroundColor = "red";
        notification.style.color = "white";
        notification.style.padding = "10px";
        document.body.appendChild(notification);

        // Remove the notification after 2 seconds
        const out = setTimeout(() => {
            document.body.removeChild(notification);
            clearTimeout(out);
        }, duration);
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
                    this.activateControls(this.state.player.life > 0);
                    clearTimeout(out);
                }, 500);
                ws.onmessage = (event) => {
                    this.onWebSocketMessage(event);
                }
            };
        });

    }

    handleChatSend = (message) => {
        const inputElement = document.querySelector('.new-message');
        const messageContent = inputElement.value.trim();

        if (messageContent !== '') {
            const chatMessage = {
                type: 'chat', // Define the type as 'chat' to indicate a chat message
                content: messageContent,
            };

            // Send the chat message to the server via WebSocket
            this.ws?.send(chatMessage);

            // Clear the input field after sending the message
            inputElement.value = '';
        }
    };

    handleNewMessage = (message) => {
        const container = document.querySelector('.messages');

        container.appendChild(createElement('div', { class: 'message' }, [
            createElement('div', { class: 'message-author' }, message.Author),
            createElement('div', { class: 'message-content' }, message.Content),
        ]))

    };

    handleChatInputFocus = () => {
        this.setState({ isChatInputFocused: true });
        this.disableControls(); // Disable game controls
    };

    handleChatInputBlur = (state) => {
        this.setState({ isChatInputFocused: false });
        console.log(state, "www");
        this.activateControls(state); // Enable game controls
    };

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

    activateControls(noDeat = false) {
        console.log(noDeat);
        if (noDeat) {
            addListener(window, "keydown", this.handleKeyDown);
        }
    }



    update() {
        const gridmap = document.getElementById('map-grid')
        if (gridmap) {
            gridmap.innerHTML = '';
            gridmap.appendChild(this.mapRander(this.state.team.map, this.state.avatars, this.state.team.bombs));
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

    mapRander(map2d, avatars, bombs = []) {

        const decor = {
            "0": "",
            "1": "🧱",
            "-1": "🪨",
            "2": "💣"
        }
        const mapSize = 550;
        const cellSize = mapSize / map2d.length;
        return createElement('div', {
            class: 'map-grid',
            id: 'map-grid',
            style: `grid-template-columns: repeat(${map2d[0].length}, ${cellSize}px);
                    grid-template-rows: repeat(${map2d.length}, ${cellSize}px);
                    grid-gap: 1px;`, // Ajoutez cette ligne pour définir l'espace entre les cellules
        }, [
            map2d.map((row, rowIndex) => {
                return row.map((cell, cellIndex) => {
                    let canPlaceBomb = false
                    for (let i = 0; i < bombs.length; i++) {
                        if (bombs[i].position.x === rowIndex && bombs[i].position.y === cellIndex) {
                            if (!bombs.exploded) {
                                canPlaceBomb = true;
                                break;
                            }

                        }
                    }
                    return createElement('div', {
                        class: `map-cell ${rowIndex}${cellIndex}`,

                    }, `${canPlaceBomb ? '💣' : (cell == 100) ? '🔥' : cell <= 2 ? decor[cell] : avatars[cell] || ''}`);
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
                    type: "placeBomb" // Remplacer par une valeur valide pour ReqType
                };
                // console.log('place bomb');
                this.ws.send(request);
                return;
            default:
                return;
        }

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
        // console.log(this.ws.send)
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
        // console.log(data, this.ws)
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

