const websocketUrl = `ws://${window.location.host}/gamesocket`;

const ws = new WebSocket(websocketUrl);

ws.onopen = () => {
    console.log('WebSocket connection established.');
};

ws.onmessage = (event) => {
    console.log('Message from server:', event.data);
    // Handle incoming messages from the server
};

ws.onerror = (error) => {
    console.error('WebSocket error:', error);
};

ws.onclose = () => {
    console.log('WebSocket connection closed.');
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
