const websocketUrl = `ws://${window.location.host}/gamesocket`;

const ws = new WebSocket(websocketUrl);

ws.onopen = () => {
    console.log('WebSocket connection established.');
};

ws.onmessage = (event) => {
    console.log('Websocket Origin response from Server :', event.data);
};

ws.onerror = (error) => {
    console.error('Websocket Origin Error:', error);
};

ws.onclose = () => {
    console.log('WebSocket Origin connection closed.');
};

// class Socket {
//     constructor(url, callback) {
//         this.ws = new WebSocket(`ws://${window.location.host}/gamesocket`);

//         callback(this.ws);
//     }

//     send(data) {
//         // console.log(data, this.ws)
//         this.ws.send(JSON.stringify(data));
//     }

//     onMessage(callback) {
//         this.ws.onmessage = (event) => {
//             const data = JSON.parse(event.data);
//             callback(data);
//         }
//     }
// }

export default ws;
