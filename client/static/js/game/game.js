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

    render() {
        const playersObj = this.props.stateManager.state.team.players
        return createElement('div', { id: 'chat' }, [
            createElement('div', { class: 'chat_header' }, [
                playersObj.map(player => {
                    return createElement('div', { class: 'player', id: `${player.id}-life` }, [
                        createElement('img', { src: `/static/assets/avatars/${player.avatar}.png`, alt: player.nickname }),
                        createElement('p', {}, player.nickname),
                        createElement('div', { class: 'player-status' }, player.status),
                        createElement('div', { class: 'player-life' }, [
                            [true, true, true].map((life, index) => {
                                return createElement('i', { class: `${life ? 'bx bxs-bomb' : 'bx bx-bomb'}` }, '');
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


class Map extends router.Component {
    constructor(props, stateManager) {
        super(props);

        const resp = new models.Response().fromJSON(stateManager.state);
        this.state = resp;
    }


    render() {
        // const game_map = this.state.team.map;
        const allElements = Object.values(this.props.elementMAp)
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
    Bombs = {}
    impacts = {}
    lifeDowm = {}
    powers = {}


    constructor(props, stateManager) {
        super(props);
        this.router = props.router;
        this.stateManager = stateManager;

        this.TIME_LIMIT = 10;
        this.timePassed = 0;
        this.timeLeft = this.TIME_LIMIT;
        this.timerInterval = null;
        this.animationFrameId = null;


        if (!this.stateManager.state.id) {
            this.router.navigate('/');
        }

        const resp = new models.Response().fromJSON(stateManager.state);
        this.state = { ...this.state, ...resp.toObject() };
        this.state['isChatInputFocused'] = false;
        resp.team.map.forEach((row, x) => {
            row.forEach((cell, y) => {
                const id = x * 20 + y;
                this.elementMAp[id] = createElement('div', { id: `${id}`, class: `cell ${cell}` });
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
            new_cell.classList.remove('flash')
            new_cell.classList.remove('fire')
            new_cell.classList.remove('lindworm')
            new_cell.classList.add(player.avatar);
        });

        const bombKeys = Object.keys(this.Bombs);
        bombKeys.forEach((key) => {
            const bomb = this.Bombs[key];
            if (bomb === undefined || bomb === false) return;
            const cell = this.elementMAp[key]
            cell.classList.add('bomb');
            this.Bombs[key] = false;
            delete this.Bombs[key];
        });

        const impactKeys = Object.keys(this.impacts);
        impactKeys.forEach((key) => {
            const impact = this.impacts[key]
            if (impact === undefined || impact === false) return

            const cell = this.elementMAp[key]
            cell.classList.remove('block')

            this.explodeBomb(cell)
            this.impacts[key] = false
            delete this.impacts[key]

        });

        const powerKeys = Object.keys(this.powers);
        powerKeys.forEach((key) => {
            const power = this.powers[key];
            if (power === undefined) return;
            const cell = this.elementMAp[key]
            cell.classList.add(power);
            delete this.powers[key];
        });

        if (this.lifeDowm.data != undefined) {
            if (this.lifeDowm.life != this.state.life) {
                if (this.state.id === this.lifeDowm?.data.id && this.lifeDowm?.data?.life > 0) {
                    // Create a new notification
                    const chatContainer = document.getElementById('chat_s')
                    const notification = createElement('div', { class: 'message message_other' }, [
                        createElement('div', { class: 'chat_message' }, "You've been hitted"),
                        createElement('div', { class: 'message_name' }, 'Game Server')
                    ]);
                    chatContainer.appendChild(notification)

                    const playerContainer = document.getElementById(`${this.lifeDowm.data.id}-life`);
                    const listOfLife = playerContainer.querySelectorAll('.player-life i.bxs-bomb');
                    const lastChild = listOfLife[listOfLife.length - 1];
                    lastChild.classList.remove('bxs-bomb')
                    lastChild.classList.add('bx-bomb')
                    // const lastPlayerLife = playerContainer.querySelector('.player-life i.full:last-child');
                    // let playerLife = document.querySelector('.player-life i.full:last-child')

                    this.state.life = this.lifeDowm.data.life
                } else {
                    if (this.lifeDowm?.data?.life !== undefined && this.lifeDowm?.data?.life >= 0) {
                        const playerContainer = document.getElementById(`${this.lifeDowm.data.id}-life`);
                        const listOfLife = playerContainer.querySelectorAll('.player-life i.bxs-bomb');
                        const lastChild = listOfLife[listOfLife.length - 1];
                        lastChild.classList.remove('bxs-bomb')
                        lastChild.classList.add('bx-bomb')
                        // const lastPlayerLife = playerContainer.querySelector('.player-life i.full:last-child');
                        // console.log(lastChild)

                        // let playerLife = document.querySelector('.player-life i.full:last-child')
                        // console.log(playerLife)
                        // document.querySelector(`.player-${player.id}`).style.textDecoration = "line-through";
                    }
                }
            }
            delete this.lifeDowm["data"]
        }

        if (this.lifeDowm.gameOver != undefined) {
            // Create a new notification
            const chatContainer = document.getElementById('chat_s')
            if (this.state.id === this.lifeDowm?.gameOver.id && this.lifeDowm?.gameOver.life == 0) {
                const playerContainer = document.getElementById(`${this.lifeDowm.gameOver.id}-life`);
                const listOfLife = playerContainer.querySelectorAll('.player-life i.bxs-bomb');
                const lastChild = listOfLife[listOfLife.length - 1];
                lastChild.classList.remove('bxs-bomb')
                lastChild.classList.add('bx-bomb')
                const notificationToPlayer = createElement('div', { class: 'message message_other' }, [
                    createElement('div', { class: 'chat_message' }, "Game Over For You, you've been killed"),
                    createElement('div', { class: 'game-over' }, [
                        createElement('button', { class: 'replay', onClick: () => { this.removeState; this.redirectTo('/') } }, 'Replay'),
                    ]),
                    createElement('div', { class: 'message_name' }, 'Game Server')
                ]);
                chatContainer.appendChild(notificationToPlayer)
                this.componentWillUnmount()
                this.state.life = 0
            } else {
                if (this.lifeDowm?.gameOver?.life == 0) {
                    const playerContainer = document.getElementById(`${this.lifeDowm.gameOver.id}-life`);
                    const listOfLife = playerContainer.querySelectorAll('.player-life i.bxs-bomb');
                    const lastChild = listOfLife[listOfLife.length - 1];
                    lastChild.classList.remove('bxs-bomb')
                    lastChild.classList.add('bx-bomb')

                    const notificationToTeam = createElement('div', { class: 'message other' }, [
                        createElement('div', { class: 'chat_message' }, `${this.lifeDowm.gameOver.nickname} is dead`),
                        createElement('div', { class: 'message_name' }, 'Game Server')
                    ]);
                    chatContainer.appendChild(notificationToTeam)
                }
            }
            // if (this.state.id === this.lifeDowm?.gameOver?.id) {
            // } else {
            // }
            delete this.lifeDowm["gameOver"]
        }

    }

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
            case 'bombExploded':
                this.bombExplosion(resp)
                return;
            case "powerFound":
                this.powerFound(resp)
                return;
            case "playerEliminated":
                this.playerAttacked(resp)
                return;
            case "playerDead":
                this.gameOver(resp)
                return;
            case 'gameOver':
                alert(resp.newPosition + ' won the game');
                this.router.navigate('/');
                return;
            case 'gameFinished':
                alert('Game finished');
                this.router.navigate('/');
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
        this.Bombs[id] = true;
    }

    bombExplosion(data) {
        const impacts = data.bomb.impact
        impacts.forEach((position) => {
            const id = position.x * 20 + position.y;
            this.impacts[id] = true
        })

    }

    explodeBomb(bombElement) {
        if (bombElement.className === "explosion") return

        // Store initial properties
        const initialTransition = bombElement.style.transition;
        const initialAnimationDuration = bombElement.style.animationDuration;
        const initialTransform = bombElement.style.transform;
        // const randomDegs = Math.round(Math.random() * 360)
        bombElement.className = "explosion"
        // bombElement.style.transition = "unset"
        // bombElement.style.animationDuration = `${450}ms`
        // bombElement.style.transform = `rotate(${randomDegs}deg)`

        let start;
        let frameId;
        function step(timestamp) {
            if (start === undefined)
                start = timestamp;
            const elapsed = timestamp - start;

            if (elapsed < 450) { // 450ms is the duration of your timeout
                frameId = requestAnimationFrame(step);
            } else {
                bombElement.classList.remove('explosion');
                bombElement.className = 'cell';

                // bombElement.style.transition = initialTransition;
                // bombElement.style.animationDuration = initialAnimationDuration;
                // bombElement.style.transform = initialTransform;

                // Cancel the animation frame
                cancelAnimationFrame(frameId);
            }
        }

        frameId = requestAnimationFrame(step);
    }

    playerAttacked(data) {
        // reduce life of the player
        if (data.life > 0) {
            this.lifeDowm.data = data
        }
    }

    // FUNCTION SHOWING SAID Player is attacked
    playerEliminationNotification() {
        if (data.life > 0) {
            this.lifeDowm.data = data
        }
        // console.log(chatContainer)

        // Remove the notification after 2 seconds
        // const out = setTimeout(() => {
        //     removeChild(notification);
        //     clearTimeout(out);
        // }, 2000);
    }

    powerFound(data) {
        const position = data.position;
        const id = position.x * 20 + position.y;

        this.powers[id] = data.power
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
        if (data.life == 0) {
            this.lifeDowm.gameOver = data
        }
    }

    render() {
        return createElement('div', { id: 'container' }, [
            new Map(this, this.stateManager).render(),
            new Chat(this, this.stateManager).render(),
        ]);
    }
}

export default Game;
