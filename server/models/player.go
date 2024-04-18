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

func (b *Bomb) Explode(team *Team) []string {
	gameMap := team.GameMap
	// playerList := team.Players
	b.Timer = 0
	b.Exploded = true
	deadPlayers := []string{}

	response := new(Response)
	response.FromTeam(team, BombExploded)

	cell := (*gameMap)[b.Position.X][b.Position.Y]
	if cell != "wall" {
		(*gameMap)[b.Position.X][b.Position.Y] = "explode"
		if cell != "wall" && cell == "bomb" && cell != "empty" && cell != "explode" && cell != "block" && cell != PowerUps[0] && cell != PowerUps[1] && cell != PowerUps[2] {
			deadPlayers = append(deadPlayers, cell)
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
			if cell != "wall" && cell != "bomb" && cell != "empty" && cell != "explode" && cell != "block" && PowerUps[0] != cell && PowerUps[1] != cell && PowerUps[2] != cell {
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
			if cell != "wall" && cell != "bomb" && cell != "empty" && cell != "explode" && cell != "block" && PowerUps[0] != cell && PowerUps[1] != cell && PowerUps[2] != cell {
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
			if cell != "wall" && cell != "bomb" && cell != "empty" && cell != "explode" && cell != "block" && PowerUps[0] != cell && PowerUps[1] != cell && PowerUps[2] != cell {
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
			if cell != "wall" && cell != "bomb" && cell != "empty" && cell != "explode" && cell != "block" && PowerUps[0] != cell && PowerUps[1] != cell && PowerUps[2] != cell {
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
				if cell != "wall" && cell != "bomb" && cell != "empty" && cell != "explode" && cell != "block" && PowerUps[0] != cell && PowerUps[1] != cell && PowerUps[2] != cell {
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
				if cell != "wall" && cell != "bomb" && cell != "empty" && cell != "explode" && cell != "block" && PowerUps[0] != cell && PowerUps[1] != cell && PowerUps[2] != cell {
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
				if cell != "wall" && cell != "bomb" && cell != "empty" && cell != "explode" && cell != "block" && PowerUps[0] != cell && PowerUps[1] != cell && PowerUps[2] != cell {
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
				if cell != "wall" && cell != "bomb" && cell != "empty" && cell != "explode" && cell != "block" && PowerUps[0] != cell && PowerUps[1] != cell && PowerUps[2] != cell {
					deadPlayers = append(deadPlayers, cell)
				}
				if cell != "wall" || cell == "bomb" || cell == "block" {
					response.FromImpact(b.Position.X, b.Position.Y-2)
				}
			}
		}
	}
	b.Exploded = true
	team.Broadcast(response)

	// log.Println(deadPlayers, "deadPlayers")
	return deadPlayers
}

func (b *Bomb) RemoveExplosion(team *Team) {
	gameMap := team.GameMap
	powers := team.Powers
	position := new(Position)
	powerFound := map[*Position]string{}
	resp := new(Response)
	resp.FromBomb(b.Position.X, b.Position.Y, b.Power)
	(*gameMap)[b.Position.X][b.Position.Y] = "empty"
	resp.FromImpact(b.Position.X, b.Position.Y)
	if power, ok := powers[b.Position]; ok {
		(*gameMap)[b.Position.X][b.Position.Y] = power
		position.Update(b.Position.X, b.Position.Y)
		powerFound[position] = power
	}
	// Replace the positions around the bomb with 0
	if b.Position.X+1 < len(*gameMap) && (*gameMap)[b.Position.X+1][b.Position.Y] != "wall" {
		(*gameMap)[b.Position.X+1][b.Position.Y] = "empty"
		resp.FromImpact(b.Position.X+1, b.Position.Y)
		if power, ok := powers[Position{X: b.Position.X + 1, Y: b.Position.Y}]; ok {
			(*gameMap)[b.Position.X+1][b.Position.Y] = power
			position.Update(b.Position.X+1, b.Position.Y)
			powerFound[position] = power
		}
	}

	if b.Position.X-1 >= 0 && (*gameMap)[b.Position.X-1][b.Position.Y] != "wall" {
		(*gameMap)[b.Position.X-1][b.Position.Y] = "empty"
		resp.FromImpact(b.Position.X-1, b.Position.Y)
		if power, ok := powers[Position{X: b.Position.X - 1, Y: b.Position.Y}]; ok {
			(*gameMap)[b.Position.X-1][b.Position.Y] = power
			position.Update(b.Position.X-1, b.Position.Y)
			powerFound[position] = power
		}
	}
	if b.Position.Y+1 < len((*gameMap)[0]) && (*gameMap)[b.Position.X][b.Position.Y+1] != "wall" {
		(*gameMap)[b.Position.X][b.Position.Y+1] = "empty"
		resp.FromImpact(b.Position.X, b.Position.Y+1)
		if power, ok := powers[Position{X: b.Position.X, Y: b.Position.Y + 1}]; ok {
			(*gameMap)[b.Position.X][b.Position.Y+1] = power
			position.Update(b.Position.X, b.Position.Y+1)
			powerFound[position] = power
		}
	}
	if b.Position.Y-1 >= 0 && (*gameMap)[b.Position.X][b.Position.Y-1] != "wall" {
		(*gameMap)[b.Position.X][b.Position.Y-1] = "empty"
		resp.FromImpact(b.Position.X, b.Position.Y-1)
		if power, ok := powers[Position{X: b.Position.X, Y: b.Position.Y - 1}]; ok {
			(*gameMap)[b.Position.X][b.Position.Y-1] = power
			position.Update(b.Position.X, b.Position.Y-1)
			powerFound[position] = power
		}
	}

	if b.Power == PowerUps[1] {
		if b.Position.X+2 < len(*gameMap) && (*gameMap)[b.Position.X+2][b.Position.Y] != "wall" {
			(*gameMap)[b.Position.X+2][b.Position.Y] = "empty"
			resp.FromImpact(b.Position.X+2, b.Position.Y)
			if power, ok := powers[Position{X: b.Position.X + 2, Y: b.Position.Y}]; ok {
				(*gameMap)[b.Position.X+2][b.Position.Y] = power
				position.Update(b.Position.X+2, b.Position.Y)
				powerFound[position] = power
			}
		}
		if b.Position.X-2 >= 0 && (*gameMap)[b.Position.X-2][b.Position.Y] != "wall" {
			(*gameMap)[b.Position.X-2][b.Position.Y] = "empty"
			resp.FromImpact(b.Position.X-2, b.Position.Y)
			if power, ok := powers[Position{X: b.Position.X - 2, Y: b.Position.Y}]; ok {
				(*gameMap)[b.Position.X-2][b.Position.Y] = power
				position.Update(b.Position.X-2, b.Position.Y)
				powerFound[position] = power
			}
		}
		if b.Position.Y+2 < len((*gameMap)[0]) && (*gameMap)[b.Position.X][b.Position.Y+2] != "wall" {
			(*gameMap)[b.Position.X][b.Position.Y+2] = "empty"
			resp.FromImpact(b.Position.X, b.Position.Y+2)
			if power, ok := powers[Position{X: b.Position.X, Y: b.Position.Y + 2}]; ok {
				(*gameMap)[b.Position.X][b.Position.Y+2] = power
				position.Update(b.Position.X, b.Position.Y+2)
				powerFound[position] = power
			}
		}
		if b.Position.Y-2 >= 0 && (*gameMap)[b.Position.X][b.Position.Y-2] != "wall" {
			(*gameMap)[b.Position.X][b.Position.Y-2] = "empty"
			resp.FromImpact(b.Position.X, b.Position.Y-2)
			if power, ok := powers[Position{X: b.Position.X, Y: b.Position.Y - 2}]; ok {
				(*gameMap)[b.Position.X][b.Position.Y-2] = power
				position.Update(b.Position.X, b.Position.Y-2)
				powerFound[position] = power
			}
		}
	}
	if len(powerFound) > 0 {
		for position, power := range powerFound {
			resp.FromTeam(team, PowerFound)
			resp.FromPower(position.X, position.Y, power)
			team.Broadcast(resp)
		}
	}
	// else {
	// 	resp.FromTeam(team, PowerFound)
	// 	team.Broadcast(resp)
	// }

	// log.Println("Explosion removed", gameMap)
}
