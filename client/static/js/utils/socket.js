
class Socket {
    constructor(url, callback) {
        this.ws = new WebSocket(`ws://${window.location.host}/gamesocket`);

        callback && callback(this.ws);
    }

    send(data) {
        this.ws.send(JSON.stringify(data));
    }

    onMessage(callback) {
        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            callback && callback(data);
        }
    }
}


export const ws = new Socket();