package utils

import (
	"bomberman/models"
	"log"
	"time"

	"github.com/google/uuid"
)

func FlamePower(team *models.Team, player *models.Player) {
	log.Println("FlamePower")
	player.Lock()
	defer player.Unlock()
	if player.Life > 0 {
		return
	}
	isPower := false
	for _, p := range player.Powers {
		if p == models.PowerUps[0] {
			isPower = true
			player.Powers = append(player.Powers[:0], player.Powers[1:]...)
			break
		}
	}

	if isPower {
		PlaceFlames(team, player)
		for _, p := range team.Players {
			resp := new(Response)
			resp.FromTeam(team, p.ID, PlaceBomb)
			err := p.Conn.WriteJSON(resp)
			if err != nil {
				continue
			}
		}
		go ActiveFlame(team, player)
	}

}

// placeFlame : Place une bombe sur la carte ;
func PlaceFlames(team *models.Team, player *models.Player) {
	team.Lock()
	defer team.Unlock()
	if player.Life > 0 {
		return
	}
	bomd := new(models.Bomb)
	bomd.NewBomb(player.Position.X, player.Position.Y, "flame")
	team.Bombs = append(team.Bombs, bomd)
	Engine.Update(team.ID, team)
}

// Flammes : Augmente la portée de l'explosion de la bombe dans les quatre directions de 1 bloc ;
func ActiveFlame(team *models.Team, player *models.Player) {
	time.Sleep(3 * time.Second)
	allflamesPositions := make([]models.Position, 0)

	// Generate positions for flames
	directions := []models.Position{
		{X: 0, Y: 1},  // up
		{X: 0, Y: -1}, // down
		{X: 1, Y: 0},  // right
		{X: -1, Y: 0}, // left
	}

	for _, dir := range directions {
		for i := 1; i <= 2; i++ {
			newX := player.Position.X + i*dir.X
			newY := player.Position.Y + i*dir.Y

			// Stop propagation if a -1 cell is encountered
			if (*team.GameMap)[newX][newY] == -1 {
				break
			}

			allflamesPositions = append(allflamesPositions, models.Position{X: newX, Y: newY})
		}
	}

	allflamesPositions = append(allflamesPositions, *player.Position)
	PlayerDeads := []int{}
	for _, p := range allflamesPositions {
		if (*team.GameMap)[p.X][p.Y] >= -1 {
			continue
		}
		PlayerDeads = append(PlayerDeads, (*team.GameMap)[p.X][p.Y])
		(*team.GameMap)[p.X][p.Y] = 200
	}
	for _, v := range team.Players {
		resp := new(Response)
		resp.FromTeam(team, v.ID, BombExploded)
		err := v.Conn.WriteJSON(resp)
		if err != nil {
			continue
		}
	}
	for _, v := range PlayerDeads {
		for _, p := range team.Players {
			if p.MapId == v {
				isdead := p.LifeDown()
				team.AddPlayer(p)
				for _, pp := range team.Players {
					resp := new(Response)
					resp.Value = p.ID
					resp.FromTeam(team, pp.ID, PlayerEliminated)
					err := pp.Conn.WriteJSON(resp)
					if err != nil {
						continue
					}
				}
				if isdead {
					for _, pp := range team.Players {
						resp := new(Response)
						resp.Value = p.ID
						resp.FromTeam(team, pp.ID, PlayerDead)
						err := pp.Conn.WriteJSON(resp)
						if err != nil {
							continue
						}
					}
					team.GameMap.RemovePlayer(*p.Position)
				} else {
					team.GameMap.RegeneratePosition(p)

					team.AddPlayer(p)
					resp := new(Response)
					resp.FromTeam(team, p.ID, GameMapUpdate)
					p.Conn.WriteJSON(resp)
				}
				team.UpdatePlayer(p.ID, p)
			}

		}

	}
	Engine.Update(team.ID, team)
	time.Sleep(2 * time.Second)
	DesableFlame(team, player)
}

func DesableFlame(team *models.Team, player *models.Player) {
	allflamesPositions := make([]models.Position, 0)

	// Generate positions for flames
	directions := []models.Position{
		{X: 0, Y: 1},  // up
		{X: 0, Y: -1}, // down
		{X: 1, Y: 0},  // right
		{X: -1, Y: 0}, // left
	}

	for _, dir := range directions {
		for i := 1; i <= 2; i++ {
			newX := player.Position.X + i*dir.X
			newY := player.Position.Y + i*dir.Y

			// Stop propagation if a -1 cell is encountered
			if (*team.GameMap)[newX][newY] == -1 {
				break
			}

			allflamesPositions = append(allflamesPositions, models.Position{X: newX, Y: newY})
		}
	}

	allflamesPositions = append(allflamesPositions, *player.Position)
	for _, p := range allflamesPositions {
		if (*team.GameMap)[p.X][p.Y] >= -1 {
			continue
		}
		if powers, ok := team.Powers[p]; ok {
			(*team.GameMap)[p.X][p.Y] = powers
		} else {
			(*team.GameMap)[p.X][p.Y] = 0
		}
	}
	for _, p := range team.Players {
		resp := new(Response)
		resp.FromTeam(team, p.ID, GameMapUpdate)
		err := p.Conn.WriteJSON(resp)
		if err != nil {
			continue
		}
	}
	Engine.Update(team.ID, team)
}

func BombPower(team *models.Team, player *models.Player, id uuid.UUID) {
	for _, bomb := range team.Bombs {
		if bomb.Id == id {
			time.Sleep(time.Duration(bomb.Timer) * time.Second)
			deadPlayers := team.ExplodeBomb(bomb.Id)
			for _, v := range deadPlayers {
				for _, p := range team.Players {
					if p.MapId == v {
						isdead := p.LifeDown()
						team.AddPlayer(p)
						for _, pp := range team.Players {
							resp := new(Response)
							resp.Value = p.ID
							resp.FromTeam(team, pp.ID, PlayerEliminated)
							err := pp.Conn.WriteJSON(resp)
							if err != nil {
								continue
							}
						}
						if isdead {
							for _, pp := range team.Players {
								resp := new(Response)
								resp.Value = p.ID
								resp.FromTeam(team, pp.ID, PlayerDead)
								err := pp.Conn.WriteJSON(resp)
								if err != nil {
									continue
								}
							}
							team.GameMap.RemovePlayer(*p.Position)
						} else {
							team.GameMap.RegeneratePosition(p)

							team.AddPlayer(p)
							resp := new(Response)
							resp.FromTeam(team, p.ID, GameMapUpdate)
							p.Conn.WriteJSON(resp)
						}
						team.UpdatePlayer(p.ID, p)
					}

				}
			}
			for _, p := range team.Players {
				resp := new(Response)
				resp.FromTeam(team, p.ID, BombExploded)
				err := p.Conn.WriteJSON(resp)
				if err != nil {
					continue
				}
			}
			time.Sleep(2 * time.Second)
			team.RemoveExplosion(bomb.Id)
			for _, p := range team.Players {
				resp := new(Response)
				resp.FromTeam(team, p.ID, GameMapUpdate)
				err := p.Conn.WriteJSON(resp)
				if err != nil {
					continue
				}
			}
		}
	}
}
