class Player {
    constructor(id = '', nickname = '', x = 0, y = 0, avatar = '') {
        this.id = id;
        this.nickname = nickname;
        this.position = { x, y };
        this.avatar = avatar;
        this.mapId = '';
    }

    fromJSON(json = {}) {
        if (json === null) return this;
        this.id = json.id || this.id;
        this.nickname = json.nickname || this.nickname;
        this.position = json.position || this.position;
        this.avatar = json.avatar || this.avatar;
        this.mapId = json.mapId || this.mapId;
        return this;
    }

    object() {
        return {
            id: this.id,
            nickname: this.nickname,
            position: this.position,
            avatar: this.avatar,
            mapId: this.mapId
        }
    }
}

class Team {
    constructor(id = '', name = '', state = '', players = [], map = []) {
        this.id = id;
        this.name = name;
        this.state = state;
        this.players = players.map(player => new Player().fromJSON(player));
        this.map = map;
    }

    fromJSON(json = {}) {
        if (json === null) return this;
        this.id = json.id || this.id;
        this.name = json.name || this.name;
        this.state = json.state || this.state;
        this.players = Array.isArray(json.players) ? json.players.map(player => new Player().fromJSON(player)) : this.players;
        this.map = json.map || this.map;
        return this;
    }

    object() {
        return {
            id: this.id,
            name: this.name,
            state: this.state,
            players: this.players.map(player => player.object()),
            map: this.map
        }
    }
}

class Response {
    constructor({ player = {}, team = {} } = {}) {
        this.player = new Player().fromJSON(player);
        this.team = new Team().fromJSON(team);
    }

    fromJSON(json = {}) {
        if (json === null) return this;
        this.team = new Team().fromJSON(json.team || {});
        this.player = new Player().fromJSON(json.player || {});
        return this;
    }

    object() {
        return {
            player: this.player.object(),
            team: this.team.object()
        }
    }
}

export default {
    Team,
    Player,
    Response
}