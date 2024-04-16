package config

import (
	"bomberman/models"

	"github.com/google/uuid"
)

var (
	Engine  = models.New[uuid.UUID]()
	MapSize = 20
)
