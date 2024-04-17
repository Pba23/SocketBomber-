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

    // generateBooleanArray(number) {
    //     if (number === 3) {
    //         return [true, true, true];
    //     } else if (number === 2) {
    //         return [true, true, false];
    //     } else if (number === 1) {
    //         return [true, false, false];
    //     } else {
    //         // Handle other cases if needed
    //         return [false, false, false];
    //     }
    // }

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

    render() {
        return createElement('div', { id: 'chat' }, [
            createElement('div', { class: 'chat_header' }, [
                createElement('div', { class: 'player' }, '1'),
                createElement('div', { class: 'player' }, '2'),
                createElement('div', { class: 'player' }, '3'),
                createElement('div', { class: 'player' }, '4'),
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
        const allElements = []
        game_map.forEach((row, x) => {
            row.forEach((cell, y) => {
                const id = x * 20 + y;
                allElements.push(createElement('div', { id: `${id}`, class: `cell ${cell}` }))
            });
        })
        return createElement('div', { id: 'map' }, [
            allElements.map((element) => {
                return element
            })
        ]);
    }
}


class Game extends router.Component {

    players = {}


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
            const cell = document.getElementById(`${id}`);
            cell.classList.remove(player.avatar);
            // cell.classList.add('cell');
            player.position = player.new_position;
            const new_id = player.position.x * 20 + player.position.y;
            const new_cell = document.getElementById(`${new_id}`);
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


    disableControls() {
        removeListeners(window, "keydown", this.handleKeyDown);
    }

    activateControls() {
        addListener(window, "keydown", this.handleKeyDown);
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
                console.log("powerFound\n", resp)
                this.removeBomb(resp)
                return;
                return;
            case "playerEliminated":
                console.log("playerEliminated\n", resp)
                return;
            case "playerDead":
                console.log("playerDead\n", resp)
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
        const cell = document.getElementById(`${id}`);
        cell.classList.add('bombplaced');
    }

    bombExplosion(data) {
        const impacts = data.bomb.impact
        impacts.forEach(impact => {
            const position = impact;
            const id = position.x * 20 + position.y;
            const cell = document.getElementById(`${id}`);
            cell.classList.add('bombexplosion');
        })
    }

    removeBomb(data) {
        console.log(data)
        const position = data.bomb.position;
        const id = position.x * 20 + position.y;
        const cell = document.getElementById(`${id}`);
        cell.classList.remove('bombplaced');
    }

    StartGame(data) {
        const position = data.position;
        const id = position.x * 20 + position.y;
        const cell = document.getElementById(`${id}`);
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

    gameOver() {
        console.log("Game over for You")
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