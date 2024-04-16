package handlers

// import (
// 	"bomberman/models"
// 	"bomberman/utils"
// 	"net/http"
// 	"time"

// 	"github.com/google/uuid"
// )

// var playerCount int
// var timerStarted bool
// var countDown bool = false
// var timerCh <-chan time.Time

// func Waitingpage(w http.ResponseWriter, r *http.Request) {
// 	type request struct {
// 		Type     utils.ReqType `json:"type"`
// 		TeamId   uuid.UUID     `json:"teamId"`
// 		PlayerId uuid.UUID     `json:"playerId"`
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
// 		if req.Type == utils.Join {
// 			team := utils.Engine.Get(req.TeamId)

// 			if team == nil {
// 				conn.WriteJSON(map[string]string{"error": "Team not found"})
// 				conn.Close()
// 				return
// 			}
// 			if team.State != models.Waiting {
// 				conn.WriteJSON(map[string]string{"error": "Game already started or finished"})
// 				conn.Close()
// 				return
// 			}
// 			player := team.GetPlayer(req.PlayerId)
// 			if player == nil {
// 				conn.WriteJSON(map[string]string{"error": "Player not found"})
// 				conn.Close()
// 				return
// 			}

// 			player.Conn = conn

// 			team.UpdatePlayer(player.ID, player)

// 			for id, player := range team.Players {
// 				if player.Conn != nil {
// 					resp := new(utils.Response)
// 					resp.FromTeam(team, id, utils.Join)
// 					err := player.Conn.WriteJSON(resp)
// 					if err != nil {
// 						conn.Close()
// 						team.Players[id].Conn = nil
// 						return
// 					}
// 				}
// 			}

// 			playerCount++
// 			if playerCount == 2 && !timerStarted {
// 				timerCh = time.After(20 * time.Second)
// 				timerStarted = true

// 				for id, player := range team.Players {
// 					if player.Conn != nil {
// 						resp := new(utils.Response)
// 						resp.FromTeam(team, id, utils.Ready)
// 						err := player.Conn.WriteJSON(resp)
// 						if err != nil {
// 							conn.Close()
// 							team.Players[id].Conn = nil
// 							return
// 						}
// 					}
// 				}

// 				go func() {
// 					<-timerCh
// 					team.State = models.Playing
// 					team.GameMap.GenerateGameTerrain(len(team.Players))
// 					positions := team.GameMap.GenerateStartingAreas(team.Players)
// 					team.Powers = team.GameMap.GeneratePowerUps()
// 					for id, player := range team.Players {
// 						team.GameMap.MovePlayer(*player.Position, positions[id], player.MapId)
// 						player.Position.Update(positions[id].X, positions[id].Y)
// 						delete(positions, id)
// 						team.UpdatePlayer(player.ID, player)
// 					}

// 					for id, player := range team.Players {
// 						if player.Conn != nil {
// 							resp := new(utils.Response)
// 							resp.FromTeam(team, id, utils.Playing)
// 							err := player.Conn.WriteJSON(resp)
// 							if err != nil {
// 								conn.Close()
// 								team.Players[id].Conn = nil
// 								return
// 							}
// 						}
// 					}
// 					playerCount = 0
// 					timerStarted = false
// 					timerCh = nil
// 				}()

// 			}

// 			if len(team.Players) == models.MaxPlayers {
// 				team.State = models.Playing
// 				team.GameMap.GenerateGameTerrain(len(team.Players))
// 				positions := team.GameMap.GenerateStartingAreas(team.Players)
// 				for id, player := range team.Players {
// 					team.GameMap.MovePlayer(*player.Position, positions[id], player.MapId)
// 					player.Position.Update(positions[id].X, positions[id].Y)
// 					delete(positions, id)
// 					team.UpdatePlayer(player.ID, player)
// 				}

// 				for id, player := range team.Players {
// 					if player.Conn != nil {
// 						resp := new(utils.Response)
// 						resp.FromTeam(team, id, utils.Playing)
// 						err := player.Conn.WriteJSON(resp)
// 						if err != nil {
// 							conn.Close()
// 							team.Players[id].Conn = nil
// 							return
// 						}
// 					}
// 				}
// 				playerCount = 0
// 				timerStarted = false
// 				timerCh = nil
// 			}
// 			if countDown {
// 				countDown = false
// 			} else if timerStarted {
// 				resp := new(utils.Response)
// 				resp.FromTeam(team, player.ID, utils.Ready)
// 				err := player.Conn.WriteJSON(resp)
// 				if err != nil {
// 					conn.Close()
// 					team.Players[player.ID].Conn = nil
// 					return
// 				}
// 			}

// 			utils.Engine.Update(team.ID, team)
// 		}
// 	}
// }
