package models

import (
	"sync"

	"github.com/google/uuid"
)

type State string

const (
	Waiting    State = "waiting"
	Playing    State = "playing"
	Finished   State = "finished"
	MaxPlayers       = 2
)

// Rom represents a ROM file.
type Team struct {
	sync.RWMutex
	ID      uuid.UUID             `json:"id"`
	Name    string                `json:"name"`
	Players map[uuid.UUID]*Player `json:"players"`
	State   State                 `json:"state"`
	GameMap *Map                  `json:"map"`
}

// NewTeam creates a new team.
func NewTeam(name string, size int) *Team {
	return &Team{
		ID:      uuid.New(),
		Name:    name,
		Players: make(map[uuid.UUID]*Player, MaxPlayers),
		State:   Waiting,
		GameMap: NewMap(size),
	}
}

// AddPlayer adds a new player.
func (t *Team) AddPlayer(player *Player) {
	t.Lock()
	defer t.Unlock()
	t.Players[player.ID] = player
}

// RemovePlayer removes the player with the given ID.
func (t *Team) RemovePlayer(id uuid.UUID) {
	t.Lock()
	defer t.Unlock()
	delete(t.Players, id)
}

// GetPlayer returns the player with the given ID.
func (t *Team) GetPlayer(id uuid.UUID) *Player {
	t.RLock()
	defer t.RUnlock()
	return t.Players[id]
}

// UpdatePlayer updates the player with the given ID.
func (t *Team) UpdatePlayer(id uuid.UUID, player *Player) {
	t.Lock()
	defer t.Unlock()
	t.Players[id] = player
}

// GetPlayers returns the players.
func (t *Team) GetPlayers() map[uuid.UUID]*Player {
	t.RLock()
	defer t.RUnlock()
	return t.Players
}

// GetPlayerByNickname returns the player with the given nickname.
func (t *Team) GetPlayerByNickname(nickname string) *Player {
	t.RLock()
	defer t.RUnlock()
	for _, player := range t.Players {
		if player.Nickname == nickname {
			return player
		}
	}
	return nil
}
