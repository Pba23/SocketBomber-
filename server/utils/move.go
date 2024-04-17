package utils

import (
	"bomberman/config"
	"bomberman/models"

	"github.com/gorilla/websocket"
)

func Move(req *models.Request, Conn *websocket.Conn, team *models.Team, player *models.Player) {
	// player.Unlock()
	// defer player.Unlock()

	// Position := &models.Position{
	// 	X: player.Position.X,
	// 	Y: player.Position.Y,
	// }

	newPosition := &models.Position{
		X: req.Position.X + player.Position.X,
		Y: req.Position.Y + player.Position.Y,
	}
	p1, ok1 := team.Powers[*newPosition]
	if ok1 {
		player.Powers = p1
	}

	if player.Powers == models.PowerUps[0] {
		newPosition.X = newPosition.X + 1
		newPosition.Y = newPosition.Y + 1
	}

	power, ok := team.Powers[*newPosition]
	if ok {
		player.Powers = power
	}

	team.AddPlayer(player)
	ok = team.GameMap.CanMove(newPosition, player.Position)
	if !ok {
		// log.Println("Invalid move")
		err := Conn.WriteJSON(map[string]string{"command": "Invalid move"})
		if err != nil {
			return
		}
		return
	}

	team.GameMap.MovePlayer(player.Position, newPosition, player.ID.String())

	player.SetPosition(newPosition)

	response := new(models.Response)

	response.FromTeam(team, models.Move)
	response.FromPlayer(player)
	response.FromPosition(newPosition.X, newPosition.Y)

	team.Broadcast(response)
	config.Engine.Update(team.ID, team)
}
