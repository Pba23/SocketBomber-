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

class Team {
    constructor(id = '', name = '', state = '', players = [], map = [], bombs = []) {
        this.id = id;
        this.name = name;
        this.state = state;
        this.players = players.map(player => new Player().fromJSON(player));
        this.map = map;
        this.bombs = bombs;
    }

    fromJSON(json = {}) {
        if (json === null) return this;
        this.id = json.id || this.id;
        this.name = json.name || this.name;
        this.state = json.state || this.state;
        this.players = Array.isArray(json.players) ? json.players.map(player => new Player().fromJSON(player)) : this.players;
        this.map = json.map || this.map;
        this.bombs = json.bombs || this.bombs;
        return this;
    }

    object() {
        return {
            id: this.id,
            name: this.name,
            state: this.state,
            players: this.players.map(player => player.object()),
            map: this.map,
            bombs: this.bombs
        }
    }
}

class Response {
    constructor({ player = {}, team = {}, type = '', value = '', message = {} } = {}) {
        this.player = new Player().fromJSON(player);
        this.team = new Team().fromJSON(team);
        this.type = type;
        this.value = value
        this.message = message
    }

    fromJSON(json = {}) {
        if (json === null) return this;
        this.team = new Team().fromJSON(json.team || {});
        this.player = new Player().fromJSON(json.player || {});
        this.type = json.type || this.type;
        this.value = json.value || this.value
        this.message = json.message || this.message
        return this;
    }

    object() {
        return {
            player: this.player.object(),
            team: this.team.object(),
            type: this.type,
            value: this.value,
            message: this.message
        }
    }
}

export default {
    Team,
    Player,
    Response
}