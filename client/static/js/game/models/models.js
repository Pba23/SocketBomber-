class Player {
    constructor(id = '', nickname = '', x = 0, y = 0, avatar = '', life = 0) {
        this.id = id;
        this.nickname = nickname;
        this.position = { x, y };
        this.avatar = avatar;
        this.mapId = '';
        this.life = life
    }

    fromJSON(json = {}) {
        if (json === null) return this;
        this.id = json.id || this.id;
        this.nickname = json.nickname || this.nickname;
        this.position = json.position || this.position;
        this.avatar = json.avatar || this.avatar;
        this.mapId = json.mapId || this.mapId;
        this.life = json.life || this.life;
        return this;
    }

    object() {
        return {
            id: this.id,
            nickname: this.nickname,
            position: this.position,
            avatar: this.avatar,
            mapId: this.mapId,
            life: this.life
        }
    }
}

class Position {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }
}

class Team {
    constructor(id = '', name = '', state = '', players = [], map = [], bombs = [], started = false) {
        this.id = id;
        this.name = name;
        this.state = state;
        this.players = players.map(player => new Player().fromJSON(player));
        this.map = map;
        this.bombs = bombs;
        this.started = started;
    }

    fromJSON(json = {}) {
        if (json === null) return this;
        this.id = json.id || this.id;
        this.name = json.name || this.name;
        this.state = json.state || this.state;
        this.players = Array.isArray(json.players) ? json.players.map(player => new Player().fromJSON(player)) : this.players;
        this.map = json.map || this.map;
        this.bombs = json.bombs || this.bombs;
        this.started = json.started || this.started;
        return this;
    }

    object() {
        return {
            id: this.id,
            name: this.name,
            state: this.state,
            players: this.players.map(player => player.object()),
            map: this.map,
            bombs: this.bombs,
            started: this.started
        }
    }
}

class Response {
    constructor(id = '', nickname = '', avatar = '', life = 0, message = null, position = new Position(), newPosition = new Position(), team = new Team(), bomb = null, power = '', type = '') {
        this.id = id;
        this.nickname = nickname;
        this.avatar = avatar;
        this.life = life;
        this.message = message;
        this.position = position;
        this.newPosition = newPosition;
        this.team = team;
        this.bomb = bomb;
        this.power = power;
        this.type = type;
    }

    fromJSON(json) {
        for (let propName in json) {
            if (json.hasOwnProperty(propName)) {
                this[propName] = json[propName];
            }
        }
        return this;
    }

    toObject() {
        return {
            id: this.id,
            nickname: this.nickname,
            avatar: this.avatar,
            life: this.life,
            message: this.message,
            position: this.position,
            newPosition: this.newPosition,
            team: this.team,
            bomb: this.bomb,
            power: this.power,
            type: this.type
        };
    }
}

export default {
    Team,
    Player,
    Response
}