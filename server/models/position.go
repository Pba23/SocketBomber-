package models

// Position represents a position in a sports team.
type Position struct {
	X int `json:"x"`
	Y int `json:"y"`
}

// Update updates the position.
func (p *Position) Update(x, y int) {
	p.X = x
	p.Y = y
}