package utils

import (
	"bomberman/models"
	"net/http"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

var (
	Engine   = models.New[uuid.UUID]()
	MapSize  = 15
	Upgrader = websocket.Upgrader{
		ReadBufferSize:  1024,
		WriteBufferSize: 1024,
		CheckOrigin: func(r *http.Request) bool {
			return r.URL.Path == "/gamesocket" || r.URL.Path == "/waitingroom"
		},
	}
)
