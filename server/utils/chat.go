package utils

import (
	"bomberman/models"

	"github.com/gorilla/websocket"
)

func Chat(request *models.Request, conn *websocket.Conn, team *models.Team, player *models.Player) {
	resp := new(models.Response)
	resp.FromTeam(team, models.Chat)
	resp.FromPlayer(player)
	resp.FromMessage(request.Message.Content)
	team.Broadcast(resp)
}
