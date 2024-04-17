package utils

import (
	"bomberman/config"
	"bomberman/models"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

func PlaceBomb(request *models.Request, conn *websocket.Conn, team *models.Team, player *models.Player) {
	if player.LastBombPlaced.After(time.Now().Add(4*time.Second)) && player.Powers != models.PowerUps[2] {
		// log.Println("PlaceBomb 1", player.LastBombPlaced.After(time.Now().Add(4*time.Second)))
		return
	}
	// player.Lock()

	resp := new(models.Response)
	resp.FromPlayer(player)
	resp.FromBomb(player.Position.X, player.Position.Y, player.Powers)
	team.GameMap.AddBomb(player.Position)
	resp.FromTeam(team, models.PlaceBomb)
	team.Broadcast(resp)
	// player.Unlock()

	player.LastBombPlaced = time.Now()
	go func() {
		time.Sleep(time.Duration(resp.Bomb.Timer) * time.Second)
		deadPlayers := team.ExplodeBomb(resp.Bomb)
		for _, dead := range deadPlayers {
			deadPlayer := team.GetPlayer(uuid.MustParse(dead))
			isDead := deadPlayer.LifeDown()
			response := new(models.Response)
			response.FromPlayer(deadPlayer)
			if isDead {
				response.FromTeam(team, models.PlayerDead)
			} else {
				response.FromTeam(team, models.PlayerEliminated)
			}
			team.Broadcast(response)
			team.AddPlayer(deadPlayer)
		}

		go func() {
			time.Sleep(time.Duration(2) * time.Second)
			// resp.FromTeam(team, models.BombRemoved)
			team.RemoveExplosion(resp.Bomb)
			config.Engine.Update(team.ID, team)
		}()
	}()
	config.Engine.Update(team.ID, team)
}
