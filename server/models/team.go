package models

import (
	"sync"

	"github.com/google/uuid"
)

type State string

const (
	Waiting     State = "waiting"
	TeamPlaying State = "playing"
	Finished    State = "finished"
	MaxPlayers        = 4
)

var Avatars = []string{"a", "b", "c", "d"}

// Rom represents a ROM file.
type Team struct {
	sync.RWMutex
	ID      uuid.UUID             `json:"id"`
	Name    string                `json:"name"`
	Players map[uuid.UUID]*Player `json:"players"`
	State   State                 `json:"state"`
	GameMap *Map                  `json:"map"`
	Start   bool                  `json:"start"`
	Powers  map[Position]string   `json:"powers"`
}

// // NewTeam creates a new team.
func NewTeam(name string, size int) *Team {
	t := &Team{
		ID:      uuid.New(),
		Name:    name,
		Players: make(map[uuid.UUID]*Player, MaxPlayers),
		State:   Waiting,
		GameMap: NewMap(size),
		Start:   false,
	}
	return t
}

// StartGame starts the game.
func (t *Team) StartGame() {
	t.Lock()
	defer t.Unlock()
	t.Start = true
}

// AddPlayer adds a new player.
func (t *Team) AddPlayer(player *Player) {
	t.Lock()
	defer t.Unlock()
	t.Players[player.ID] = player
}

// GetPlayer returns the player with the given ID.
func (t *Team) GetPlayer(id uuid.UUID) *Player {
	t.RLock()
	defer t.RUnlock()
	return t.Players[id]
}

// Broadcast sends a message to all players.
func (t *Team) Broadcast(response *Response) {
	t.RLock()
	defer t.RUnlock()
	for _, player := range t.Players {
		player.Send(response)
	}
}

func (T *Team) ExplodeBomb(bomb *Bomb) []string {
	deadPlayers := []string{}
	resp := new(Response)
	resp.FromBomb(bomb.Position.X, bomb.Position.Y, bomb.Power)
	deadPlayers = bomb.Explode(T.GameMap, T.Players, resp)
	
	resp.FromTeam(T, BombExploded)
	// fmt.Println(resp)
	T.Broadcast(resp)
	// T.Bombs = append(T.Bombs[:i], T.Bombs[i+1:]...)
	return deadPlayers
}

func (T *Team) RemoveExplosion(bomb *Bomb) {
	// log.Println("Removing explosion")
	bomb.RemoveExplosion(T)
}

// // NewTeam creates a new team.
// func NewTeam(name string, size int) *Team {
// 	t := &Team{
// 		ID:      uuid.New(),
// 		Name:    name,
// 		Players: make(map[uuid.UUID]*Player, MaxPlayers),
// 		State:   Waiting,
// 		GameMap: NewMap(size),
// 		Bombs:   []*Bomb{},
// 		Start:   false,
// 	}
// 	return t
// }

// // RemovePlayer removes the player with the given ID.
// func (t *Team) RemovePlayer(id uuid.UUID) {
// 	t.Lock()
// 	defer t.Unlock()
// 	delete(t.Players, id)
// }

// // UpdatePlayer updates the player with the given ID.
// func (t *Team) UpdatePlayer(id uuid.UUID, player *Player) {
// 	t.Lock()
// 	defer t.Unlock()
// 	t.Players[id] = player
// }

// // GetPlayers returns the players.
// func (t *Team) GetPlayers() map[uuid.UUID]*Player {
// 	t.RLock()
// 	defer t.RUnlock()
// 	return t.Players
// }

// // GetPlayerByNickname returns the player with the given nickname.
// func (t *Team) GetPlayerByNickname(nickname string) *Player {
// 	t.RLock()
// 	defer t.RUnlock()
// 	for _, player := range t.Players {
// 		if player.Nickname == nickname {
// 			return player
// 		}
// 	}
// 	return nil
// }
