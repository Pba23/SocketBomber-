package models

import "sync"

// Position represents a position in a sports team.
type Position struct {
	sync.RWMutex
	X int `json:"x"`
	Y int `json:"y"`
}

// Update updates the position.
func (p *Position) Update(x, y int) {
	p.Lock()
	defer p.Unlock()
	p.X = x
	p.Y = y
}
