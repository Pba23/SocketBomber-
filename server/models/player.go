package models

import (
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

type Player struct {
	sync.RWMutex
	ID             uuid.UUID `json:"id"`
	MapId          int       `json:"mapId"`
	Avatar         string    `json:"avatar"`
	Nickname       string    `json:"nickname"`
	Position       *Position `json:"position"`
	Life           int       `json:"life"`
	Team           *Team     `json:"team"`
	Conn           *websocket.Conn
	Powers         string
	LastBombPlaced time.Time
}

type Bomb struct {
	Position Position   `json:"position"`
	Timer    int        `json:"timer"`
	Power    string     `json:"power"`
	Exploded bool       `json:"exploded"`
	Impact   []Position `json:"impact"`
}

// NewPlayer creates a new player.
func NewPlayer(nickname string, position *Position, team *Team, conn *websocket.Conn) *Player {
	return &Player{
		ID:             uuid.New(),
		Nickname:       nickname,
		Position:       position,
		Team:           team,
		Conn:           conn,
		LastBombPlaced: time.Now().Add(-4 * time.Second),
		Life:           3,
		Avatar:         Avatars[len(team.Players)],
		Powers:         "",
	}
}

// Send sends a message to the player.
func (p *Player) Send(response *Response) {
	if p.Conn == nil {
		return
	}
	p.Conn.WriteJSON(response)
}

// SetPosition sets the position.
func (p *Player) SetPosition(position *Position) {
	p.Lock()
	defer p.Unlock()
	p.Position = position
}

// SetTeam sets the team.
func (p *Player) SetTeam(team *Team) {
	p.Lock()
	defer p.Unlock()
	p.Team = team
}

func (p *Player) LifeDown() bool {
	p.Lock()
	defer p.Unlock()
	if p.Life > 0 {
		p.Life = p.Life - 1
	}
	return p.Life == 0
}

// IsDead returns true if the player is dead.
func (p *Player) IsDead() bool {
	p.RLock()
	defer p.RUnlock()
	return p.Life == 0
}

func (b *Bomb) NewBomb(x, y int, power string) {
	b.Position = Position{X: x, Y: y}
	b.Exploded = false
	b.Timer = 3
	b.Power = power
	b.Impact = []Position{}
}

func (b *Bomb) Explode(gameMap *Map, playerList map[uuid.UUID]*Player, response *Response) []string {
	b.Timer = 0
	b.Exploded = true
	deadPlayers := []string{}

	cell := (*gameMap)[b.Position.X][b.Position.Y]
	if cell != "wall" {
		(*gameMap)[b.Position.X][b.Position.Y] = "explode"
		if cell != "wall" && cell == "bomb" && cell != "empty" && cell != "explode" && cell != "block" {
			for id, player := range playerList {
				if player.Position.X == b.Position.X && player.Position.Y == b.Position.Y {
					deadPlayers = append(deadPlayers, id.String())
				}
			}
		}
		if cell != "wall" || cell == "bomb" || cell == "block" {
			response.FromImpact(b.Position.X, b.Position.Y)
		}
	}
	// Assuming you have a global game map or grid
	// Replace the positions around the bomb with 100
	if b.Position.X+1 < len(*gameMap) {
		cell = (*gameMap)[b.Position.X+1][b.Position.Y]
		if cell != "wall" {
			(*gameMap)[b.Position.X+1][b.Position.Y] = "explode"
			if cell != "wall" && cell != "bomb" && cell != "empty" && cell != "explode" && cell != "block" {
				deadPlayers = append(deadPlayers, cell)
			}
		}
		if cell != "wall" || cell == "bomb" || cell == "block" {
			response.FromImpact(b.Position.X+1, b.Position.Y)
		}
	}
	if b.Position.X-1 >= 0 {
		cell = (*gameMap)[b.Position.X-1][b.Position.Y]
		if cell != "wall" {
			(*gameMap)[b.Position.X-1][b.Position.Y] = "explode"
			if cell != "wall" && cell != "bomb" && cell != "empty" && cell != "explode" && cell != "block" {
				deadPlayers = append(deadPlayers, cell)
			}
		}
		if cell != "wall" || cell == "bomb" || cell == "block" {
			response.FromImpact(b.Position.X-1, b.Position.Y)
		}
	}
	if b.Position.Y+1 < len((*gameMap)[0]) {
		cell = (*gameMap)[b.Position.X][b.Position.Y+1]
		if cell != "wall" {
			(*gameMap)[b.Position.X][b.Position.Y+1] = "explode"
			if cell != "wall" && cell != "bomb" && cell != "empty" && cell != "explode" && cell != "block" {
				deadPlayers = append(deadPlayers, cell)
			}
		}
		if cell != "wall" || cell == "bomb" || cell == "block" {
			response.FromImpact(b.Position.X, b.Position.Y+1)
		}
	}
	if b.Position.Y-1 >= 0 {
		cell = (*gameMap)[b.Position.X][b.Position.Y-1]
		if cell != "wall" {
			(*gameMap)[b.Position.X][b.Position.Y-1] = "explode"
			if cell != "wall" && cell != "bomb" && cell != "empty" && cell != "explode" && cell != "block" {
				deadPlayers = append(deadPlayers, cell)
			}
		}
		if cell != "wall" || cell == "bomb" || cell == "block" {
			response.FromImpact(b.Position.X, b.Position.Y-1)
		}
	}

	if b.Power == PowerUps[1] {
		if b.Position.X+2 < len(*gameMap) {
			cell = (*gameMap)[b.Position.X+2][b.Position.Y]
			if cell != "wall" {
				(*gameMap)[b.Position.X+2][b.Position.Y] = "explode"
				if cell != "wall" && cell != "bomb" && cell != "empty" && cell != "explode" && cell != "block" {
					deadPlayers = append(deadPlayers, cell)
				}
				if cell != "wall" || cell == "bomb" || cell == "block" {
					response.FromImpact(b.Position.X+2, b.Position.Y)
				}
			}
		}
		if b.Position.X-2 >= 0 {
			cell = (*gameMap)[b.Position.X-2][b.Position.Y]
			if cell != "wall" {
				(*gameMap)[b.Position.X-2][b.Position.Y] = "explode"
				if cell != "wall" && cell != "bomb" && cell != "empty" && cell != "explode" && cell != "block" {
					deadPlayers = append(deadPlayers, cell)
				}
				if cell != "wall" || cell == "bomb" || cell == "block" {
					response.FromImpact(b.Position.X-2, b.Position.Y)
				}
			}
		}
		if b.Position.Y+2 < len((*gameMap)[0]) {
			cell = (*gameMap)[b.Position.X][b.Position.Y+2]
			if cell != "wall" {
				(*gameMap)[b.Position.X][b.Position.Y+2] = "explode"
				if cell != "wall" && cell != "bomb" && cell != "empty" && cell != "explode" && cell != "block" {
					deadPlayers = append(deadPlayers, cell)
				}
				if cell != "wall" || cell == "bomb" || cell == "block" {
					response.FromImpact(b.Position.X, b.Position.Y+2)
				}
			}
		}
		if b.Position.Y-2 >= 0 {
			cell = (*gameMap)[b.Position.X][b.Position.Y-2]
			if cell != "wall" {
				(*gameMap)[b.Position.X][b.Position.Y-2] = "explode"
				if cell != "wall" && cell != "bomb" && cell != "empty" && cell != "explode" && cell != "block" {
					deadPlayers = append(deadPlayers, cell)
				}
				if cell != "wall" || cell == "bomb" || cell == "block" {
					response.FromImpact(b.Position.X, b.Position.Y-2)
				}
			}
		}
	}
	// b.Exploded = true
	// log.Println(deadPlayers, "deadPlayers")
	return deadPlayers
}

func (b *Bomb) RemoveExplosion(team *Team) {
	gameMap := team.GameMap
	powers := team.Powers
	position := new(Position)
	powerFound := []*Position{}
	resp := new(Response)
	resp.FromBomb(b.Position.X, b.Position.Y, b.Power)
	(*gameMap)[b.Position.X][b.Position.Y] = "empty"
	resp.FromImpact(b.Position.X, b.Position.Y)
	if power, ok := powers[b.Position]; ok {
		(*gameMap)[b.Position.X][b.Position.Y] = power
		position.Update(b.Position.X, b.Position.Y)
		powerFound = append(powerFound, position)
	}
	// Replace the positions around the bomb with 0
	if b.Position.X+1 < len(*gameMap) && (*gameMap)[b.Position.X+1][b.Position.Y] != "wall" {
		(*gameMap)[b.Position.X+1][b.Position.Y] = "empty"
		resp.FromImpact(b.Position.X+1, b.Position.Y)
		if power, ok := powers[Position{X: b.Position.X + 1, Y: b.Position.Y}]; ok {
			(*gameMap)[b.Position.X+1][b.Position.Y] = power
			position.Update(b.Position.X+1, b.Position.Y)
			powerFound = append(powerFound, position)
		}
	}

	if b.Position.X-1 >= 0 && (*gameMap)[b.Position.X-1][b.Position.Y] != "wall" {
		(*gameMap)[b.Position.X-1][b.Position.Y] = "empty"
		resp.FromImpact(b.Position.X-1, b.Position.Y)
		if power, ok := powers[Position{X: b.Position.X - 1, Y: b.Position.Y}]; ok {
			(*gameMap)[b.Position.X-1][b.Position.Y] = power
			position.Update(b.Position.X-1, b.Position.Y)
			powerFound = append(powerFound, position)
		}
	}
	if b.Position.Y+1 < len((*gameMap)[0]) && (*gameMap)[b.Position.X][b.Position.Y+1] != "wall" {
		(*gameMap)[b.Position.X][b.Position.Y+1] = "empty"
		resp.FromImpact(b.Position.X, b.Position.Y+1)
		if power, ok := powers[Position{X: b.Position.X, Y: b.Position.Y + 1}]; ok {
			(*gameMap)[b.Position.X][b.Position.Y+1] = power
			position.Update(b.Position.X, b.Position.Y+1)
			powerFound = append(powerFound, position)
		}
	}
	if b.Position.Y-1 >= 0 && (*gameMap)[b.Position.X][b.Position.Y-1] != "wall" {
		(*gameMap)[b.Position.X][b.Position.Y-1] = "empty"
		resp.FromImpact(b.Position.X, b.Position.Y-1)
		if power, ok := powers[Position{X: b.Position.X, Y: b.Position.Y - 1}]; ok {
			(*gameMap)[b.Position.X][b.Position.Y-1] = power
			position.Update(b.Position.X, b.Position.Y-1)
			powerFound = append(powerFound, position)
		}
	}

	if b.Power == PowerUps[1] {
		if b.Position.X+2 < len(*gameMap) && (*gameMap)[b.Position.X+2][b.Position.Y] != "wall" {
			(*gameMap)[b.Position.X+2][b.Position.Y] = "empty"
			resp.FromImpact(b.Position.X+2, b.Position.Y)
			if power, ok := powers[Position{X: b.Position.X + 2, Y: b.Position.Y}]; ok {
				(*gameMap)[b.Position.X+2][b.Position.Y] = power
				position.Update(b.Position.X+2, b.Position.Y)
				powerFound = append(powerFound, position)
			}
		}
		if b.Position.X-2 >= 0 && (*gameMap)[b.Position.X-2][b.Position.Y] != "wall" {
			(*gameMap)[b.Position.X-2][b.Position.Y] = "empty"
			resp.FromImpact(b.Position.X-2, b.Position.Y)
			if power, ok := powers[Position{X: b.Position.X - 2, Y: b.Position.Y}]; ok {
				(*gameMap)[b.Position.X-2][b.Position.Y] = power
				position.Update(b.Position.X-2, b.Position.Y)
				powerFound = append(powerFound, position)
			}
		}
		if b.Position.Y+2 < len((*gameMap)[0]) && (*gameMap)[b.Position.X][b.Position.Y+2] != "wall" {
			(*gameMap)[b.Position.X][b.Position.Y+2] = "empty"
			resp.FromImpact(b.Position.X, b.Position.Y+2)
			if power, ok := powers[Position{X: b.Position.X, Y: b.Position.Y + 2}]; ok {
				(*gameMap)[b.Position.X][b.Position.Y+2] = power
				position.Update(b.Position.X, b.Position.Y+2)
				powerFound = append(powerFound, position)
			}
		}
		if b.Position.Y-2 >= 0 && (*gameMap)[b.Position.X][b.Position.Y-2] != "wall" {
			(*gameMap)[b.Position.X][b.Position.Y-2] = "empty"
			resp.FromImpact(b.Position.X, b.Position.Y-2)
			if power, ok := powers[Position{X: b.Position.X, Y: b.Position.Y - 2}]; ok {
				(*gameMap)[b.Position.X][b.Position.Y-2] = power
				position.Update(b.Position.X, b.Position.Y-2)
				powerFound = append(powerFound, position)
			}
		}
	}

	if len(powerFound) > 0 {
		for _, power := range powerFound {
			resp.FromTeam(team, PowerFound)
			position := new(Position)
			position.Update(power.X, power.Y)
			resp.FromPower(power.X, power.Y, powers[*position])
			team.Broadcast(resp)
		}
	} else {
		resp.FromTeam(team, PowerFound)
		team.Broadcast(resp)
	}

	// log.Println("Explosion removed", gameMap)
}
