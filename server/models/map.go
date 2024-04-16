package models

import (
	"math"
	"math/rand"
	"sort"
	"time"

	"github.com/google/uuid"
)

type Map [][]string

// NewMap creates a new map.
func NewMap(size int) *Map {
	m := make(Map, size)
	for i := range m {
		m[i] = make([]string, size)
		for j := range m[i] {
			if i == 0 || j == 0 || i == size-1 || j == size-1 {
				m[i][j] = "wall"
			} else {
				m[i][j] = "empty"
			}
		}
	}
	return &m
}

func (m *Map) GenerateGameTerrain(numPlayers int) *Map {
	r := rand.New(rand.NewSource(time.Now().UnixNano()))
	for i := range *m {
		for j := range (*m)[i] {
			if i == 0 || j == 0 || i == len(*m)-1 || j == len(*m)-1 {
				(*m)[i][j] = "wall" // wall
			} else {
				blockProbability := 0.5
				wallProbability := 0.1 // Added wall probability
				if j > 0 && (*m)[i][j-1] == "empty" {
					blockProbability += 0.05
				}
				if i > 0 && (*m)[i-1][j] == "empty" {
					blockProbability += 0.05
				}
				if r.Float64() < blockProbability && i != 0 && j != 0 && i != len(*m)-1 && j != len(*m)-1 {
					(*m)[i][j] = "block" // block
				} else if r.Float64() < wallProbability && i != 0 && j != 0 && i != len(*m)-1 && j != len(*m)-1 {
					(*m)[i][j] = "wall" // wall
				} else {
					(*m)[i][j] = "empty" // empty
				}
			}
		}
	}
	return m
}

func (m *Map) GenerateStartingAreas(Players map[uuid.UUID]*Player) map[uuid.UUID]*Position {
	playerPositions := map[uuid.UUID]*Position{}

	// Find all 'empty' cells
	emptyCells := []*Position{}
	for x := range *m {
		for y := range (*m)[x] {
			if (*m)[x][y] == "empty" {
				// Check if the cell has an 'empty' neighbor on both x and y axis
				if (x > 0 && (*m)[x-1][y] == "empty") || (x < len(*m)-1 && (*m)[x+1][y] == "empty") {
					if (y > 0 && (*m)[x][y-1] == "empty") || (y < len(*m)-1 && (*m)[x][y+1] == "empty") {
						p := &Position{}
						p.Update(x, y)
						emptyCells = append(emptyCells, p)
					}
				}
			}
		}
	}

	// Sort the 'empty' cells by their distance to the center of the map
	sort.Slice(emptyCells, func(i, j int) bool {
		p := &Position{}
		p.Update(len(*m)/2, len(*m)/2)
		center := p
		distI := math.Sqrt(math.Pow(float64(emptyCells[i].X-center.X), 2) + math.Pow(float64(emptyCells[i].Y-center.Y), 2))
		distJ := math.Sqrt(math.Pow(float64(emptyCells[j].X-center.X), 2) + math.Pow(float64(emptyCells[j].Y-center.Y), 2))
		return distI < distJ
	})

	// Assign a starting position to each player
	for p := range Players {
		for i, pos := range emptyCells {
			// Check if the position is far enough from all other player positions
			farEnough := true
			for _, playerPos := range playerPositions {
				if math.Sqrt(math.Pow(float64(playerPos.X-pos.X), 2)+math.Pow(float64(playerPos.Y-pos.Y), 2)) < 4 {
					farEnough = false
					break
				}
			}
			if farEnough {
				playerPositions[p] = pos
				m.MovePlayer(&Position{X: pos.X, Y: pos.Y}, pos, p.String())
				// Remove the assigned position from the list of empty cells
				emptyCells = append(emptyCells[:i], emptyCells[i+1:]...)
				break
			}
		}
	}

	return playerPositions
}

// RegeneratePosition regenerates safe positions for single player.
func (m *Map) RegeneratePosition(p *Player) *Position {
	Players := map[uuid.UUID]*Player{}
	Players[p.ID] = p
	playerPositions := m.GenerateStartingAreas(Players)
	return playerPositions[p.ID]
}

// MovePlayer moves the player to the new position.
func (m *Map) MovePlayer(oldPos, newPos *Position, id string) {
	(*m)[oldPos.X][oldPos.Y] = "empty"
	(*m)[newPos.X][newPos.Y] = id
}

func (m *Map) AddBomb(position *Position) {
	(*m)[position.X][position.Y] = "bomb"
}

// isvalid checks if the position is valid and is not a wall.
func (m *Map) IsValid(pos *Position) bool {
	return pos.X >= 0 && pos.X < len(*m) && pos.Y >= 0 && pos.Y < len((*m)[0]) && (*m)[pos.X][pos.Y] != "wall"
}

// CanMove checks if the player can move to the new position.
func (m *Map) CanMove(pos *Position, old *Position) bool {
	if !m.IsValid(pos) {
		return false
	}
	if (pos.X+1 == old.X && pos.Y == old.Y) || (pos.X-1 == old.X && pos.Y == old.Y) || (pos.X == old.X && pos.Y+1 == old.Y) || (pos.X == old.X && pos.Y-1 == old.Y) {
		return (*m)[pos.X][pos.Y] == "empty"
	}
	return false
}

// RemovePlayer removes the player from the map.
// func (m *Map) RemovePlayer(pos Position) {
// 	(*m)[pos.X][pos.Y] = 0
// }

var PowerUps = []string{"speed", "fireflame", "doublebomb"}

// GeneratePowerUp generates a power up on the map.
func (m *Map) GeneratePowerUps() map[Position]string {
	// Generate power ups
	powers := map[Position]string{}
	allblocks := []*Position{}
	for i, row := range *m {
		for j, cell := range row {
			if cell == "block" {
				allblocks = append(allblocks, &Position{X: i, Y: j})
			}
		}
	}
	// generate 10 random power ups using random blocks
	r := rand.New(rand.NewSource(time.Now().UnixNano()))
	for i := 0; i < 10; i++ {
		if len(allblocks) == 0 {
			break
		}
		idx := r.Intn(len(allblocks))
		pos := allblocks[idx]
		power := PowerUps[r.Intn(len(PowerUps))]
		powers[*pos] = power
		allblocks = append(allblocks[:idx], allblocks[idx+1:]...)
	}
	return powers
}
