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
	MaxPlayers       = 4
)

var Avatars = []string{"👾", "👻", "🤖", "👹", "☠️", "🕵️‍♀️"}

// Rom represents a ROM file.
type Team struct {
	sync.RWMutex
	ID      uuid.UUID             `json:"id"`
	Name    string                `json:"name"`
	Players map[uuid.UUID]*Player `json:"players"`
	State   State                 `json:"state"`
	GameMap *Map                  `json:"map"`
	Bombs   []*Bomb               `json:"bomb"`
	Powers  map[Position]int      `json:"powers"`
	Start   bool                  `json:"start"`
}

type Bomb struct {
	Id       uuid.UUID
	Position Position `json:"position"`
	Timer    int      `json:"timer"`
	Power    int      `json:"power"`
	Exploded bool     `json:"exploded"`
	Type     string   `json:"type"`
}

func (b *Bomb) NewBomb(x, y int, t ...string) {
	b.Position = Position{X: x, Y: y}
	b.Id = uuid.New()
	b.Exploded = false
	b.Timer = 3
	b.Power = 1
	if len(t) > 0 {
		b.Type = t[0]
	} else {
		b.Type = "normal"
	}
}

func (T *Team) PlaceBomb(x, y int) (bool, uuid.UUID) {
	b := &Bomb{}
	b.NewBomb(x, y)
	T.Bombs = append(T.Bombs, b)
	return true, b.Id
}

func (T *Team) ExplodeBomb(id uuid.UUID) []int {
	deadPlayers := []int{}
	for _, b := range T.Bombs {
		if b.Id == id {
			deadPlayers = b.Explode(T.GameMap)
			// T.Bombs = append(T.Bombs[:i], T.Bombs[i+1:]...)
			break
		}
	}
	return deadPlayers
}

func (T *Team) RemoveExplosion(id uuid.UUID) {
	// log.Println("Removing explosion")
	for i, b := range T.Bombs {
		if b.Id == id {
			b.RemoveExplosion(T.GameMap, T.Powers)
			T.Bombs = append(T.Bombs[:i], T.Bombs[i+1:]...)
		}
	}
}

func (b *Bomb) Explode(gameMap *Map) []int {
	b.Timer = 0
	b.Exploded = true
	deadPlayers := []int{}

	cell := (*gameMap)[b.Position.X][b.Position.Y]
	if cell != -1 {
		(*gameMap)[b.Position.X][b.Position.Y] = 100
		if cell > 2 && cell < 100 {
			deadPlayers = append(deadPlayers, cell)
		}
	}
	// Assuming you have a global game map or grid
	// Replace the positions around the bomb with 100
	if b.Position.X+1 < len(*gameMap) {
		cell := (*gameMap)[b.Position.X+1][b.Position.Y]
		if cell != -1 {
			(*gameMap)[b.Position.X+1][b.Position.Y] = 100
			if cell > 2 && cell < 100 {
				deadPlayers = append(deadPlayers, cell)
			}
		}
	}
	if b.Position.X-1 >= 0 {
		cell := (*gameMap)[b.Position.X-1][b.Position.Y]
		if cell != -1 {
			(*gameMap)[b.Position.X-1][b.Position.Y] = 100
			if cell > 2 && cell < 100 {
				deadPlayers = append(deadPlayers, cell)
			}
		}
	}
	if b.Position.Y+1 < len((*gameMap)[0]) {
		cell := (*gameMap)[b.Position.X][b.Position.Y+1]
		if cell != -1 {
			(*gameMap)[b.Position.X][b.Position.Y+1] = 100
			if cell > 2 && cell < 100 {
				deadPlayers = append(deadPlayers, cell)
			}
		}
	}
	if b.Position.Y-1 >= 0 {
		cell := (*gameMap)[b.Position.X][b.Position.Y-1]
		if cell != -1 {
			(*gameMap)[b.Position.X][b.Position.Y-1] = 100
			if cell > 2 && cell < 100 {
				deadPlayers = append(deadPlayers, cell)
			}
		}
	}
	return deadPlayers
}

func (b *Bomb) RemoveExplosion(gameMap *Map, powers map[Position]int) {
	(*gameMap)[b.Position.X][b.Position.Y] = 0
	if power, ok := powers[b.Position]; ok {
		(*gameMap)[b.Position.X][b.Position.Y] = power
	}
	// Replace the positions around the bomb with 0
	if b.Position.X+1 < len(*gameMap) && (*gameMap)[b.Position.X+1][b.Position.Y] != -1 {
		(*gameMap)[b.Position.X+1][b.Position.Y] = 0
		if power, ok := powers[Position{X: b.Position.X + 1, Y: b.Position.Y}]; ok {
			(*gameMap)[b.Position.X+1][b.Position.Y] = power
		}
	}
	if b.Position.X-1 >= 0 && (*gameMap)[b.Position.X-1][b.Position.Y] != -1 {
		(*gameMap)[b.Position.X-1][b.Position.Y] = 0
		if power, ok := powers[Position{X: b.Position.X - 1, Y: b.Position.Y}]; ok {
			(*gameMap)[b.Position.X-1][b.Position.Y] = power
		}
	}
	if b.Position.Y+1 < len((*gameMap)[0]) && (*gameMap)[b.Position.X][b.Position.Y+1] != -1 {
		(*gameMap)[b.Position.X][b.Position.Y+1] = 0
		if power, ok := powers[Position{X: b.Position.X, Y: b.Position.Y + 1}]; ok {
			(*gameMap)[b.Position.X][b.Position.Y+1] = power
		}
	}
	if b.Position.Y-1 >= 0 && (*gameMap)[b.Position.X][b.Position.Y-1] != -1 {
		(*gameMap)[b.Position.X][b.Position.Y-1] = 0
		if power, ok := powers[Position{X: b.Position.X, Y: b.Position.Y - 1}]; ok {
			(*gameMap)[b.Position.X][b.Position.Y-1] = power
		}
	}
	// log.Println("Explosion removed", gameMap)
}

// NewTeam creates a new team.
func NewTeam(name string, size int) *Team {
	t := &Team{
		ID:      uuid.New(),
		Name:    name,
		Players: make(map[uuid.UUID]*Player, MaxPlayers),
		State:   Waiting,
		GameMap: NewMap(size),
		Bombs:   []*Bomb{},
		Start:   false,
	}
	return t
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
