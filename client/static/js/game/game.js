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
        console.log(event.target.value);
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

    render() {
        return createElement('div', { id: 'chat' }, [
            createElement('div', { class: "chat_header"}, [
                this.props.state.team.players.map(player => {
                    const booleanArray = this.generateBooleanArray(player.life)
                    return createElement('div', { class: 'player', id: player.id }, [
                        createElement('i', {}, player.avatar),
                        // createElement('img', { src: player.avatar, alt: player.nickname }),
                        createElement('p', {}, player.nickname),
                        createElement('div', { class: 'player-name' }, player.nickname),
                        createElement('div', { class: 'player-status' }, player.status),
                        createElement('div', { class: 'player-life' },
                            booleanArray.map((life, index) => {
                                return createElement('i', { class: `bx bxs-bomb ${life ? 'full' : 'empty'}` }, '');
                            })
                        ),
                    ]);
                })
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
                    createElement('button', {
                        type: 'button', class: 'send', onClick: (event) => {
                            this.handleSendMessage(event)
                        }
                    }, 'Send'),
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

// class LoadingScreen extends router.Component {
//     render() {
//         return createElement('div', { class: 'loading-screen' }, [
//             createElement('div', { class: 'spinner' }, 'Loading...'), // You can customize the loading indicator
//         ]);
//     }
// }

class Map extends router.Component {
    constructor(props, stateManager) {
        super(props, stateManager);
        console.log(props.state.team.map);
        this.state = {
            map: []
        };
    }

    render() {
        // console.log(this.state.map)
        // const // Taille de la carte en pixels
        // const 
        return createElement('div', { id: 'map' }, [
            this.state.map.map((value) => {
                return createElement('div', { class: `cell ${value}`} )
            })
        ]);
    }
}


class Game extends router.Component {
    constructor(props, stateManager) {
        super(props);
        this.router = props.router;
        this.stateManager = stateManager;

        if (!this.stateManager.state.id) {
            this.router.navigate('/');
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

