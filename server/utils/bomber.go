package utils

import (
	"bomberman/config"
	"bomberman/models"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

func PlaceBomb(request *models.Request, conn *websocket.Conn, team *models.Team, player *models.Player) {
	if player.IsDead() {
		return
	}
	if !(time.Since(player.LastBombPlaced) > 4*time.Second) && player.Powers != models.PowerUps[2] {
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
			id, err := uuid.Parse(dead)
			if err != nil {
				continue
			}
			deadPlayer := team.GetPlayer(id)
			isDead := deadPlayer.LifeDown()
			response := new(models.Response)
			response.FromPlayer(deadPlayer)
			if isDead {
				// response.FromPlayer(player)
				response.FromTeam(team, models.PlayerDead)
			} else {
				// response.FromPlayer(player)
				response.FromTeam(team, models.PlayerEliminated)
			}
			team.Broadcast(response)
			// team.AddPlayer(deadPlayer)
		}

		go func() {
			time.Sleep(time.Duration(1) * time.Second)
			// resp.FromTeam(team, models.BombRemoved)
			team.RemoveExplosion(resp.Bomb)
			config.Engine.Update(team.ID, team)
		}()
	}()
	config.Engine.Update(team.ID, team)
}
