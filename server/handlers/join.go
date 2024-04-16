package handlers

// inTeam := false

// config.Engine.Range(func(key uuid.UUID, value *models.Team) bool {
// 	if len(value.Players) < models.MaxPlayers && value.State == models.Waiting {
// 		player.MapId = len(value.Players) + 1*2 + 1
// 		player.Avatar = models.Avatars[len(value.Players)]
// 		player.SetTeam(value)
// 		value.AddPlayer(player)
// 		inTeam = true
// 		return false
// 	}
// 	return true
// })

// if !inTeam {
// 	team := models.NewTeam(fmt.Sprintf("Team %d", utils.Engine.Size()), utils.MapSize)
// 	player.MapId = len(team.Players) + 1*2 + 1
// 	player.Avatar = models.Avatars[len(team.Players)]
// 	player.SetTeam(team)
// 	team.AddPlayer(player)
// 	utils.Engine.Add(team.ID, team)
// }

// type response struct {
// 	ID       uuid.UUID `json:"id"`
// 	Nickname string    `json:"nickname"`
// 	Team     struct {
// 		ID    uuid.UUID    `json:"id"`
// 		State models.State `json:"state"`
// 	} `json:"team"`
// }

// resp := new(utils.Response)
// resp.FromTeam(player.Team, player.ID, utils.Join)

// if err := json.NewEncoder(w).Encode(resp); err != nil {
// 	log.Println("Failed to encode response: ", err)
// 	http.Error(w, "Failed to encode response: "+err.Error(), http.StatusInternalServerError)
// }
// }

// import (
// 	"bomberman/models"
// 	"bomberman/utils"
// 	"net/http"
// 	"sync"
// 	"time"

// 	"github.com/google/uuid"
// )

// var mutex = &sync.Mutex{}

// func Game(w http.ResponseWriter, r *http.Request) {
// 	type request struct {
// 		PlayerId uuid.UUID `json:"playerId"`
// 		TeamId   uuid.UUID `json:"teamId"`
// 		Position struct {
// 			X int `json:"x"`
// 			Y int `json:"y"`
// 		} `json:"position"`
// 		Message struct {
// 			Content string `json:"content"`
// 		} `json:"message"`
// 		Type utils.ReqType `json:"type"`
// 	}

// 	conn, err := utils.Upgrader.Upgrade(w, r, nil)
// 	if err != nil {
// 		http.Error(w, err.Error(), http.StatusInternalServerError)
// 		return
// 	}

// 	for {
// 		var req request
// 		err := conn.ReadJSON(&req)
// 		if err != nil {
// 			conn.WriteJSON(map[string]string{"error": err.Error()})
// 			return
// 		}

// 		team := utils.Engine.Get(req.TeamId)
// 		if team == nil {
// 			conn.WriteJSON(map[string]string{"error": "Team not found"})
// 			return
// 		}

// 		if team.State != models.Playing {
// 			conn.WriteJSON(map[string]string{"error": "Game not started or already finished"})
// 			return
// 		}
// 		if !team.Start {
// 			if !team.Start {
// 				go func() {
// 					time.Sleep(10 * time.Second) // wait for 10 seconds

// 					mutex.Lock()

// 					team.Start = true // set team.Start to true
// 					mutex.Unlock()

// 					// save team in engine
// 					utils.Engine.Update(team.ID, team)
// 				}()
// 			}
// 		}
// 		player := team.GetPlayer(req.PlayerId)
// 		if player == nil {
// 			conn.WriteJSON(map[string]string{"error": "Player not found"})
// 			return
// 		}
// 		if req.Type == utils.Chat {
// 			// Assuming your chat message has a "content" field
// 			content := req.Message.Content
// 			author := player.Nickname
// 			// Broadcast the chat message to all players in the team
// 			for _, p := range team.Players {
// 				if p.Conn != nil {
// 					resp := new(utils.Response)
// 					resp.FromTeam(team, p.ID, utils.Chat)
// 					resp.Message.Content = content // Set the chat message content
// 					resp.Message.Author = author
// 					err := p.Conn.WriteJSON(resp)
// 					if err != nil {
// 						continue
// 					}
// 				}
// 			}
// 		} else if req.Type == utils.Join {
// 			player.Conn = conn
// 			if !team.Start {
// 				continue
// 			}
// 		} else if req.Type == utils.Move {
// 			if !team.Start {
// 				continue
// 			}
// 			if player.IsDead() {
// 				continue
// 			}
// 			newPositon := models.Position{}
// 			newPositon.X = req.Position.X + player.Position.X
// 			newPositon.Y = req.Position.Y + player.Position.Y
// 			if power, ok := team.Powers[newPositon]; ok &&
// 				(*team.GameMap)[newPositon.X][newPositon.Y] != 1 &&
// 				(*team.GameMap)[newPositon.X][newPositon.Y] != -1 {
// 				player.Powers = append(player.Powers, power)
// 				delete(team.Powers, newPositon)
// 				(*team.GameMap)[newPositon.X][newPositon.Y] = 0
// 				team.AddPlayer(player)
// 			}
// 			if team.GameMap.CanMove(newPositon, *player.Position) {
// 				team.GameMap.MovePlayer(*player.Position, newPositon, player.MapId)
// 				player.Position.Update(newPositon.X, newPositon.Y)

// 				for _, p := range team.Players {
// 					resp := new(utils.Response)
// 					resp.FromTeam(team, p.ID, utils.GameMapUpdate)
// 					err := p.Conn.WriteJSON(resp)
// 					if err != nil {
// 						continue
// 					}
// 				}
// 			} else {
// 				conn.WriteJSON(map[string]string{"invalid": "Invalid move"})
// 			}

// 		} else if req.Type == utils.PlaceBomb {
// 			if !team.Start {
// 				continue
// 			}
// 			if player.IsDead() {
// 				continue
// 			}
// 			player.Position.Lock()

// 			ok, id := team.PlaceBomb(player.Position.X, player.Position.Y)
// 			for _, p := range team.Players {
// 				resp := new(utils.Response)
// 				resp.FromTeam(team, p.ID, utils.PlaceBomb)
// 				err := p.Conn.WriteJSON(resp)
// 				if err != nil {
// 					continue
// 				}
// 			}
// 			if ok {
// 				go utils.BombPower(team, player, id)
// 			}
// 			player.Position.Unlock()

// 		} else if req.Type == utils.PlaceFlame {
// 			if !team.Start {
// 				continue
// 			}
// 			continue
// 			// utils.FlamePower(team, player)
// 		} else {
// 			if !team.Start {
// 				continue
// 			}
// 			conn.WriteJSON(map[string]string{"error": "Invalid request type"})
// 		}
// 		team.UpdatePlayer(player.ID, player)
// 		isGameOver := true
// 		for _, row := range *team.GameMap {
// 			for _, colum := range row {
// 				if colum == 1 {
// 					isGameOver = false
// 					break
// 				}
// 			}
// 		}
// 		if isGameOver {
// 			team.State = models.Finished
// 			for _, p := range team.Players {
// 				p.Life = 0
// 				team.AddPlayer(p)
// 				resp := new(utils.Response)
// 				resp.FromTeam(team, p.ID, utils.GameOver)
// 				err := p.Conn.WriteJSON(resp)
// 				if err != nil {
// 					continue
// 				}
// 			}

// 		}

// 		utils.Engine.Update(team.ID, team)
// 	}

// }
