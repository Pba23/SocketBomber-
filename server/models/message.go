package models

import "github.com/google/uuid"

type Message struct {
	PlayerId uuid.UUID `json:"playerId"`
	TeamId   uuid.UUID `json:"teamId"`
	Content  string    `json:"content"`
}

