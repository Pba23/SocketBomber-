package utils

import (
	"bomberman/config"
	"bomberman/models"

	"github.com/gorilla/websocket"
)

func Move(req *models.Request, Conn *websocket.Conn, team *models.Team, player *models.Player) {
	if player.IsDead() {
		return
	}
	newPosition := &models.Position{
		X: req.Position.X + player.Position.X,
		Y: req.Position.Y + player.Position.Y,
	}
	p1, ok1 := team.Powers[*newPosition]
	if ok1 {
		cell := (*team.GameMap)[newPosition.X][newPosition.Y]
		if cell != "block" && cell != "wall" {
			player.Powers = p1
			delete(team.Powers, *newPosition)
			(*team.GameMap)[newPosition.X][newPosition.Y] = "empty"
		}
	}
	team.AddPlayer(player)
	ok := team.GameMap.CanMove(newPosition, player.Position)
	if !ok {
		// log.Println("Invalid move")
		err := Conn.WriteJSON(map[string]string{"command": "Invalid move"})
		if err != nil {
			return
		}
		return
	}

	if player.Powers == models.PowerUps[0] {
		speed := &models.Position{
			X: req.Position.X + newPosition.X,
			Y: req.Position.Y + newPosition.Y,
		}

		if team.GameMap.CanMove(speed, newPosition) {
			newPosition.X = speed.X
			newPosition.Y = speed.Y
		}

	}

	power, ok := team.Powers[*newPosition]
	if ok {
		cell := (*team.GameMap)[newPosition.X][newPosition.Y]
		if cell != "block" && cell != "wall" {
			player.Powers = power
			delete(team.Powers, *newPosition)
			(*team.GameMap)[newPosition.X][newPosition.Y] = "empty"
		}
	}

	team.GameMap.MovePlayer(player.Position, newPosition, player.ID.String())

	player.SetPosition(newPosition)

	response := new(models.Response)

	response.FromTeam(team, models.Move)
	response.FromPlayer(player)
	response.FromPosition(newPosition.X, newPosition.Y)

	team.Broadcast(response)

	if team.GameMap.IsGameOver() {
		resp := new(models.Response)
		resp.FromTeam(team, models.GameFinished)
		team.Broadcast(resp)
		team.State = models.Finished
	}

	// if player := team.IsWinner(); player != nil {
	// 	resp := new(models.Response)
	// 	resp.FromPlayer(player)
	// 	resp.FromTeam(team, models.GameOver)
	// 	team.Broadcast(resp)
	// 	team.State = models.Finished
	// }

	config.Engine.Update(team.ID, team)
}
