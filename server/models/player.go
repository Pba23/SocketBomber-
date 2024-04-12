package models

import (
	"sync"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

type Player struct {
	sync.RWMutex
	ID       uuid.UUID `json:"id"`
	Nickname string    `json:"nickname"`
	Position *Position `json:"position"`
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
		Conn:    nil,
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
