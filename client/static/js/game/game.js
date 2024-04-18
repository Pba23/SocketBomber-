import router from "../lib/index.js"
import models from "./models/models.js";
import { ws } from "../utils/socket.js";
const { createElement, addListener, removeListeners } = router;

class Chat extends router.Component {
    constructor(props, stateManager) {
        super(props, stateManager);
        const resp = new models.Response().fromJSON(stateManager.state);
        this.state = {
            messages: [],
            newMessage: '',
        };
        this.state = { ...this.state, ...resp.toObject() };

    }

    handleSendMessage = () => {
        const message_input = document.getElementById('newMessage')

        if (message_input.value.trim() === '') {
            return;
        }

        const req = {
            "playerId": this.state.id,
            "teamId": this.state.team.id,
            "nickname": this.state.nickname,
            "message": {
                "content": message_input.value,
            },
            "type": "chat"
        }

        message_input.value = '';
        ws.send(req);
    };

    handleInputFocus = () => {
        console.log('Input focused');
        this.props.disableControls()
    };

    handleInputBlur = () => {
        console.log('Input blurred');
        this.props.activateControls()
    };

    generateBooleanArray(number) {
        if (number === 3) {
            return [true, true, true];
        } else if (number === 2) {
            return [true, true, false];
        } else if (number === 1) {
            return [true, false, false];
        } else {
            // Handle other cases if needed
            return [false, false, false];
        }
    }

    // <div id="chat">
    //         <div class="chat_header">
    //             <div class="player">1</div>
    //             <div class="player">2</div>
    //             <div class="player">3</div>
    //             <div class="player">4</div>
    //         </div>
    //         <div id="chat_s"></div>
    //         <div class="newMessage">
    //             <input type="text" value="" oninput="">
    //             <input id="ss-submit"  value="Submit" onClick="">
    //         </div>
    //     </div>



    // [
    //     createElement('div', { class: 'player' }, '1'),
    //     createElement('div', { class: 'player' }, '2'),
    //     createElement('div', { class: 'player' }, '3'),
    //     createElement('div', { class: 'player' }, '4'),
    // ]),

    render() {
        const playersObj = this.props.stateManager.state.team.players
        // console.log(this.props)
        return createElement('div', { id: 'chat' }, [
            createElement('div', { class: 'chat_header' }, [
                playersObj.map(player => {
                    return createElement('div', { class: 'player', id: `${player.id}-life` }, [
                        createElement('img', { src: `/static/assets/avatars/${player.avatar}.png`, alt: player.nickname }),
                        createElement('p', {}, player.nickname),
                        createElement('div', { class: 'player-status' }, player.status),
                        createElement('div', { class: 'player-life' }, [
                            [true, true, true].map((life, index) => {
                                return createElement('i', { class: `bx bxs-bomb ${life ? 'lifefull' : 'lifeempty'}` }, '');
                            })
                        ]),
                    ]);
                }),
            ]),
            createElement('div', { id: 'chat_s' }),
            createElement('div', { class: 'newMessage' }, [
                createElement('input', { id: 'newMessage', type: 'text', value: '', oninput: '', onfocus: this.handleInputFocus, onblur: this.handleInputBlur }),
                createElement('input', { id: 'ss-submit', type: 'button', value: 'Submit', onClick: () => { this.handleSendMessage() } }),
            ]),
        ]);
    }
}


// class LoadingScreen extends router.Component {
//     render() {
//         return createElement('div', { class: 'loading-screen' }, [
//             createElement('div', { class: 'spinner' }, 'Loading...'), // You can customize the loading indicator
//         ]);
//     }
// }

class Map extends router.Component {
    constructor(props, stateManager) {
        super(props);

        const resp = new models.Response().fromJSON(stateManager.state);
        this.state = resp;
    }

    // componentDidMount() {

    // }



    render() {
        const game_map = this.state.team.map;
        const allElements = Object.values(this.props.elementMAp)
        // game_map.forEach((row, x) => {
        //     row.forEach((cell, y) => {
        //         const id = x * 20 + y;
        //         this.props.elementMAp[id] = cell;
        //         allElements.push(createElement('div', { id: `${id}`, class: `cell ${cell}` }))
        //     });
        // })
        return createElement('div', { id: 'map' }, [
            allElements.map((element) => {
                return element
            })
        ]);
    }
}


class Game extends router.Component {

    players = {}
    elementMAp = {}


    constructor(props, stateManager) {
        super(props);
        this.router = props.router;
        this.stateManager = stateManager;

        this.TIME_LIMIT = 10;
        this.timePassed = 0;
        this.timeLeft = this.TIME_LIMIT;
        this.timerInterval = null;
        this.animationFrameId = null;


        // if (!this.stateManager.state.id) {
        //     this.router.navigate('/');
        // }

        const resp = new models.Response().fromJSON(stateManager.state);
        this.state = { ...this.state, ...resp.toObject() };
        this.state['isChatInputFocused'] = false;
        resp.team.map.forEach((row, x) => {
            row.forEach((cell, y) => {
                const id = x * 20 + y;
                this.elementMAp[id] = createElement('div', { id: `${id}`, class: `cell ${cell}` });
                // allElements.push()
            });
        })

        this.gameLoop = this.gameLoop.bind(this);
        this.gameLoop();
    }

    gameLoop() {
        this.UpdatePosition();

        this.animationFrameId = requestAnimationFrame(this.gameLoop); // Loop this method
    }

    UpdatePosition() {
        const keys = Object.keys(this.players);
        keys.forEach((key) => {
            const player = this.players[key];
            if (player.position.x === player.new_position.x && player.position.y === player.new_position.y) {
                return;
            }
            const id = player.position.x * 20 + player.position.y;
            const cell = this.elementMAp[id];
            cell.classList.remove(player.avatar);
            player.position = player.new_position;
            const new_id = player.position.x * 20 + player.position.y;
            const new_cell = this.elementMAp[new_id];
            new_cell.classList.add(player.avatar);
        });
    }

    // handleChatInputFocus = () => {
    //     this.setState({ isChatInputFocused: true });
    //     this.disableControls(); // Disable game controls
    // };

    // handleChatInputBlur = (state) => {
    //     this.setState({ isChatInputFocused: false });
    //     this.activateControls(state); // Enable game controls
    // };
    redirectTo = (path, clear = true) => {
        // this.removeState();
        window.location.pathname = path;
    }


    disableControls() {
        removeListeners(window, "keydown", this.handleKeyDown);
    }

    activateControls() {
        const player = this.stateManager.state
        if (player.life > 0) {
            addListener(window, "keydown", this.handleKeyDown);
        }
    }

    handleKeyDown = (event) => {

        const req = {
            "playerId": this.state.id,
            "teamId": this.state.team.id,
            "nickname": this.state.nickname,
            "position": {
                "x": 0,
                "y": 0
            },
            "type": "move"
        }
        // const move = { x: 0, y: 0 };
        switch (event.key) {
            case "ArrowUp":
                req.position.x = -1;
                break;
            case "ArrowDown":
                req.position.x = 1;
                break;
            case "ArrowLeft":
                req.position.y = -1;
                break;
            case "ArrowRight":
                req.position.y = 1;
                break;
            case " ":
                req.type = "placeBomb"
                break;
            case "new Key":
                // Handle other keys as needed
                req.type = "specific key"
                break;
            default:
                return;
        }

        // Send move to server
        ws.send(req);
    };

    createElement() {
        const element = document.createElement('div');
        element.classList.add('base-timer');
        const time = document.createElement('span');
        time.id = 'base-timer-label';
        time.classList.add('base-timer__label');
        time.innerHTML = this.formatTime(this.timeLeft);
        element.appendChild(time);
        return [element, time];
    }

    startTimer() {
        const [timer, time] = this.createElement();
        const map = document.getElementById('map')
        map.appendChild(timer);
        this.timerInterval = setInterval(() => {
            this.timePassed = this.timePassed += 1;
            this.timeLeft = this.TIME_LIMIT - this.timePassed;
            time.innerHTML = this.formatTime(this.timeLeft);

            if (this.timeLeft === 0) {
                console.log("Time's up!");
                map.removeChild(timer);
                clearTimeout(this.timerInterval);
            }
        }, 1000);
    }

    formatTime(time) {
        const minutes = Math.floor(time / 60);
        let seconds = time % 60;

        if (seconds < 10) {
            seconds = `0${seconds}`;
        }

        return `${minutes}:${seconds}`;
    }

    componentDidMount() {
        ws.onMessage(this.onMessage.bind(this));
        const state = new models.Response().fromJSON(this.stateManager.state);
        if (state.team.state === 'playing' && !state.team.started) {
            console.log("START TIMER");
            this.startTimer();
        }
    }

    componentWillUnmount() {
        ws.onMessage(null);
        this.animationFrameId && cancelAnimationFrame(this.animationFrameId);
        this.disableControls();
    }

    onMessage(data) {
        if (data.error) {
            alert(data.error);
            this.router.navigate('/');
        }

        const resp = new models.Response().fromJSON(data);
        // console.log("RESPONSE", resp);
        switch (resp.type) {
            case 'move':
                this.movePlayer(resp);
                return;
            case 'startGame':
                this.StartGame(resp);
                return;
            case 'chat':
                this.chatMessage(resp);
                return;
            case 'placeBomb':
                this.placeBomb(resp)
                return;
            case "placeFlame":
                console.log("placeFlame\n", resp)
                return;
            case 'bombExploded':
                this.bombExplosion(resp)
                return;
            case "powerFound":
                this.removeExplosion(resp)
                return;
            case "playerEliminated":
                this.playerAttacked(resp)
                return;
            case "playerDead":
                this.gameOver(resp)
                return;
            case "gameOver":
                console.log("gameOver\n", resp)
                return;
            case 'moreAction':
                console.log('More Action ...\n', resp)
                // action logic
                return;
            default:
                return;
        }
    }

    movePlayer(data) {
        const player = this.players[data.id];
        player.new_position = { x: data.position.x, y: data.position.y };
    }

    placeBomb(data) {
        const position = data.bomb.position;
        const id = position.x * 20 + position.y;
        const cell = this.elementMAp[id];
        cell.classList.add('bomb');
    }

    bombExplosion(data) {
        console.log(data);
        const impacts = data.bomb.impact
        impacts.forEach(impact => {
            const position = impact;
            const id = position.x * 20 + position.y;
            const cell = this.elementMAp[id]
            this.explodeBomb(cell);
        })
    }

    explodeBomb(bombElement) {
        if (bombElement.className === "explosion") return

        // Store initial properties
        const initialTransition = bombElement.style.transition;
        const initialAnimationDuration = bombElement.style.animationDuration;
        const initialTransform = bombElement.style.transform;
        const randomDegs = Math.round(Math.random() * 360)
        bombElement.className = "explosion"
        bombElement.style.transition = "unset"
        bombElement.style.animationDuration = `${450}ms`
        bombElement.style.transform = `rotate(${randomDegs}deg)`

        setTimeout(() => {
            // bombElement.classList.remove('explosion');
            bombElement.className = 'cell';
            bombElement.style.transition = initialTransition;
            bombElement.style.animationDuration = initialAnimationDuration;
            bombElement.style.transform = initialTransform;

        }, 450);
        // requestAnimationFrame(() => {
        //     // bombElement.className = 'cell';
        //     // bombElement.style.transition = initialTransition;
        //     // bombElement.style.animationDuration = initialAnimationDuration;
        //     // bombElement.style.transform = initialTransform;
        // });
    }

    playerAttacked(data) {
        const player = this.stateManager.state
        // reduce life of the player
        if ((player && player.id !== undefined && data !== undefined) && player.id === data.id && data.life >= 0) {
            this.playerEliminationNotification(data.id)
            const playerContainer = document.getElementById(`${data.id}-life`);
            const listOfLife = playerContainer.querySelectorAll('.player-life i.lifefull');
            const lastChild = listOfLife[listOfLife.length - 1];
            lastChild.classList.remove('lifefull')
            lastChild.classList.add('lifeempty')
            // const lastPlayerLife = playerContainer.querySelector('.player-life i.full:last-child');
            // let playerLife = document.querySelector('.player-life i.full:last-child')

        } else {
            if (data.life >= 0) {
                const playerContainer = document.getElementById(`${data.id}-life`);
                const listOfLife = playerContainer.querySelectorAll('.player-life i.lifefull');
                const lastChild = listOfLife[listOfLife.length - 1];
                lastChild.classList.remove('lifefull')
                lastChild.classList.add('lifeempty')
                // const lastPlayerLife = playerContainer.querySelector('.player-life i.full:last-child');
                // console.log(lastChild)

                // let playerLife = document.querySelector('.player-life i.full:last-child')
                // console.log(playerLife)
                // document.querySelector(`.player-${player.id}`).style.textDecoration = "line-through";
            }
        }
    }

    // FUNCTION SHOWING SAID Player is attacked
    playerEliminationNotification(data) {
        console.log("Player Xnickname hitted by bomb ", data)
        // Create a new notification
        const chatContainer = document.getElementById('chat_s')
        console.log(chatContainer)
        const notification = createElement('div', { class: 'message message_other' }, [
            createElement('div', { class: 'chat_message' }, "You've been hitted"),
            createElement('div', { class: 'message_name' }, 'Game Server')
        ]);
        chatContainer.appendChild(notification)
        console.log(chatContainer)

        // Remove the notification after 2 seconds
        // const out = setTimeout(() => {
        //     removeChild(notification);
        //     clearTimeout(out);
        // }, 2000);
    }

    removeExplosion(data) {
        // const impacts = data.bomb.impact
        // impacts.forEach(impact => {
        //     const position = impact;
        //     const id = position.x * 20 + position.y;
        //     const cell = this.elementMAp[id]
        //     cell.classList.remove('bomb');
        //     cell.classList.remove('explosion');
        //     cell.classList.remove('block');
        //     cell.classList.add('empty');
        // })
    }

    StartGame(data) {
        const position = data.position;
        const id = position.x * 20 + position.y;
        const cell = this.elementMAp[id]
        cell.classList.add(data.avatar);
        this.players[data.id] = { position: position, avatar: data.avatar, nickname: data.nickname, new_position: position }
        this.activateControls();
        return;
    }

    chatMessage(data) {
        const chat_s = document.getElementById('chat_s');
        const className = data.nickname === this.state.nickname ? 'message_other' : 'other';
        // (data.id == this.state.id) ? 'message_other' : ''}`
        // console.log(className);
        const message = createElement('div', { class: `message ${className}` }, [
            createElement('div', { class: 'chat_message' }, data.message.content),
            createElement('div', { class: 'message_name' }, data.nickname),
        ]);

        chat_s.appendChild(message);
    }

    handlePlayerDead() {
    }

    gameOver(data) {
        console.log(" hitted by bomb ", data)
        const player = this.stateManager.state
        // Create a new notification
        const chatContainer = document.getElementById('chat_s')
        if ((player && player.id !== undefined && data !== undefined) && player.id === data.id && data.life >= 0) {
            const playerContainer = document.getElementById(`${data.id}-life`);
            const listOfLife = playerContainer.querySelectorAll('.player-life i.lifefull');
            const lastChild = listOfLife[listOfLife.length - 1];
            lastChild.classList.remove('lifefull')
            lastChild.classList.add('lifeempty')
            // const lastPlayerLife = playerContainer.querySelector('.player-life i.full:last-child');
            // let playerLife = document.querySelector('.player-life i.full:last-child')

        } else {
            if (data.life >= 0) {
                const playerContainer = document.getElementById(`${data.id}-life`);
                const listOfLife = playerContainer.querySelectorAll('.player-life i.lifefull');
                const lastChild = listOfLife[listOfLife.length - 1];
                lastChild.classList.remove('lifefull')
                lastChild.classList.add('lifeempty')
                // const lastPlayerLife = playerContainer.querySelector('.player-life i.full:last-child');
                // console.log(lastChild)

                // let playerLife = document.querySelector('.player-life i.full:last-child')
                // console.log(playerLife)
                // document.querySelector(`.player-${player.id}`).style.textDecoration = "line-through";
            }
        }
        if ((player && player.id !== undefined && data !== undefined) && player.id === data.id) {
            const notificationToPlayer = createElement('div', { class: 'message message_other' }, [
                createElement('div', { class: 'chat_message' }, "Game Over For You, you've been killed"),
                createElement('div', { class: 'game-over' }, [
                    createElement('button', { class: 'replay', onClick: () => { this.removeState; this.redirectTo('/') } }, 'Replay'),
                ]),
                createElement('div', { class: 'message_name' }, 'Game Server')
            ]);
            chatContainer.appendChild(notificationToPlayer)
            this.componentWillUnmount()
        } else {
            const notificationToTeam = createElement('div', { class: 'message other' }, [
                createElement('div', { class: 'chat_message' }, `${data.nickname} is dead`),
                createElement('div', { class: 'message_name' }, 'Game Server')
            ]);
            chatContainer.appendChild(notificationToTeam)
            console.log(chatContainer)
        }

    }

    render() {
        // if (this.state.gameLoading) {
        //     return new LoadingScreen(this, this.stateManager).render(); // Render a loading screen while the game is loading
        // }
        // console.log(this.ws.send)
        return createElement('div', { id: 'container' }, [
            new Map(this, this.stateManager).render(),
            new Chat(this, this.stateManager).render(),
        ]);
    }
}

export default Game;

// Usage
// const timerComponent = 
// timerComponent.startTimer();