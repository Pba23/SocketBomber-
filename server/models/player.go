package models

import (
	"sync"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

type Player struct {
	sync.RWMutex
	ID       uuid.UUID `json:"id"`
	MapId    int       `json:"mapId"`
	Avatar   string    `json:"avatar"`
	Nickname string    `json:"nickname"`
	Position *Position `json:"position"`
	Life     int       `json:"life"`
	Team     *Team     `json:"team"`
	Conn     *websocket.Conn
}

// NewPlayer creates a new player.
func NewPlayer(nickname string, position *Position, team *Team) *Player {
	return &Player{
		ID:       uuid.New(),
		Nickname: nickname,
		Position: position,
		Team:     team,
		Conn:     nil,
		Life:     3,
	}
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
